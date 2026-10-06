/**
 * A small terminal emulator: enough of xterm to render shell prompts exactly.
 *
 * Handles SGR (16/256/24-bit color, bold, dim, italic, underline variants,
 * blink, reverse, hidden, strike, overline), CR/LF/BS/TAB, autowrap with
 * pending-wrap semantics, wide characters, cursor movement (CUF/CUB/CHA/CUU/
 * CUD), save/restore (DECSC/DECRC and CSI s/u), erase-in-line with background
 * color erase, and OSC 0/2 window titles. A private OSC 9999 attaches an
 * element id ("tag") to the cells that follow, which lets the preview map
 * every cell back to the prompt element that produced it.
 *
 * Rows are unbounded, so the whole session is kept as scrollback.
 */
import { charWidth } from './wcwidth';

/** -1 = default; 0–255 = palette index; ≥ RGB_FLAG = 24-bit color. */
export type TColor = number;
export const RGB_FLAG = 0x1000000;
export const rgbColor = (r: number, g: number, b: number): TColor => RGB_FLAG + ((r << 16) | (g << 8) | b);

export interface CellStyle {
  readonly fg: TColor;
  readonly bg: TColor;
  readonly bold: boolean;
  readonly dim: boolean;
  readonly italic: boolean;
  /** 0 none, 1 single, 2 double, 3 curly, 4 dotted, 5 dashed */
  readonly underline: number;
  readonly blink: boolean;
  readonly reverse: boolean;
  readonly hidden: boolean;
  readonly strike: boolean;
  readonly overline: boolean;
}

export interface Cell {
  ch: string;
  /** 1 or 2 for a glyph cell, 0 for the right half of a wide glyph. */
  w: 0 | 1 | 2;
  st: CellStyle;
  tag: string | null;
}

export const DEFAULT_STYLE: CellStyle = Object.freeze({
  fg: -1,
  bg: -1,
  bold: false,
  dim: false,
  italic: false,
  underline: 0,
  blink: false,
  reverse: false,
  hidden: false,
  strike: false,
  overline: false,
});

interface Saved {
  r: number;
  c: number;
  st: CellStyle;
}

export class Terminal {
  rows: Cell[][] = [[]];
  r = 0;
  c = 0;
  title = '';
  private wrapPending = false;
  private st: CellStyle = DEFAULT_STYLE;
  private tag: string | null = null;
  private saved: Saved | null = null;
  readonly cols: number;

  constructor(cols: number) {
    this.cols = Math.max(4, Math.floor(cols));
  }

  write(data: string): this {
    const n = data.length;
    let i = 0;
    while (i < n) {
      const code = data.charCodeAt(i);
      if (code === 0x1b) {
        i = this.escape(data, i + 1);
        continue;
      }
      if (code < 0x20 || code === 0x7f) {
        this.control(code);
        i++;
        continue;
      }
      const cp = data.codePointAt(i)!;
      i += cp > 0xffff ? 2 : 1;
      this.print(cp);
    }
    return this;
  }

  /** Current cursor position. */
  get cursor() {
    return { r: this.r, c: this.c };
  }

  // ── printing ───────────────────────────────────────────────────────────────

  private row(r: number): Cell[] {
    while (this.rows.length <= r) this.rows.push([]);
    return this.rows[r];
  }

  private blank(st: CellStyle = DEFAULT_STYLE): Cell {
    return { ch: ' ', w: 1, st, tag: null };
  }

  private put(r: number, c: number, cell: Cell) {
    const row = this.row(r);
    while (row.length < c) row.push(this.blank());
    // Overwriting half of a wide glyph clears the other half.
    const old = row[c];
    if (old?.w === 2 && row[c + 1]?.w === 0) row[c + 1] = this.blank();
    if (old?.w === 0 && c > 0 && row[c - 1]?.w === 2) row[c - 1] = this.blank(row[c - 1].st);
    row[c] = cell;
  }

