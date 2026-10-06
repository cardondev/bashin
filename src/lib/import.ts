/**
 * Import an existing prompt: paste the output of `echo $PS1` (bash) or
 * `print -r -- $PROMPT` (zsh), or a whole `PS1='…'` line, and get editable
 * elements back.
 */
import type { Palette } from '../data/palette-types';
import { rgbToHex } from './color';
import { makeElement } from './doc';
import { DEFAULT_SETTINGS, type ColorRef, type PromptDoc, type PromptElement, type Style } from './model';

export interface ImportResult {
  doc: PromptDoc;
  shell: 'bash' | 'zsh';
  warnings: string[];
}

const ESC = '\x1b';

/** Strip `export PS1=`, quotes and ANSI-C quoting from a pasted assignment. */
export function unwrapAssignment(input: string): string {
  let s = input.trim();
  const m = /^(?:export\s+|declare\s+-x\s+|typeset\s+)?(PS1|PROMPT|PS2|PROMPT2|RPROMPT|RPS1)\s*=\s*([\s\S]*)$/.exec(s);
  if (!m) return input.replace(/\r?\n$/, '');
  s = m[2].trim();
  if (s.startsWith("$'") && s.endsWith("'")) {
    return s
      .slice(2, -1)
      .replace(/\\(e|E|033|x1b|n|a|\\|')/g, (_x, c: string) =>
        c === 'e' || c === 'E' || c === '033' || c === 'x1b' ? ESC : c === 'n' ? '\n' : c === 'a' ? '\x07' : c,
      );
  }
  if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/'\\''/g, "'");
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/\\(["\\$`])/g, '$1');
  return s;
}

export function detectShell(s: string): 'bash' | 'zsh' {
  const zsh = (s.match(/%[nmM~#?jT*@!]|%F\{|%K\{|%\{|%[BbUuSsfk]|%\d+~|%\(/g) ?? []).length;
  const bash = (s.match(/\\[uhHwW$tT@AdjnlsvV!#[\]]|\\D\{/g) ?? []).length;
  return zsh > bash ? 'zsh' : 'bash';
}

class Builder {
  els: PromptElement[] = [];
  style: Style = {};
  warnings: string[] = [];
  private textBuf = '';
  private textStyle: Style = {};
  readonly palette: Palette;

  constructor(palette: Palette) {
    this.palette = palette;
  }

  private flushText() {
    if (!this.textBuf) return;
    const el = makeElement('text');
    el.options = { text: this.textBuf };
    el.style = { ...this.textStyle };
    this.els.push(el);
    this.textBuf = '';
  }

  char(ch: string) {
    if (this.textBuf && JSON.stringify(this.textStyle) !== JSON.stringify(this.style)) this.flushText();
    if (!this.textBuf) this.textStyle = { ...this.style };
    this.textBuf += ch;
  }

  add(type: PromptElement['type'], patch: Partial<PromptElement> = {}) {
    this.flushText();
    const el = makeElement(type);
    if (type !== 'newline' && type !== 'title') el.style = { ...this.style };
    if (type === 'user' || type === 'prompt-char') {
      delete el.rootStyle;
      delete el.errorStyle;
    }
    Object.assign(el, patch);
    if (patch.options) el.options = { ...(makeElement(type).options ?? {}), ...patch.options };
    this.els.push(el);
  }

  done(): PromptElement[] {
    this.flushText();
    return this.els;
  }

  color(ref: { kind: 'idx'; i: number } | { kind: 'rgb'; r: number; g: number; b: number }): ColorRef {
    if (ref.kind === 'idx') return ref.i < 16 ? { t: 'ansi', v: ref.i } : { t: 'x256', v: ref.i };
    const hex = rgbToHex(ref);
    const token = Object.entries(this.palette.tokens).find(([, h]) => h === hex)?.[0];
    return token ? ({ t: 'token', v: token } as ColorRef) : { t: 'hex', v: hex };
  }

  sgr(params: string) {
    const p = params === '' ? ['0'] : params.split(/[;:]/);
    for (let i = 0; i < p.length; i++) {
      const n = Number.parseInt(p[i] || '0', 10);
      const s = this.style;
      if (n === 0) this.style = {};
      else if (n === 1) s.bold = true;
      else if (n === 2) s.dim = true;
      else if (n === 3) s.italic = true;
      else if (n === 4) s.underline = true;
      else if (n === 5 || n === 6) s.blink = true;
      else if (n === 7) s.reverse = true;
      else if (n === 9) s.strike = true;
      else if (n === 53) s.overline = true;
      else if (n === 22) {
        delete s.bold;
        delete s.dim;
      } else if (n === 23) delete s.italic;
      else if (n === 24) delete s.underline;
      else if (n === 25) delete s.blink;
      else if (n === 27) delete s.reverse;
      else if (n === 29) delete s.strike;
      else if (n >= 30 && n <= 37) s.fg = { t: 'ansi', v: n - 30 };
      else if (n >= 90 && n <= 97) s.fg = { t: 'ansi', v: n - 90 + 8 };
      else if (n >= 40 && n <= 47) s.bg = { t: 'ansi', v: n - 40 };
      else if (n >= 100 && n <= 107) s.bg = { t: 'ansi', v: n - 100 + 8 };
      else if (n === 39) delete s.fg;
      else if (n === 49) delete s.bg;
      else if (n === 38 || n === 48) {
        const mode = Number.parseInt(p[i + 1] ?? '', 10);
        let c: ColorRef | null = null;
        if (mode === 5) {
          c = this.color({ kind: 'idx', i: Number.parseInt(p[i + 2] ?? '0', 10) & 255 });
          i += 2;
        } else if (mode === 2) {
          c = this.color({
            kind: 'rgb',
            r: Number(p[i + 2]) & 255,
            g: Number(p[i + 3]) & 255,
            b: Number(p[i + 4]) & 255,
          });
          i += 4;
        }
        if (c) {
          if (n === 38) s.fg = c;
          else s.bg = c;
        }
      }
    }
  }
}

/** Read an escape sequence starting at s[i] === ESC. Returns the index after it. */
function escape(b: Builder, s: string, i: number): number {
  if (s[i + 1] === '[') {
    let j = i + 2;
    while (j < s.length && !/[@-~]/.test(s[j])) j++;
    if (s[j] === 'm') b.sgr(s.slice(i + 2, j));
    return j + 1;
  }
  if (s[i + 1] === ']') {
    let j = i + 2;
    while (j < s.length && s[j] !== '\x07' && !(s[j] === ESC && s[j + 1] === '\\') && !(s[j] === '\\' && s[j + 1] === 'a'))
      j++;
    const body = s.slice(i + 2, j);
    if (/^[02];/.test(body)) {
      const t = body.slice(2);
      const format = /\\u@\\h:? ?\\w|%n@%m:? ?%~/.test(t) ? 'user-host-cwd' : /^\\w$|^%~$/.test(t) ? 'cwd' : 'text';
      b.add('title', { options: { format, text: t.replace(/\\[a-zA-Z]|%./g, '') } });
    }
    return s[j] === '\x07' ? j + 1 : j + 2;
  }
  return i + 2;
}

function matching(s: string, i: number, open: string, close: string): number {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '\\') {
      j++;
      continue;
    }
    if (s[j] === open) depth++;
    else if (s[j] === close && --depth === 0) return j;
  }
  return s.length - 1;
}

function dollar(b: Builder, s: string, i: number): number {
  const next = s[i + 1];
  if (next === '?') {
    b.add('exit-code', { options: { mode: 'always', format: 'code', errorSymbol: '', successSymbol: '0' } });
    return i + 2;
  }
  if (next === '(') {
    const end = matching(s, i + 1, '(', ')');
    const inner = s.slice(i + 2, end).trim();
    if (/__git_ps1|git_prompt|git branch|git symbolic-ref|git rev-parse --abbrev-ref/.test(inner)) {
      const fmt = /__git_ps1\s+["']([^"']*)["']/.exec(inner)?.[1];
      const [pre, post] = fmt ? fmt.split('%s') : [' (', ')'];
      b.add('git-branch', { prefix: pre ?? '', suffix: post ?? '', options: { icon: '', showOp: true } });
    } else {
      b.add('command', { options: { cmd: inner, sample: inner.split(/\s/)[0] } });
      b.warnings.push(`Kept $(${inner.slice(0, 40)}) as a command element — it runs on every prompt.`);
    }
    return end + 1;
  }
  if (next === '{') {
    const end = matching(s, i + 1, '{', '}');
    const inner = s.slice(i + 2, end);
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(inner)?.[0] ?? '';
    if (/debian_chroot/.test(inner)) b.warnings.push('Dropped the ${debian_chroot…} decoration.');
    else if (/^vcs_info_msg/.test(name)) b.add('git-branch', { options: { icon: '', showOp: true } });
    else if (/VIRTUAL_ENV/.test(name)) b.add('venv');
    else if (name) b.add('env', { options: { name, sample: name.toLowerCase() } });
    return end + 1;
  }
  const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i + 1))?.[0];
  if (name) {
    if (/VIRTUAL_ENV/.test(name)) b.add('venv');
    else b.add('env', { options: { name, sample: name.toLowerCase() } });
    return i + 1 + name.length;
  }
  b.char('$');
  return i + 1;
}

function parseBash(b: Builder, s: string) {
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ESC) {
      i = escape(b, s, i);
      continue;
    }
    if (ch === '\x01' || ch === '\x02') {
      i++;
      continue;
    }
    if (ch === '$') {
      i = dollar(b, s, i);
      continue;
    }
    if (ch === '`') {
      const end = s.indexOf('`', i + 1);
      const inner = s.slice(i + 1, end < 0 ? s.length : end);
      b.add('command', { options: { cmd: inner, sample: inner.split(/\s/)[0] } });
      i = end < 0 ? s.length : end + 1;
      continue;
    }
    if (ch === '\n') {
      b.add('newline');
      i++;
      continue;
    }
    if (ch !== '\\') {
      b.char(ch);
      i++;
      continue;
    }
    const n = s[i + 1];
    const two = () => (i += 2);
    switch (n) {
      case 'u':
        b.add('user');
        two();
        break;
      case 'h':
        b.add('host');
        two();
        break;
      case 'H':
        b.add('host', { options: { full: true, onlySsh: false } });
        two();
        break;
      case 'w':
        b.add('cwd');
        two();
        break;
      case 'W':
        b.add('cwd', { options: { mode: 'base' } });
        two();
        break;
      case '$':
        b.add('prompt-char', { options: { char: '$', rootChar: '#', errorChar: '' } });
        two();
        break;
      case 't':
        b.add('time', { options: { format: '24' } });
        two();
        break;
      case 'T':
        b.add('time', { options: { format: '12' } });
        two();
        break;
      case '@':
        b.add('time', { options: { format: 'ampm' } });
        two();
        break;
      case 'A':
        b.add('time', { options: { format: '24s' } });
        two();
        break;
      case 'd':
        b.add('date', { options: { format: 'default' } });
        two();
        break;
      case 'D': {
        const end = s.indexOf('}', i + 3);
        const fmt = s.slice(i + 3, end < 0 ? s.length : end);
        const isTime = /%[HIMSTRrpX]/.test(fmt) && !/%[aAbBdeYymjF]/.test(fmt);
        b.add(isTime ? 'time' : 'date', { options: { format: 'custom', custom: fmt || '%X' } });
        i = end < 0 ? s.length : end + 1;
        break;
      }
      case 'n':
        b.add('newline');
        two();
        break;
      case 'j':
        b.add('jobs', { options: { symbol: '', count: true, min: 0 } });
        two();
        break;
      case '!':
        b.add('history', { prefix: '' });
        two();
        break;
      case '#':
        b.add('cmd-number', { prefix: '' });
        two();
        break;
      case 's':
        b.add('shell');
        two();
        break;
      case 'v':
        b.add('shell', { options: { show: 'version' } });
        two();
        break;
      case 'V':
        b.add('shell', { options: { show: 'release' } });
        two();
        break;
      case 'l':
        b.add('tty');
        two();
        break;
      case '[':
      case ']':
      case 'a':
      case 'r':
        two();
        break;
      case 'e':
      case 'E':
        i = escape(b, ESC + s.slice(i + 2), 0) + i + 1;
        break;
      case 'x':
        if (s.slice(i + 2, i + 4).toLowerCase() === '1b') i = escape(b, ESC + s.slice(i + 4), 0) + i + 3;
        else {
          b.char('\\');
          i++;
        }
        break;
      case '\\':
        b.char('\\');
        two();
        break;
      default:
        if (n !== undefined && /[0-7]/.test(n)) {
          const oct = /^[0-7]{1,3}/.exec(s.slice(i + 1))![0];
          const c = String.fromCharCode(Number.parseInt(oct, 8));
          if (c === ESC) i = escape(b, ESC + s.slice(i + 1 + oct.length), 0) + i + oct.length;
          else {
            b.char(c);
            i += 1 + oct.length;
          }
        } else {
          b.char(n ?? '\\');
          i += 2;
        }
    }
  }
}

const ZSH_COLORS: Record<string, number> = {
  black: 0, red: 1, green: 2, yellow: 3, blue: 4, magenta: 5, cyan: 6, white: 7,
};

function zshColor(b: Builder, name: string): ColorRef | null {
  const n = name.trim().toLowerCase();
  if (n === 'default' || n === 'reset' || n === '') return null;
  if (n in ZSH_COLORS) return { t: 'ansi', v: ZSH_COLORS[n] };
  if (/^\d+$/.test(n)) {
    const i = Number(n) & 255;
    return i < 16 ? { t: 'ansi', v: i } : { t: 'x256', v: i };
  }
  if (/^#[0-9a-f]{6}$/.test(n)) {
    const v = Number.parseInt(n.slice(1), 16);
    return b.color({ kind: 'rgb', r: v >> 16, g: (v >> 8) & 255, b: v & 255 });
  }
  if (/^#[0-9a-f]{3}$/.test(n)) {
    const [r, g, bl] = n.slice(1).split('').map((x) => Number.parseInt(x + x, 16));
    return b.color({ kind: 'rgb', r, g, b: bl });
  }
  return null;
}

function parseZsh(b: Builder, s: string) {
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === ESC) {
      i = escape(b, s, i);
      continue;
    }
    if (ch === '$') {
      i = dollar(b, s, i);
      continue;
    }
    if (ch === '\n') {
      b.add('newline');
      i++;
      continue;
    }
    if (ch !== '%') {
      b.char(ch);
      i++;
      continue;
    }
    let j = i + 1;
    const digits = /^-?\d*/.exec(s.slice(j))![0];
    j += digits.length;
    const n = s[j];
    const arg = () => {
      if (s[j + 1] !== '{') return '';
      const end = s.indexOf('}', j + 2);
      const a = s.slice(j + 2, end < 0 ? s.length : end);
      j = end < 0 ? s.length - 1 : end;
      return a;
    };
    switch (n) {
      case 'n':
        b.add('user');
        break;
      case 'm':
        b.add('host');
        break;
      case 'M':
        b.add('host', { options: { full: true, onlySsh: false } });
        break;
      case '~':
      case '/':
      case 'd': {
        const depth = Number(digits);
        if (depth === 1) b.add('cwd', { options: { mode: 'base' } });
        else if (depth > 1) b.add('cwd', { options: { mode: 'trim', depth, ellipsis: '…', keepHome: true } });
        else b.add('cwd');
        break;
      }
      case 'c':
      case '.':
      case 'C':
        b.add('cwd', { options: { mode: 'base' } });
        break;
      case '#':
        b.add('prompt-char', { options: { char: '%', rootChar: '#', errorChar: '' } });
        break;
      case 'T':
        b.add('time', { options: { format: '24s' } });
        break;
      case '*':
        b.add('time', { options: { format: '24' } });
        break;
      case 't':
      case '@':
        b.add('time', { options: { format: 'ampm' } });
        break;
      case 'D': {
        const fmt = arg();
        if (fmt) {
          const isTime = /%[HIMSTRrpX*]/.test(fmt) && !/%[aAbBdeYymjF]/.test(fmt);
          b.add(isTime ? 'time' : 'date', { options: { format: 'custom', custom: fmt } });
        } else b.add('date', { options: { format: 'custom', custom: '%y-%m-%d' } });
        break;
      }
      case 'w':
        b.add('date', { options: { format: 'custom', custom: '%a %e' } });
        break;
      case 'W':
        b.add('date', { options: { format: 'custom', custom: '%m/%d/%y' } });
        break;
      case 'j':
        b.add('jobs', { options: { symbol: '', count: true, min: 0 } });
        break;
      case '!':
      case 'h':
        b.add('history', { prefix: '' });
        break;
      case '?':
        b.add('exit-code', { options: { mode: 'always', format: 'code', errorSymbol: '', successSymbol: '0' } });
        break;
      case 'l':
      case 'y':
        b.add('tty');
        break;
      case 'B':
        b.style.bold = true;
        break;
      case 'b':
        delete b.style.bold;
        break;
      case 'U':
        b.style.underline = true;
        break;
      case 'u':
        delete b.style.underline;
        break;
      case 'S':
        b.style.reverse = true;
        break;
      case 's':
        delete b.style.reverse;
        break;
      case 'F': {
        const c = zshColor(b, arg());
        if (c) b.style.fg = c;
        else delete b.style.fg;
        break;
      }
      case 'f':
        delete b.style.fg;
        break;
      case 'K': {
        const c = zshColor(b, arg());
        if (c) b.style.bg = c;
        else delete b.style.bg;
        break;
      }
      case 'k':
        delete b.style.bg;
        break;
      case '{': {
        const end = s.indexOf('%}', j);
        const raw = s.slice(j + 1, end < 0 ? s.length : end).replace(/\\e|\\033|\\E/g, ESC);
        for (let k = 0; k < raw.length; ) k = raw[k] === ESC ? escape(b, raw, k) : k + 1;
        j = end < 0 ? s.length : end + 1;
        break;
      }
      case '(': {
        // %(x.true.false): keep the common root test as a prompt character
        const m = /^\(!\.([^.]*)\.([^)]*)\)/.exec(s.slice(j));
        if (m) {
          b.add('prompt-char', { options: { char: m[2] || '$', rootChar: m[1] || '#', errorChar: '' } });
          j += m[0].length - 1;
        } else {
          const end = matching(s, j, '(', ')');
          b.warnings.push(`Skipped the conditional ${s.slice(i, end + 1).slice(0, 40)}.`);
          j = end;
        }
        break;
      }
      case '%':
        b.char('%');
        break;
      case ')':
        b.char(')');
        break;
      default:
        if (n) b.warnings.push(`Unknown escape %${n} kept as text.`);
        if (n) b.char('%' + n);
    }
    i = j + 1;
  }
}

export function importPrompt(input: string, palette: Palette, rprompt = ''): ImportResult {
  const src = unwrapAssignment(input);
  const shell = detectShell(src);
  const b = new Builder(palette);
  if (shell === 'zsh') parseZsh(b, src);
  else parseBash(b, src);
  if (rprompt.trim()) {
    b.add('fill', { options: { char: ' ' }, style: {} });
    b.style = {};
    parseZsh(b, unwrapAssignment(rprompt));
  }
  const elements = b.done();
  return {
    shell,
    warnings: b.warnings,
    doc: {
      v: 1,
      name: 'Imported prompt',
      elements,
      settings: { ...DEFAULT_SETTINGS, separator: 'none', palette: palette.id },
    },
  };
}
