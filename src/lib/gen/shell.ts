/**
 * IR → bash / zsh source.
 *
 * Two output modes:
 *  - static   a single PS1/PROMPT assignment, for prompts with no runtime logic
 *  - function a prompt function run before every prompt (PROMPT_COMMAND /
 *             precmd) that assembles PS1 from the current state
 *
 * Dynamic values (branch names, paths, env vars) are never pasted into the
 * prompt string. They are stored in variables that the prompt string
 * references, and the shell does not expand the result of an expansion again,
 * so a directory named `$(rm -rf ~)` is printed, not run.
 */
import type { Palette } from '../../data/palette-types';
import { walkOps } from '../compile';
import { bashEsc, zshEsc } from '../escapes';
import type { Color, Cond, Dir, Line, Op, Program, SGR, StyleChoice, VarRef } from '../ir';
import type { ColorDepth } from '../model';
import { escWidthProvider, sq, type Provider } from '../providers';
import { bgParams, convertColor, fgParams, hasVariants, pick, separatorGlyphs, sgrParams, type Depth, type SepGlyphs } from '../sgr';
import { strWidth } from '../wcwidth';

export type Shell = 'bash' | 'zsh';

export interface GenOptions {
  shell: Shell;
  depth: ColorDepth;
  palette: Palette;
  name: string;
  /** Link back to the prompt in Bashin, written into the header. */
  link?: string;
}

export interface GenStats {
  mode: 'static' | 'function';
  /** Worst-case processes forked per prompt. */
  forks: number;
  forkNotes: string[];
  /** Oldest bash that runs every feature. */
  bashMin: string;
  nerd: boolean;
  lines: number;
}

export interface GenResult {
  code: string;
  /** Element id → [first, last] source line (1-based). */
  ranges: Record<string, [number, number]>;
  stats: GenStats;
}

const DEPTHS: Depth[] = ['truecolor', '256', '16'];
const PUA = /[\u{e000}-\u{f8ff}\u{f0000}-\u{ffffd}]/u;

// ── quoting ──────────────────────────────────────────────────────────────────

/** Literal text → characters that survive PS1 decoding and expansion unchanged. */
function bashLit(s: string): string {
  return s.replace(/\\/g, '\\\\\\\\').replace(/\$/g, '\\\\$').replace(/`/g, '\\\\`');
}

/** Literal text → characters that survive zsh prompt expansion (with PROMPT_SUBST). */
function zshLit(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '%%').replace(/\$/g, '\\$').replace(/`/g, '\\`');
}

/** zsh $'…' quoting. */
function dq(s: string): string {
  return (
    "$'" +
    s
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\x1b/g, '\\e')
      .replace(/\n/g, '\\n')
      .replace(/\x07/g, '\\a') +
    "'"
  );
}

/** Join shell word fragments, merging adjacent single-quoted strings. */
function joinWords(frags: string[]): string {
  let out = '';
  for (const f of frags) {
    if (!f) continue;
    if (out.endsWith("'") && f.startsWith("'") && !out.endsWith("\\'")) out = out.slice(0, -1) + f.slice(1);
    else out += f;
  }
  return out || "''";
}

// ── naming ───────────────────────────────────────────────────────────────────