  private print(cp: number) {
    const w = charWidth(cp);
    const ch = String.fromCodePoint(cp);
    if (w === 0) {
      // Combining mark / joiner / variation selector: attach to the previous cell.
      const row = this.row(this.r);
      let c = this.wrapPending ? this.c : this.c - 1;
      if (c >= 0 && row[c]?.w === 0) c--;
      if (c >= 0 && row[c]) row[c] = { ...row[c], ch: row[c].ch + ch };
      return;
    }
    if (this.wrapPending) this.newline();
    if (this.c + w > this.cols) this.newline();
    this.put(this.r, this.c, { ch, w, st: this.st, tag: this.tag });
    if (w === 2) this.put(this.r, this.c + 1, { ch: '', w: 0, st: this.st, tag: this.tag });
    this.c += w;
    if (this.c >= this.cols) {
      this.c = this.cols - 1;
      this.wrapPending = true;
    }
  }

  private newline() {
    this.r++;
    this.c = 0;
    this.wrapPending = false;
    this.row(this.r);
  }

  private control(code: number) {
    switch (code) {
      case 0x0a: // LF — the tty's ONLCR turns it into CR LF
      case 0x0b:
      case 0x0c:
        this.newline();
        break;
      case 0x0d:
        this.c = 0;
        this.wrapPending = false;
        break;
      case 0x08:
        this.c = Math.max(0, this.c - 1);
        this.wrapPending = false;
        break;
      case 0x09: {
        const next = Math.min(this.cols - 1, (Math.floor(this.c / 8) + 1) * 8);
        this.c = next;
        this.wrapPending = false;
        break;
      }
      default: // BEL, readline's \001/\002 markers and other C0 codes draw nothing
        break;
    }
  }

  // ── escape sequences ─────────────────────────────────────────────────────

  private escape(s: string, i: number): number {
    const ch = s[i];
    if (ch === undefined) return i;
    if (ch === '[') return this.csi(s, i + 1);
    if (ch === ']') return this.osc(s, i + 1);
    if (ch === '7') {
      this.saveCursor();
      return i + 1;
    }
    if (ch === '8') {
      this.restoreCursor();
      return i + 1;
    }
    if (ch === '(' || ch === ')' || ch === '*' || ch === '+') return i + 2; // charset designation
    if (ch === 'c') {
      this.st = DEFAULT_STYLE;
      return i + 1;
    }
    return i + 1;
  }

  private csi(s: string, i: number): number {
    let j = i;
    while (j < s.length) {
      const c = s.charCodeAt(j);
      if (c >= 0x40 && c <= 0x7e) break;
      j++;
    }
    if (j >= s.length) return j;
    const final = s[j];
    const raw = s.slice(i, j);
    const priv = /^[?<=>]/.test(raw);
    const params = priv ? raw.slice(1) : raw;
    const nums = params.split(';').map((p) => Number.parseInt(p, 10));
    const n1 = Number.isNaN(nums[0]) || nums[0] === 0 ? 1 : nums[0];
    if (priv) return j + 1; // DECSET/DECRST and friends: nothing to draw
    switch (final) {
      case 'm':
        this.sgr(params);
        break;
      case 'C':
        this.c = Math.min(this.cols - 1, this.c + n1);
        this.wrapPending = false;
        break;
      case 'D':
        this.c = Math.max(0, this.c - n1);
        this.wrapPending = false;
        break;
      case 'G':
      case '`':
        this.c = Math.max(0, Math.min(this.cols - 1, n1 - 1));
        this.wrapPending = false;
        break;
      case 'A':
        this.r = Math.max(0, this.r - n1);
        this.wrapPending = false;
        break;
      case 'B':
        this.r += n1;
        this.row(this.r);
        this.wrapPending = false;
        break;
      case 'K':
        this.eraseLine(Number.isNaN(nums[0]) ? 0 : nums[0]);
        break;
      case 's':
        this.saveCursor();
        break;
      case 'u':
        this.restoreCursor();
        break;
      default: // CUP, ED, scrolling regions… prompts don't need them
        break;
    }
    return j + 1;
  }

