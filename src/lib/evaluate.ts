/**
 * Evaluate a compiled prompt against a scenario, producing exactly the bytes
 * the generated shell code would print — so the preview can run them through
 * the terminal emulator.
 */
import type { Palette } from '../data/palette-types';
import { evalEsc } from './escapes';
import type { Cond, Dir, Line, Op, Program, StyleChoice, VarRef } from './ir';
import type { Scenario } from './scenario';
import { bgParams, convertColor, fgParams, pick, separatorGlyphs, sgrParams, type Depth } from './sgr';
import { strWidth } from './wcwidth';

export interface EvalOptions {
  scenario: Scenario;
  palette: Palette;
  depth: Depth;
  /** Emit OSC 9999 element tags for the preview. */
  tags?: boolean;
  /** First prompt of a session (no leading blank line). */
  first?: boolean;
}

export interface Evaluated {
  /** Bytes to write to the terminal. */
  ansi: string;
  /** Ids of elements that produced output. */
  visible: Set<string>;
  /** Window title set by the prompt, if any. */
  title: string | null;
}

type Piece = { k: 'text'; s: string } | { k: 'ctl'; s: string } | { k: 'fill'; ch: string; sgr: string };

const ESC = '\x1b';
const sgr = (p: string) => `${ESC}[${p}m`;