function describeColor(c: Color | undefined, palette: Palette): string {
  if (!c) return '';
  if (c.k === 'idx') return c.i < 16 ? `ansi ${c.i}` : `color ${c.i}`;
  const hex = `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  const token = Object.entries(palette.tokens).find(([, h]) => h.toLowerCase() === hex)?.[0];
  return token ?? hex;
}

function describe(s: SGR, palette: Palette): string {
  const parts: string[] = [];
  if (s.fg) parts.push(describeColor(s.fg, palette));
  if (s.bg) parts.push(`on ${describeColor(s.bg, palette)}`);
  for (const a of ['bold', 'dim', 'italic', 'underline', 'blink', 'reverse', 'strike', 'overline'] as const)
    if (s[a]) parts.push(a);
  return parts.join(' ') || 'reset';
}

// ── code writer ──────────────────────────────────────────────────────────────

class Writer {
  lines: string[] = [];
  private depth = 0;
  ranges: Record<string, [number, number]> = {};
  private open: string | null = null;

  line(s = '') {
    this.lines.push(s ? '  '.repeat(this.depth) + s : '');
  }
  indent() {
    this.depth++;
  }
  dedent() {
    this.depth = Math.max(0, this.depth - 1);
  }
  block(text: string) {
    for (const l of text.split('\n')) this.line(l);
  }
  tag(id: string | null) {
    if (this.open) {
      const r = this.ranges[this.open];
      if (r) r[1] = Math.max(r[0], this.lines.length);
    }
    this.open = id;
    if (id) {
      const start = this.lines.length + 1;
      const prev = this.ranges[id];
      this.ranges[id] = prev ? [prev[0], start] : [start, start];
    }
  }
}

// ── generator ────────────────────────────────────────────────────────────────

interface StyleEntry {
  sgr: SGR;
  name: string;
}

export function generate(prog: Program, opts: GenOptions): GenResult {
  return new Generator(prog, opts).run();
}

class Generator {
  private readonly zsh: boolean;
  private readonly depths: Depth[];
  private readonly styles = new Map<string, StyleEntry>();
  private readonly rawStyles = new Map<string, StyleEntry>();
  private readonly colors = new Map<string, { c: Color; n: number }>();
  private readonly providers = new Map<string, Provider>();
  private readonly varNames = new Map<string, Record<string, string>>();
  private readonly slugCount = new Map<string, number>();
  private w = new Writer();

  private readonly prog: Program;
  private readonly o: GenOptions;

  constructor(prog: Program, o: GenOptions) {
    this.prog = prog;
    this.o = o;
    this.zsh = o.shell === 'zsh';
    this.depths = o.depth === 'auto' ? DEPTHS : [o.depth];
    const sorted = [...prog.providers].sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
    for (const [k, p] of sorted) this.providers.set(k, p);
    // Measuring a line with a fill needs the expanded width of its native escapes.
    for (const line of prog.lines) {
      if (!line.fills) continue;
      walkOps(line.ops, (op) => {
        if (op.t === 'esc') {
          const p = escWidthProvider(op.e, op.fmt);
          if (!this.providers.has(p.key)) this.providers.set(p.key, p);
        }
      });
    }
    let i = 0;
    for (const [key, p] of this.providers) {
      const slug = p.slug === 'w' ? `w${++i}` : p.slug;
      const n = (this.slugCount.get(slug) ?? 0) + 1;
      this.slugCount.set(slug, n);
      const base = n === 1 ? slug : `${slug}${n}`;
      this.varNames.set(key, Object.fromEntries(p.vars.map((v) => [v, `__bashin_${base}_${v}`])));
    }
  }

  private get isStatic(): boolean {
    if (this.prog.providers.size || this.prog.newlineBefore) return false;
    let dynamic = false;
    for (const line of this.prog.lines) {
      if (line.fills) return false;
      walkOps(line.ops, (op) => {
        if (op.t === 'if' || op.t === 'join' || op.t === 'var') dynamic = true;
        if (op.t === 'sty' && hasVariants(op.s)) dynamic = true;
        if (op.t === 'seg' && (hasVariants(op.bg) || hasVariants(op.text))) dynamic = true;
      });
    }
    return !dynamic;
  }

  private v(ref: VarRef): string {
    return this.varNames.get(ref.p)?.[ref.n] ?? '__bashin_unknown';
  }

  // ── styles ────────────────────────────────────────────────────────────────

  private styleVar(s: SGR, raw: boolean): string {
    const key = JSON.stringify(s);
    const map = raw ? this.rawStyles : this.styles;
    let e = map.get(key);
    if (!e) {
      const n = key === '{}' ? 0 : [...map.keys()].filter((k) => k !== '{}').length + 1;
      e = { sgr: s, name: `${raw ? '__bashin_r' : '__bashin_s'}${n}` };
      map.set(key, e);
    }
    return '$' + e.name;
  }

  private sgrFor(s: SGR, d: Depth) {
    return sgrParams(s, d, this.o.palette);
  }

  private styleValue(s: SGR, d: Depth, raw: boolean): string {
    const p = this.sgrFor(s, d);
    if (this.zsh) return dq(`%{\x1b[${p}m%}`);
    return raw ? `'\\e[${p}m'` : `'\\[\\e[${p}m\\]'`;
  }

  /** Segment color params: inline in fixed depth, variables in auto. */
  private colorArg(c: Color | undefined, as: 'bg' | 'fg'): string {
    if (!c) return as === 'bg' ? "'49'" : "'39'";
    if (this.depths.length === 1) {
      const cc = convertColor(c, this.depths[0], this.o.palette);
      return sq(as === 'bg' ? bgParams(cc) : fgParams(cc));
    }
    const key = JSON.stringify(c);
    let e = this.colors.get(key);
    if (!e) {
      e = { c, n: this.colors.size + 1 };
      this.colors.set(key, e);
    }
    return `"$__bashin_${as === 'bg' ? 'k' : 'f'}${e.n}"`;
  }

  // ── conditions ────────────────────────────────────────────────────────────

  private cond(c: Cond): { arith: boolean; s: string } {
    const ssh = '${SSH_CONNECTION:-}${SSH_CLIENT:-}${SSH_TTY:-}';
    switch (c.k) {
      case 'true':
        return { arith: true, s: '1' };
      case 'err':
        return { arith: true, s: 'rc' };
      case 'ok':
        return { arith: true, s: '!rc' };
      case 'root':
        return { arith: true, s: 'EUID == 0' };
      case 'user':
        return { arith: true, s: 'EUID != 0' };
      case 'ssh':
        return { arith: false, s: `[[ -n ${ssh} ]]` };
      case 'local':
        return { arith: false, s: `[[ -z ${ssh} ]]` };
      case 'set':
        return { arith: false, s: `[[ -n $${this.v(c.v)} ]]` };
      case 'gt':
        return { arith: true, s: `${this.v(c.v)} > ${c.n}` };
      case 'not': {
        const x = this.cond(c.c);
        return x.arith ? { arith: true, s: `!(${x.s})` } : { arith: false, s: `! ${x.s}` };
      }
      case 'and':
      case 'or': {
        const parts = c.c.map((x) => this.cond(x));
        const op = c.k === 'and' ? '&&' : '||';
        if (parts.every((p) => p.arith)) return { arith: true, s: parts.map((p) => (parts.length > 1 && /&&|\|\|/.test(p.s) ? `(${p.s})` : p.s)).join(` ${op} `) };
        return {
          arith: false,
          s: parts.map((p) => (p.arith ? `(( ${p.s} ))` : /&&|\|\|/.test(p.s) ? `{ ${p.s}; }` : p.s)).join(` ${op} `),
        };
      }
    }
  }

  private test(c: Cond): string {
    const x = this.cond(c);
    return x.arith ? `(( ${x.s} ))` : x.s;
  }

  // ── run ───────────────────────────────────────────────────────────────────

  run(): GenResult {
    const body = new Writer();
    const isStatic = this.isStatic;
    // Generate the body first so the style table is known, then write the file.
    this.w = body;
    if (isStatic) this.staticBody();
    else this.functionBody();

    const out = new Writer();
    this.w = out;
    this.header(isStatic);
    this.styleTable();
    if (!isStatic) this.initCode();
    const offset = out.lines.length;
    for (const l of body.lines) out.lines.push(l);
    this.footer(isStatic);
    const ranges: Record<string, [number, number]> = {};
    for (const [id, [a, b]] of Object.entries(body.ranges)) ranges[id] = [a + offset, b + offset];

    const code = out.lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
    return { code, ranges, stats: this.stats(isStatic, code) };
  }

  private stats(isStatic: boolean, code: string): GenStats {
    let forks = 0;
    const forkNotes: string[] = [];
    let bashMin = '3.2';
    for (const p of this.providers.values()) {
      if (p.cost && p.cost.forks > 0) {
        forks += p.cost.forks;
        forkNotes.push(p.cost.note);
      }
      if (p.bashMin && p.bashMin > bashMin) bashMin = p.bashMin;
    }
    return { mode: isStatic ? 'static' : 'function', forks, forkNotes, bashMin, nerd: PUA.test(code), lines: code.split('\n').length };
  }

  private header(isStatic: boolean) {
    const w = this.w;
    const sh = this.zsh ? 'zsh' : 'bash';
    const rc = this.zsh ? '~/.zshrc' : '~/.bashrc';
    w.line(`# ── Bashin prompt · ${this.o.name.replace(/[\r\n]/g, ' ')} ${'─'.repeat(Math.max(4, 58 - this.o.name.length))}`);
    w.line('# Made with Bashin — https://cardondev.github.io/bashin/');
    if (this.o.link) w.line(`# Edit this prompt: ${this.o.link}`);
    w.line(`# Paste into ${rc}, or save it as ~/.config/bashin/prompt.${sh} and source it.`);
    const needs: string[] = [];
    if (!this.zsh) needs.push(isStatic ? 'bash 3.2+' : 'bash 3.2+ (4.4+ for every feature)');
    else needs.push('zsh 5.1+');
    needs.push('a UTF-8 locale');
    const colors = this.colorKinds();
    if (this.o.depth === 'truecolor' && colors.rgb) needs.push('a truecolor terminal');
    if (this.o.depth === '256' && (colors.rgb || colors.x256)) needs.push('a 256-color terminal');
    w.line(`# Needs ${needs.join(', ')}.`);
    w.line(`# ${'─'.repeat(76)}`);
    w.line();
    if (this.zsh) {
      w.line('setopt prompt_subst prompt_percent');
      if (!isStatic) w.line('autoload -Uz add-zsh-hook');
    } else {
      w.line(isStatic ? 'shopt -s promptvars' : 'shopt -s checkwinsize promptvars');
    }
    w.line();
  }

  private styleTable() {
    const all = [...this.styles.values(), ...this.rawStyles.values()];
    if (!all.length && !this.colors.size) return;
    const w = this.w;
    const defs = (d: Depth) => {
      const out: string[] = [];
      const sorted = [...this.styles.values()].sort((a, b) => num(a.name) - num(b.name));
      const rows: [string, string][] = [
        ...sorted.map((e) => [`${e.name}=${this.styleValue(e.sgr, d, false)}`, describe(e.sgr, this.o.palette)] as [string, string]),
        ...[...this.rawStyles.values()].map(
          (e) => [`${e.name}=${this.styleValue(e.sgr, d, true)}`, `${describe(e.sgr, this.o.palette)}, for the right prompt`] as [string, string],
        ),
      ];
      const width = Math.max(0, ...rows.map(([a]) => [...a].length)) + 2;
      for (const [a, comment] of rows) out.push(`${a}${' '.repeat(width - [...a].length)}# ${comment}`);
      for (const { c, n } of this.colors.values()) {
        const cc = convertColor(c, d, this.o.palette);
        out.push(`__bashin_k${n}='${bgParams(cc)}' __bashin_f${n}='${fgParams(cc)}'   # segment color ${describeColor(c, this.o.palette)}`);
      }
      return out;
    };
    if (this.depths.length === 1) {
      w.line(`# Styles (${this.depths[0] === 'truecolor' ? '24-bit color' : this.depths[0] + ' colors'})`);
      for (const l of defs(this.depths[0])) w.line(l);
    } else {
      w.line("# Styles, picked for the terminal's color depth");
      w.line('if [[ ${COLORTERM:-} == *truecolor* || ${COLORTERM:-} == *24bit* ]]; then');
      w.indent();
      for (const l of defs('truecolor')) w.line(l);
      w.dedent();
      w.line('elif [[ ${TERM:-} == *256color* ]]; then');
      w.indent();
      for (const l of defs('256')) w.line(l);
      w.dedent();
      w.line('else');
      w.indent();
      for (const l of defs('16')) w.line(l);
      w.dedent();
      w.line('fi');
    }
    w.line();
  }

  private initCode() {
    const w = this.w;
    const helpers = new Map<string, string>();
    const inits: string[] = [];
    for (const [key, p] of this.providers) {
      const code = this.zsh ? p.zsh(this.varNames.get(key)!) : p.bash(this.varNames.get(key)!);
      if (code.init) inits.push(code.init);
      for (const [name, text] of Object.entries(code.helpers ?? {})) if (!helpers.has(name)) helpers.set(name, text);
    }
    for (const text of inits) {
      w.block(text);
      w.line();
    }
    for (const text of helpers.values()) {
      w.block(text);
      w.line();
    }
    if (this.usesSegments()) {
      w.block(this.segHelpers());
      w.line();
    }
    if (this.usesFill()) {
      w.line('# __bashin_fill N CHAR — N copies of CHAR in $__bashin_pad');
      w.line("__bashin_fill() { printf -v __bashin_pad '%*s' \"$1\" ''; __bashin_pad=${__bashin_pad// /$2}; }");
      w.line();
    }
  }

  /** Which kinds of color the prompt uses (16-color-only prompts need no truecolor). */
  private colorKinds(): { rgb: boolean; x256: boolean } {
    const k = { rgb: false, x256: false };
    const see = (c: Color | undefined) => {
      if (!c) return;
      if (c.k === 'rgb') k.rgb = true;
      else if (c.i >= 16) k.x256 = true;
    };
    const seeChoice = (c: StyleChoice) => {
      for (const x of [c.b, c.r, c.e, c.re]) {
        if (!x) continue;
        see(x.fg);
        see(x.bg);
      }
    };
    for (const l of this.prog.lines)
      walkOps(l.ops, (op) => {
        if (op.t === 'sty' || op.t === 'fill') seeChoice(op.s);
        else if (op.t === 'seg') {
          seeChoice(op.bg);
          seeChoice(op.text);
        }
      });
    if (this.prog.ps2) seeChoice(this.prog.ps2.s);
    return k;
  }

  private usesSegments(): boolean {
    let used = false;
    for (const l of this.prog.lines) walkOps(l.ops, (op) => (used ||= op.t === 'seg'));
    return used;
  }

  private usesFill(): boolean {
    return this.prog.lines.some((l, i) => l.fills > 0 && i < this.prog.lines.length - 1);
  }

  private segHelpers(): string {
    const st = this.prog.separator;
    const r = separatorGlyphs(st, 'r')!;
    const l = separatorGlyphs(st, 'l')!;
    // SGR wrapped in the prompt's invisible markers ($o/$c), with shell words spliced in
    const e = (params: string) => (this.zsh ? `$o$'\\e[${params}m'$c` : `$o'\\e[${params}m'$c`);
    const g = (x: string) => (x ? sq(x) : '');
    const add = (glyph: string) => `(( w += ${strWidth(glyph)} ))`;
    const open = (name: string, gl: SepGlyphs, left: boolean) =>
      [
        `${name}() {`,
        '  if [[ -z $pl ]]; then',
        gl.start ? `    b+=${e("0;'$2'")}${g(gl.start)}; ${add(gl.start)}` : '    :',
        '  elif [[ $pl == "$2" ]]; then',
        `    b+=${e("0;'$3';'$1'")}${g(gl.thin)}; ${add(gl.thin)}`,
        '  else',
        `    b+=${left ? e("0;'$2';'$pk'") : e("0;'$pl';'$1'")}${g(gl.sep)}; ${add(gl.sep)}`,
        '  fi',
        '  pl=$2 pk=$1',
        '}',
      ].join('\n');
    const close = (name: string, gl: SepGlyphs) =>
      [
        `${name}() {`,
        `  if [[ -n $pl ]]; then b+=${gl.end ? e("0;'$pl'") + g(gl.end) + e('0') : e('0')}; ${add(gl.end)}; fi`,
        "  pl='' pk=''",
        '}',
      ].join('\n');
    const parts = [
      '# Powerline segments. __bashin_seg BG FG TEXT opens a segment with background',
      '# BG (SGR parameters); FG is the same color as a foreground and TEXT the text',
      '# color, used for the thin separator between segments of the same color.',
      open('__bashin_seg', r, false),
      close('__bashin_seg_end', r),
    ];
    const usesLeft = this.prog.lines.some((ln) => {
      let left = false;
      walkOps(ln.ops, (op) => (left ||= op.t === 'seg' && op.dir === 'l'));
      return left;
    });
    if (usesLeft) {
      parts.push('# Right-aligned segments (after a fill) point the other way.');
      parts.push(open('__bashin_segl', l, true));
      parts.push(close('__bashin_segl_end', l));
    }
    return parts.join('\n');
  }

  // ── static ────────────────────────────────────────────────────────────────

  private staticSource(d: Depth): string {
    let src = '';
    let pl = '';
    let pk = '';
    // Styles are emitted lazily, right before the text they color, so resets
    // between same-colored elements disappear and a colorless prompt stays
    // escape-free.
    let cur = '0';
    let want = '0';
    let inTitle = false;
    const st = (p: string) => (this.zsh ? `%{\x1b[${p}m%}` : `\\[\\e[${p}m\\]`);
    const out = (text: string) => {
      if (!text) return;
      if (!inTitle && want !== cur) {
        src += st(want);
        cur = want;
      }
      src += text;
    };
    const lit = (s: string) => out(this.zsh ? zshLit(s) : bashLit(s));
    const run = (ops: Op[]) => {
      for (const op of ops) {
        switch (op.t) {
          case 'lit':
            lit(op.s);
            break;
          case 'esc':
            out(this.zsh ? zshEsc(op.e, op.fmt) : bashEsc(op.e, op.fmt));
            break;
          case 'sty':
            want = sgrParams(op.s.b, d, this.o.palette);
            break;
          case 'seg': {
            const g = separatorGlyphs(this.prog.separator, op.dir)!;
            const bg = op.bg.b.bg ? convertColor(op.bg.b.bg, d, this.o.palette) : undefined;
            const bgP = bg ? bgParams(bg) : '49';
            const bfP = bg ? fgParams(bg) : '39';
            const fg = op.text.b.fg ? convertColor(op.text.b.fg, d, this.o.palette) : undefined;
            const tP = fg ? fgParams(fg) : '39';
            if (!pl) {
              if (g.start) {
                want = `0;${bfP}`;
                lit(g.start);
              }
            } else if (pl === bfP) {
              want = `0;${tP};${bgP}`;
              lit(g.thin);
            } else {
              want = op.dir === 'r' ? `0;${pl};${bgP}` : `0;${bfP};${pk}`;
              lit(g.sep);
            }
            pl = bfP;
            pk = bgP;
            break;
          }
          case 'segEnd': {
            if (!pl) break;
            const g = separatorGlyphs(this.prog.separator, op.dir)!;
            if (g.end) {
              want = `0;${pl}`;
              lit(g.end);
            }
            want = '0';
            pl = pk = '';
            break;
          }
          case 'title': {
            src += this.zsh ? '%{\x1b]0;' : '\\[\\e]0;';
            inTitle = true;
            run(op.body);
            inTitle = false;
            src += this.zsh ? '\x07%}' : '\\a\\]';
            break;
          }
          case 'tag':
            this.w.tag(op.id);
            break;
          default:
            break;
        }
      }
    };
    this.prog.lines.forEach((line, i) => {
      run(line.ops);
      want = '0';
      if (cur !== '0') {
        src += st('0');
        cur = '0';
      }
      if (i < this.prog.lines.length - 1) src += this.zsh ? '\n' : '\\n';
    });
    return src;
  }

  private staticBody() {
    const w = this.w;
    const target = this.zsh ? 'PROMPT' : 'PS1';
    const assign = (d: Depth) => {
      const src = this.staticSource(d);
      return `${target}=${this.zsh ? dq(src) : sq(src)}`;
    };
    if (this.depths.length === 1) w.line(assign(this.depths[0]));
    else {
      w.line('if [[ ${COLORTERM:-} == *truecolor* || ${COLORTERM:-} == *24bit* ]]; then');
      w.indent();
      w.line(assign('truecolor'));
      w.dedent();
      w.line('elif [[ ${TERM:-} == *256color* ]]; then');
      w.indent();
      w.line(assign('256'));
      w.dedent();
      w.line('else');
      w.indent();
      w.line(assign('16'));
      w.dedent();
      w.line('fi');
    }
    if (this.zsh) w.line("RPROMPT=''");
    w.tag(null);
  }

  // ── function mode ─────────────────────────────────────────────────────────

  private frags: string[] = [];
  private fw = 0;
  private fwExpr: string[] = [];
  private track = false;
  private raw = false;

  private lastStyle: string | null = null;

  private add(frag: string, width = 0, widthExpr?: string) {
    if (/^\$__bashin_[sr]\d+$/.test(frag)) {
      // every style starts with a reset, so a style straight after another wins
      if (frag === this.lastStyle) return;
      const last = this.frags[this.frags.length - 1];
      if (last && /^\$__bashin_[sr]\d+$/.test(last)) this.frags.pop();
      this.lastStyle = frag;
    }
    this.frags.push(frag);
    this.fw += width;
    if (widthExpr) this.fwExpr.push(widthExpr);
  }

  private flush() {
    if (this.frags.length) this.w.line(`b+=${joinWords(this.frags)}`);
    if (this.track && (this.fw || this.fwExpr.length)) {
      const terms = [...(this.fw ? [String(this.fw)] : []), ...this.fwExpr];
      this.w.line(`(( w += ${terms.join(' + ')} ))`);
    }
    this.frags = [];
    this.fw = 0;
    this.fwExpr = [];
  }

  private litFrag(s: string): string {
    return sq(this.zsh ? zshLit(s) : bashLit(s));
  }

  private emitStyle(c: StyleChoice) {
    if (!hasVariants(c)) {
      this.add(this.styleVar(c.b, this.raw));
      return;
    }
    this.flush();
    this.lastStyle = null;
    const v = (root: boolean, err: boolean) => this.styleVar(pick(c, root, err), this.raw);
    const byErr = (root: boolean) => {
      const a = v(root, true);
      const b = v(root, false);
      return a === b ? `b+=${a}` : `if (( rc )); then b+=${a}; else b+=${b}; fi`;
    };
    const rootBranch = byErr(true);
    const userBranch = byErr(false);
    if (rootBranch === userBranch) this.w.line(userBranch);
    else if (!rootBranch.startsWith('if') && !userBranch.startsWith('if'))
      this.w.line(`if (( EUID == 0 )); then ${rootBranch}; else ${userBranch}; fi`);
    else {
      this.w.line('if (( EUID == 0 )); then');
      this.w.indent();
      this.w.line(rootBranch);
      this.w.dedent();
      this.w.line('else');
      this.w.indent();
      this.w.line(userBranch);
      this.w.dedent();
      this.w.line('fi');
    }
  }

  private emitSeg(op: Extract<Op, { t: 'seg' }>) {
    this.flush();
    const fn = op.dir === 'l' ? '__bashin_segl' : '__bashin_seg';
    const call = (root: boolean, err: boolean) => {
      const bg = pick(op.bg, root, err).bg;
      const fg = pick(op.text, root, err).fg;
      return `${fn} ${this.colorArg(bg, 'bg')} ${this.colorArg(bg, 'fg')} ${this.colorArg(fg, 'fg')}`;
    };
    if (!hasVariants(op.bg) && !hasVariants(op.text)) {
      this.w.line(call(false, false));
      return;
    }
    const pairs: [boolean, boolean][] = [
      [true, true],
      [true, false],
      [false, true],
      [false, false],
    ];
    const [rr, ru, ur, uu] = pairs.map(([a, b]) => call(a, b));
    const rootB = rr === ru ? rr : `if (( rc )); then ${rr}; else ${ru}; fi`;
    const userB = ur === uu ? uu : `if (( rc )); then ${ur}; else ${uu}; fi`;
    if (rootB === userB) this.w.line(userB);
    else this.w.line(`if (( EUID == 0 )); then ${rootB}; else ${userB}; fi`);
  }

  private emitOps(ops: Op[]) {
    for (const op of ops) {
      switch (op.t) {
        case 'lit':
          if (op.s) this.add(this.litFrag(op.s), strWidth(op.s));
          break;
        case 'esc': {
          const e = this.zsh ? zshEsc(op.e, op.fmt) : bashEsc(op.e, op.fmt);
          let expr: string | undefined;
          if (this.track) {
            const p = escWidthProvider(op.e, op.fmt);
            const name = this.varNames.get(p.key)?.v;
            expr = name ? (this.zsh ? `\${(m)#${name}}` : `\${#${name}}`) : undefined;
          }
          this.add(sq(e), 0, expr);
          break;
        }
        case 'var': {
          const name = this.v(op.v);
          this.add(this.zsh ? `'\${${name}//\\%/%%}'` : `'\${${name}}'`, 0, this.zsh ? `\${(m)#${name}}` : `\${#${name}}`);
          break;
        }
        case 'sty':
          this.emitStyle(op.s);
          break;
        case 'rsty':
          break;
        case 'if': {
          this.flush();
          const before = this.lastStyle;
          this.w.line(`if ${this.test(op.c)}; then`);
          this.w.indent();
          this.emitOps(op.then);
          this.flush();
          this.w.dedent();
          if (op.else?.length) {
            this.lastStyle = before;
            this.w.line('else');
            this.w.indent();
            this.emitOps(op.else);
            this.flush();
            this.w.dedent();
          }
          this.w.line('fi');
          this.lastStyle = null;
          break;
        }
        case 'join': {
          this.flush();
          this.lastStyle = null;
          const sep = op.sep;
          if (sep) this.w.line("j=''");
          for (const it of op.items) {
            const always = it.c.k === 'true';
            if (!always) {
              this.w.line(`if ${this.test(it.c)}; then`);
              this.w.indent();
            }
            if (sep) {
              const tw = this.track ? `; (( w += ${strWidth(sep)} ))` : '';
              this.w.line(`[[ -n $j ]] && { b+=${this.litFrag(sep)}${tw}; }`);
            }
            this.emitOps(it.ops);
            this.flush();
            if (sep) this.w.line('j=1');
            if (!always) {
              this.w.dedent();
              this.w.line('fi');
            }
            this.lastStyle = null;
          }
          break;
        }
        case 'seg':
          this.emitSeg(op);
          this.lastStyle = null;
          break;
        case 'segEnd':
          this.flush();
          this.w.line(op.dir === 'l' ? '__bashin_segl_end' : '__bashin_seg_end');
          this.lastStyle = null;
          break;
        case 'title': {
          const zr = this.zsh;
          this.add(zr ? (this.raw ? dq('\x1b]0;') : dq('%{\x1b]0;')) : this.raw ? `'\\e]0;'` : `'\\[\\e]0;'`);
          const saveTrack = this.track;
          this.track = false;
          for (const b of op.body) {
            if (b.t === 'lit') this.add(this.litFrag(b.s));
            else if (b.t === 'esc') this.add(sq(zr ? zshEsc(b.e, b.fmt) : bashEsc(b.e, b.fmt)));
            else if (b.t === 'var') this.add(zr ? `'\${${this.v(b.v)}//\\%/%%}'` : `'\${${this.v(b.v)}}'`);
          }
          this.track = saveTrack;
          this.add(zr ? (this.raw ? dq('\x07') : dq('\x07%}')) : this.raw ? `'\\a'` : `'\\a\\]'`);
          break;
        }
        case 'fill':
          break;
        case 'tag':
          this.flush();
          this.w.tag(op.id);
          break;
      }
    }
    // keep pending fragments for the caller to flush
  }

  private functionBody() {
    const w = this.w;
    const fn = this.zsh ? '__bashin_precmd' : '__bashin_prompt';
    const target = this.zsh ? 'PROMPT' : 'PS1';
    const lines = this.prog.lines;
    const fillLocals: string[] = [];
    const maxFills = Math.max(0, ...lines.map((l) => l.fills));
    for (let i = 0; i <= maxFills; i++) fillLocals.push(`p${i}`, `w${i}`);

    w.line(`${fn}() {`);
    w.indent();
    w.line(
      `local rc=$? b='' w=0 pl='' pk='' j='' o=${this.zsh ? "'%{' c='%}'" : "'\\[' c='\\]'"}${maxFills ? ' gap ' + fillLocals.join(' ') : ''}`,
    );
    // per-prompt provider code
    for (const [key, p] of this.providers) {
      const code = this.zsh ? p.zsh(this.varNames.get(key)!) : p.bash(this.varNames.get(key)!);
      if (code.pre) w.block(code.pre.split('\n').map((l, i) => (i === 0 ? l : l.replace(/^ {2}/, ''))).join('\n'));
    }
    w.line(this.zsh ? "PROMPT='' RPROMPT=''" : "PS1=''");
    if (this.prog.newlineBefore) {
      w.line(`[[ -n \${__bashin_started:-} ]] && ${target}=${this.zsh ? "$'\\n'" : "'\\n'"}`);
      w.line('__bashin_started=1');
    }

    lines.forEach((line, li) => {
      const isLast = li === lines.length - 1;
      w.line();
      w.line(`# line ${li + 1}${line.fills ? (isLast ? ' (right prompt after the fill)' : ' (stretches to the terminal width)') : ''}`);
      if (li > 0) w.line("b='' w=0");
      this.lastStyle = null;
      if (!line.fills) {
        this.track = false;
        this.raw = false;
        this.emitOps(line.ops);
        this.flush();
        w.line(`${target}+=$b$__bashin_s0${isLast ? '' : this.zsh ? "$'\\n'" : "'\\n'"}`);
        this.styleVar({}, false);
        return;
      }
      this.fillLine(line, isLast, target);
    });
    w.tag(null);
    w.dedent();
    w.line('}');
  }

  /** Split a line at its fills and emit each part with width tracking. */
  private fillLine(line: Line, isLast: boolean, target: string) {
    const w = this.w;
    const parts: Op[][] = [[]];
    const fills: Extract<Op, { t: 'fill' }>[] = [];
    for (const op of line.ops) {
      if (op.t === 'fill') {
        fills.push(op);
        parts.push([]);
      } else parts[parts.length - 1].push(op);
    }
    this.track = true;
    this.styleVar({}, false);
    const cols = '${COLUMNS:-80}';

    if (isLast && !this.zsh) {
      this.raw = false;
      this.emitOps(parts[0]);
      this.flush();
      w.line('p0=$b w0=$w');
      w.line("b='' w=0 o='' c=''   # the right prompt is drawn invisibly, then the cursor returns");
      this.raw = true;
      this.lastStyle = null;
      for (const p of parts.slice(1)) this.emitOps(p);
      this.flush();
      this.raw = false;
      w.line(`o='\\[' c='\\]'`);
      w.line(`if (( w > 0 && w0 + w + 2 <= ${cols} )); then`);
      w.indent();
      this.styleVar({}, true);
      w.line(`${target}+=$p0'\\[\\e7\\e['$(( ${cols} - w ))'G'$b'\\e8\\]'$__bashin_s0`);
      w.dedent();
      w.line('else');
      w.indent();
      w.line(`${target}+=$p0$__bashin_s0`);
      w.dedent();
      w.line('fi');
      this.track = false;
      return;
    }
    if (isLast && this.zsh) {
      this.raw = false;
      this.emitOps(parts[0]);
      this.flush();
      w.line('PROMPT+=$b$__bashin_s0');
      w.line("b='' w=0");
      this.lastStyle = null;
      for (const p of parts.slice(1)) this.emitOps(p);
      this.flush();
      w.line('RPROMPT=$b$__bashin_s0');
      this.track = false;
      return;
    }

    // Parts that draw nothing (a rule on its own line) need no buffer or width.
    const empty = parts.map((p) => p.every((op) => op.t === 'tag'));
    let started = false;
    parts.forEach((p, i) => {
      if (empty[i]) {
        for (const op of p) this.emitOps([op]);
        return;
      }
      if (started) w.line("b='' w=0");
      started = true;
      this.lastStyle = null;
      this.raw = false;
      this.emitOps(p);
      this.flush();
      w.line(`p${i}=$b w${i}=$w`);
    });
    const k = fills.length;
    const used = parts.map((_, i) => (empty[i] ? '' : ` - w${i}`)).join('');
    if (used) w.line(`gap=$(( ${cols} - 1${used} )); (( gap < ${k} )) && gap=${k}`);
    else w.line(`gap=$(( ${cols} - 1 ))`);
    let assemble = `${target}+=${empty[0] ? '' : '$p0'}`;
    fills.forEach((f, i) => {
      const n = i === k - 1 ? (k === 1 ? '$gap' : `$(( gap - gap / ${k} * ${k - 1} ))`) : `$(( gap / ${k} ))`;
      const style = this.styleVar(pick(f.s, false, false), false);
      if (k === 1) {
        w.line(`__bashin_fill ${n} ${sq(f.ch)}`);
        assemble += `${style}$__bashin_pad${empty[i + 1] ? '' : `$p${i + 1}`}`;
      } else {
        w.line(`__bashin_fill ${n} ${sq(f.ch)}; local f${i}=$__bashin_pad`);
        assemble += `${style}$f${i}${empty[i + 1] ? '' : `$p${i + 1}`}`;
      }
    });
    w.line(`${assemble}$__bashin_s0${this.zsh ? "$'\\n'" : "'\\n'"}`);
    this.track = false;
  }

  private footer(isStatic: boolean) {
    const w = this.w;
    w.line();
    if (this.prog.ps2) {
      const p = this.sgrFor(this.prog.ps2.s.b, this.depths[0]);
      const text = this.prog.ps2.text;
      if (this.zsh) w.line(`PROMPT2=${dq(`%{\x1b[${p}m%}${zshLit(text)}%{\x1b[0m%}`)}`);
      else w.line(`PS2=${sq(`\\[\\e[${p}m\\]${bashLit(text)}\\[\\e[0m\\]`)}`);
    }
    if (isStatic) return;
    if (this.zsh) {
      w.line('add-zsh-hook precmd __bashin_precmd');
      w.line('# run first, so $? is still the status of your command');
      w.line('precmd_functions=(__bashin_precmd ${precmd_functions:#__bashin_precmd})');
    } else {
      w.line('# run first, so $? is still the status of your command');
      w.line('if [[ ${PROMPT_COMMAND:-} != *__bashin_prompt* ]]; then');
      w.line('  PROMPT_COMMAND="__bashin_prompt${PROMPT_COMMAND:+;$PROMPT_COMMAND}"');
      w.line('fi');
    }
  }
}

function num(name: string): number {
  return Number(name.replace(/\D+/g, '')) || 0;
}


export type { Dir };