  private osc(s: string, i: number): number {
    let j = i;
    let end = -1;
    let next = -1;
    while (j < s.length) {
      if (s.charCodeAt(j) === 0x07) {
        end = j;
        next = j + 1;
        break;
      }
      if (s[j] === '\x1b' && s[j + 1] === '\\') {
        end = j;
        next = j + 2;
        break;
      }
      j++;
    }
    if (end < 0) return s.length;
    const body = s.slice(i, end);
    const semi = body.indexOf(';');
    const code = semi < 0 ? body : body.slice(0, semi);
    const text = semi < 0 ? '' : body.slice(semi + 1);
    if (code === '0' || code === '2') this.title = text;
    else if (code === '9999') this.tag = text || null;
    return next;
  }

  private saveCursor() {
    this.saved = { r: this.r, c: this.c, st: this.st };
  }

  private restoreCursor() {
    if (!this.saved) return;
    this.r = this.saved.r;
    this.c = this.saved.c;
    this.st = this.saved.st;
    this.wrapPending = false;
  }

  private eraseLine(mode: number) {
    const row = this.row(this.r);
    const bce = this.st.bg !== -1;
    const fill = (): Cell => ({ ch: ' ', w: 1, st: bce ? { ...DEFAULT_STYLE, bg: this.st.bg } : DEFAULT_STYLE, tag: this.tag });
    if (mode === 0) {
      row.length = Math.min(row.length, this.c);
      if (bce) for (let c = this.c; c < this.cols; c++) row[c] = fill();
    } else if (mode === 1) {
      for (let c = 0; c <= this.c && c < this.cols; c++) row[c] = fill();
    } else if (mode === 2) {
      row.length = 0;
      if (bce) for (let c = 0; c < this.cols; c++) row[c] = fill();
    }
  }

  // ── SGR ──────────────────────────────────────────────────────────────────

  private sgr(params: string) {
    if (params === '') {
      this.st = DEFAULT_STYLE;
      return;
    }
    const groups = params.split(';');
    const st: { -readonly [K in keyof CellStyle]: CellStyle[K] } = { ...this.st };
    for (let g = 0; g < groups.length; g++) {
      const sub = groups[g].split(':');
      const p = sub[0] === '' ? 0 : Number.parseInt(sub[0], 10);
      if (Number.isNaN(p)) continue;
      if (p === 38 || p === 48 || p === 58) {
        let color: TColor | null = null;
        if (sub.length > 1) {
          // Colon form: 38:5:n, 38:2:r:g:b or 38:2::r:g:b (with color space id)
          const mode = Number.parseInt(sub[1], 10);
          if (mode === 5) color = clampIndex(sub[2]);
          else if (mode === 2) {
            const v = sub.length >= 6 ? sub.slice(3, 6) : sub.slice(2, 5);
            color = rgbColor(num(v[0]), num(v[1]), num(v[2]));
          }
        } else {
          const mode = Number.parseInt(groups[g + 1], 10);
          if (mode === 5) {
            color = clampIndex(groups[g + 2]);
            g += 2;
          } else if (mode === 2) {
            color = rgbColor(num(groups[g + 2]), num(groups[g + 3]), num(groups[g + 4]));
            g += 4;
          }
        }
        if (color !== null) {
          if (p === 38) st.fg = color;
          else if (p === 48) st.bg = color;
        }
        continue;
      }
      if (p === 0) Object.assign(st, DEFAULT_STYLE);
      else if (p === 1) st.bold = true;
      else if (p === 2) st.dim = true;
      else if (p === 3) st.italic = true;
      else if (p === 4) st.underline = sub.length > 1 ? num(sub[1]) : 1;
      else if (p === 5 || p === 6) st.blink = true;
      else if (p === 7) st.reverse = true;
      else if (p === 8) st.hidden = true;
      else if (p === 9) st.strike = true;
      else if (p === 21) st.underline = 2;
      else if (p === 22) {
        st.bold = false;
        st.dim = false;
      } else if (p === 23) st.italic = false;
      else if (p === 24) st.underline = 0;
      else if (p === 25) st.blink = false;
      else if (p === 27) st.reverse = false;
      else if (p === 28) st.hidden = false;
      else if (p === 29) st.strike = false;
      else if (p >= 30 && p <= 37) st.fg = p - 30;
      else if (p === 39) st.fg = -1;
      else if (p >= 40 && p <= 47) st.bg = p - 40;
      else if (p === 49) st.bg = -1;
      else if (p === 53) st.overline = true;
      else if (p === 55) st.overline = false;
      else if (p >= 90 && p <= 97) st.fg = p - 90 + 8;
      else if (p >= 100 && p <= 107) st.bg = p - 100 + 8;
    }
    this.st = sameStyle(st, this.st) ? this.st : Object.freeze(st);
  }
}