export function evaluate(prog: Program, o: EvalOptions): Evaluated {
  const s = o.scenario;
  const root = s.root;
  const err = s.exitCode !== 0;
  const vals = new Map<string, Record<string, string>>();
  for (const [key, p] of prog.providers) vals.set(key, p.js(s));
  const val = (v: VarRef) => vals.get(v.p)?.[v.n] ?? '';
  const visible = new Set<string>();
  let title: string | null = null;
  let currentTag: string | null = null;

  const test = (c: Cond): boolean => {
    switch (c.k) {
      case 'true':
        return true;
      case 'err':
        return err;
      case 'ok':
        return !err;
      case 'root':
        return root;
      case 'user':
        return !root;
      case 'ssh':
        return s.ssh;
      case 'local':
        return !s.ssh;
      case 'set':
        return val(c.v) !== '';
      case 'gt':
        return (Number.parseInt(val(c.v), 10) || 0) > c.n;
      case 'not':
        return !test(c.c);
      case 'and':
        return c.c.every(test);
      case 'or':
        return c.c.some(test);
    }
  };

  const styleSgr = (c: StyleChoice) => sgr(sgrParams(pick(c, root, err), o.depth, o.palette));
  const colorOf = (c: StyleChoice, which: 'fg' | 'bg') => {
    const col = pick(c, root, err)[which];
    return col ? convertColor(col, o.depth, o.palette) : undefined;
  };

  function evalLine(line: Line): Piece[] {
    const out: Piece[] = [];
    // open powerline segment: its background as fg params (pl) and as bg params (pk)
    let pl = '';
    let pk = '';
    const text = (t: string) => {
      if (!t) return;
      out.push({ k: 'text', s: t });
      if (currentTag) visible.add(currentTag);
    };
    const ctl = (t: string) => out.push({ k: 'ctl', s: t });

    const run = (ops: Op[]) => {
      for (const op of ops) {
        switch (op.t) {
          case 'lit':
            text(op.s);
            break;
          case 'esc':
            text(evalEsc(op.e, op.fmt, s));
            break;
          case 'var':
            text(val(op.v));
            break;
          case 'sty':
            ctl(styleSgr(op.s));
            break;
          case 'rsty':
            break;
          case 'if':
            if (test(op.c)) run(op.then);
            else if (op.else) run(op.else);
            break;
          case 'join': {
            let first = true;
            for (const it of op.items) {
              if (!test(it.c)) continue;
              if (!first && op.sep) text(op.sep);
              run(it.ops);
              first = false;
            }
            break;
          }
          case 'seg': {
            const g = separatorGlyphs(prog.separator, op.dir)!;
            const bg = colorOf(op.bg, 'bg');
            const bgP = bg ? bgParams(bg) : '49';
            const bfP = bg ? fgParams(bg) : '39';
            const fg = colorOf(op.text, 'fg');
            const tP = fg ? fgParams(fg) : '39';
            if (!pl) {
              if (g.start) {
                ctl(sgr(`0;${bfP}`));
                text(g.start);
              }
            } else if (pl === bfP) {
              ctl(sgr(`0;${tP};${bgP}`));
              text(g.thin);
            } else if (op.dir === 'r') {
              ctl(sgr(`0;${pl};${bgP}`));
              text(g.sep);
            } else {
              ctl(sgr(`0;${bfP};${pk}`));
              text(g.sep);
            }
            pl = bfP;
            pk = bgP;
            break;
          }
          case 'segEnd': {
            if (!pl) break;
            const g = separatorGlyphs(prog.separator, op.dir)!;
            if (g.end) {
              ctl(sgr(`0;${pl}`));
              text(g.end);
            }
            ctl(sgr('0'));
            pl = '';
            pk = '';
            break;
          }
          case 'fill':
            out.push({ k: 'fill', ch: op.ch, sgr: styleSgr(op.s) });
            break;
          case 'title': {
            const before = out.length;
            run(op.body);
            const t = out
              .splice(before)
              .filter((p): p is { k: 'text'; s: string } => p.k === 'text')
              .map((p) => p.s)
              .join('');
            title = t;
            ctl(`${ESC}]0;${t}\x07`);
            break;
          }
          case 'tag':
            currentTag = op.id;
            if (o.tags) ctl(`${ESC}]9999;${op.id ?? ''}\x07`);
            break;
        }
      }
    };
    run(line.ops);
    return out;
  }

  const width = (ps: Piece[]) => ps.reduce((w, p) => (p.k === 'text' ? w + strWidth(p.s) : w), 0);
  const ser = (ps: Piece[]) => ps.map((p) => (p.k === 'fill' ? '' : p.s)).join('');

  const cols = s.cols;
  const rendered = prog.lines.map((line, li) => {
    const pieces = evalLine(line);
    const isLast = li === prog.lines.length - 1;
    if (line.fills === 0) return ser(pieces) + sgr('0');

    const parts: Piece[][] = [[]];
    const fills: { ch: string; sgr: string }[] = [];
    for (const p of pieces) {
      if (p.k === 'fill') {
        fills.push(p);
        parts.push([]);
      } else parts[parts.length - 1].push(p);
    }

    if (isLast) {
      const left = parts[0];
      const right = parts.slice(1).flat();
      const lw = width(left);
      const rw = width(right);
      if (rw > 0 && lw + rw + 2 <= cols) return `${ser(left)}${ESC}7${ESC}[${cols - rw}G${ser(right)}${ESC}8${sgr('0')}`;
      return ser(left) + sgr('0');
    }

    const k = fills.length;
    const used = parts.reduce((w, p) => w + width(p), 0);
    const gap = Math.max(cols - 1 - used, k);
    const base = Math.floor(gap / k);
    let outStr = ser(parts[0]);
    fills.forEach((f, i) => {
      const n = i === k - 1 ? gap - base * (k - 1) : base;
      outStr += f.sgr + f.ch.repeat(n) + ser(parts[i + 1]);
    });
    return outStr + sgr('0');
  });

  let ansi = rendered.join('\n');
  if (prog.newlineBefore && !o.first) ansi = '\n' + ansi;
  return { ansi, visible, title };
}

/** The continuation prompt (PS2) as bytes. */
export function evaluatePs2(prog: Program, o: EvalOptions): string {
  if (!prog.ps2) return '';
  return `${sgr(sgrParams(prog.ps2.s.b, o.depth, o.palette))}${prog.ps2.text}${sgr('0')}`;
}

export type { Dir };