function num(s: string | undefined): number {
  const v = Number.parseInt(s ?? '', 10);
  return Number.isNaN(v) ? 0 : Math.max(0, Math.min(255, v));
}

function clampIndex(s: string | undefined): TColor {
  return num(s);
}

export function sameStyle(a: CellStyle, b: CellStyle): boolean {
  return (
    a.fg === b.fg &&
    a.bg === b.bg &&
    a.bold === b.bold &&
    a.dim === b.dim &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.blink === b.blink &&
    a.reverse === b.reverse &&
    a.hidden === b.hidden &&
    a.strike === b.strike &&
    a.overline === b.overline
  );
}

/** Run a string through a fresh terminal. */
export function emulate(data: string, cols: number): Terminal {
  return new Terminal(cols).write(data);
}

/**
 * A comparable text dump of the screen: one line per row, each cell as
 * `char` plus a style key whenever the style changes. Trailing default blanks
 * are dropped. Used by tests to compare what a real shell drew with what the
 * preview draws.
 */
export function dump(t: Terminal, opts: { tags?: boolean } = {}): string {
  const lines: string[] = [];
  for (const row of t.rows) {
    let end = row.length;
    while (end > 0 && row[end - 1].ch === ' ' && row[end - 1].st.bg === -1 && !row[end - 1].st.reverse) end--;
    let out = '';
    let prev: CellStyle | null = null;
    let prevTag: string | null = null;
    for (let c = 0; c < end; c++) {
      const cell = row[c];
      if (cell.w === 0) continue;
      const st = visibleStyle(cell);
      if (!prev || !sameStyle(prev, st)) {
        out += `⟦${styleKey(st)}⟧`;
        prev = st;
      }
      if (opts.tags && cell.tag !== prevTag) {
        out += `⟪${cell.tag ?? ''}⟫`;
        prevTag = cell.tag;
      }
      out += cell.ch;
    }
    lines.push(out);
  }
  while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

/** Style with the attributes that cannot be seen on a blank cell cleared. */
function visibleStyle(cell: Cell): CellStyle {
  const s = cell.st;
  if (cell.ch !== ' ' || s.reverse || s.underline || s.strike || s.overline) return s;
  if (s.fg === -1 && !s.bold && !s.dim && !s.italic && !s.blink && !s.hidden) return s;
  return { ...DEFAULT_STYLE, bg: s.bg };
}

export function colorKey(c: TColor): string {
  if (c === -1) return '-';
  if (c >= RGB_FLAG) return '#' + (c - RGB_FLAG).toString(16).padStart(6, '0');
  return String(c);
}

export function styleKey(s: CellStyle): string {
  let k = `${colorKey(s.fg)}/${colorKey(s.bg)}`;
  if (s.bold) k += ' b';
  if (s.dim) k += ' d';
  if (s.italic) k += ' i';
  if (s.underline) k += ` u${s.underline}`;
  if (s.blink) k += ' k';
  if (s.reverse) k += ' r';
  if (s.hidden) k += ' h';
  if (s.strike) k += ' s';
  if (s.overline) k += ' o';
  return k;
}
