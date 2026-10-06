/**
 * SGR encoding shared by the preview and the shell generators, so both emit
 * byte-identical escape sequences — and the powerline separator glyphs.
 */
import type { Palette } from '../data/palette-types';
import { hexToRgb, nearest256, nearestAnsi, XTERM_256, rgbToHex } from './color';
import type { Color, SGR, StyleChoice } from './ir';
import type { ColorRef, SeparatorStyle, Style } from './model';

export type Depth = 'truecolor' | '256' | '16';

/** Resolve a document color against a palette. */
export function resolveColor(ref: ColorRef | null | undefined, palette: Palette): Color | undefined {
  if (!ref) return undefined;
  switch (ref.t) {
    case 'token': {
      const hex = palette.tokens[ref.v];
      if (!hex) return undefined;
      const { r, g, b } = hexToRgb(hex);
      return { k: 'rgb', r, g, b };
    }
    case 'hex': {
      const { r, g, b } = hexToRgb(ref.v);
      return { k: 'rgb', r, g, b };
    }
    case 'ansi':
      return { k: 'idx', i: Math.max(0, Math.min(15, ref.v | 0)) };
    case 'x256':
      return { k: 'idx', i: Math.max(0, Math.min(255, ref.v | 0)) };
  }
}

export function resolveStyle(s: Style | undefined, palette: Palette): SGR {
  if (!s) return {};
  const out: SGR = {};
  const fg = resolveColor(s.fg, palette);
  const bg = resolveColor(s.bg, palette);
  if (fg) out.fg = fg;
  if (bg) out.bg = bg;
  for (const a of ['bold', 'dim', 'italic', 'underline', 'blink', 'reverse', 'strike', 'overline'] as const)
    if (s[a]) out[a] = true;
  return out;
}

/** Downsample a color for the target depth. */
export function convertColor(c: Color, depth: Depth, palette: Palette): Color {
  if (c.k === 'idx') {
    if (depth === '16' && c.i >= 16) return { k: 'idx', i: nearestAnsi(XTERM_256[c.i], palette.terminal.ansi) };
    return c;
  }
  if (depth === 'truecolor') return c;
  if (depth === '256') return { k: 'idx', i: nearest256(c) };
  return { k: 'idx', i: nearestAnsi(c, palette.terminal.ansi) };
}

export function fgParams(c: Color): string {
  if (c.k === 'rgb') return `38;2;${c.r};${c.g};${c.b}`;
  if (c.i < 8) return String(30 + c.i);
  if (c.i < 16) return String(90 + c.i - 8);
  return `38;5;${c.i}`;
}

export function bgParams(c: Color): string {
  if (c.k === 'rgb') return `48;2;${c.r};${c.g};${c.b}`;
  if (c.i < 8) return String(40 + c.i);
  if (c.i < 16) return String(100 + c.i - 8);
  return `48;5;${c.i}`;
}

const ATTR_CODES: [keyof SGR, string][] = [
  ['bold', '1'],
  ['dim', '2'],
  ['italic', '3'],
  ['underline', '4'],
  ['blink', '5'],
  ['reverse', '7'],
  ['strike', '9'],
  ['overline', '53'],
];

/** SGR parameters for a style, always starting with a reset (`0`). */
export function sgrParams(s: SGR, depth: Depth, palette: Palette): string {
  const parts = ['0'];
  for (const [k, code] of ATTR_CODES) if (s[k]) parts.push(code);
  if (s.fg) parts.push(fgParams(convertColor(s.fg, depth, palette)));
  if (s.bg) parts.push(bgParams(convertColor(s.bg, depth, palette)));
  return parts.join(';');
}

export function hasVariants(s: StyleChoice): boolean {
  return !!(s.r || s.e || s.re);
}

/** The style in effect for a runtime state. */
export function pick(s: StyleChoice, root: boolean, err: boolean): SGR {
  if (root && err) return s.re ?? s.e ?? s.r ?? s.b;
  if (err) return s.e ?? s.b;
  if (root) return s.r ?? s.b;
  return s.b;
}

export function colorToHex(c: Color, palette: Palette): string {
  if (c.k === 'rgb') return rgbToHex(c);
  if (c.i < 16) return palette.terminal.ansi[c.i];
  return rgbToHex(XTERM_256[c.i]);
}

// ── Powerline separators ─────────────────────────────────────────────────────

export interface SepGlyphs {
  /** Before the first segment (fg = segment bg, default bg). */
  start: string;
  /** Between two segments: dir r → fg = previous bg, bg = next bg; dir l → fg = next bg, bg = previous bg. */
  sep: string;
  /** Between two segments with the same background (drawn in the text color). */
  thin: string;
  /** After the last segment (fg = segment bg, default bg). */
  end: string;
}

export interface SeparatorDef {
  label: string;
  /** Segments flowing right (left side of a line). */
  r: SepGlyphs;
  /** Segments right-aligned after a fill. */
  l: SepGlyphs;
}

export const SEPARATORS: Record<Exclude<SeparatorStyle, 'none'>, SeparatorDef> = {
  powerline: {
    label: 'Powerline',
    r: { start: '', sep: '\u{e0b0}', thin: '\u{e0b1}', end: '\u{e0b0}' },
    l: { start: '\u{e0b2}', sep: '\u{e0b2}', thin: '\u{e0b3}', end: '' },
  },
  capsule: {
    label: 'Capsule',
    r: { start: '\u{e0b6}', sep: '\u{e0b0}', thin: '\u{e0b1}', end: '\u{e0b4}' },
    l: { start: '\u{e0b6}', sep: '\u{e0b2}', thin: '\u{e0b3}', end: '\u{e0b4}' },
  },
  round: {
    label: 'Rounded',
    r: { start: '\u{e0b6}', sep: '\u{e0b4}', thin: '\u{e0b5}', end: '\u{e0b4}' },
    l: { start: '\u{e0b6}', sep: '\u{e0b6}', thin: '\u{e0b7}', end: '\u{e0b4}' },
  },
  slant: {
    label: 'Slanted /',
    r: { start: '\u{e0ba}', sep: '\u{e0bc}', thin: '\u{e0bb}', end: '\u{e0bc}' },
    l: { start: '\u{e0ba}', sep: '\u{e0ba}', thin: '\u{e0bb}', end: '\u{e0bc}' },
  },
  backslant: {
    label: 'Slanted \\',
    r: { start: '\u{e0be}', sep: '\u{e0b8}', thin: '\u{e0b9}', end: '\u{e0b8}' },
    l: { start: '\u{e0be}', sep: '\u{e0be}', thin: '\u{e0b9}', end: '\u{e0b8}' },
  },
  flame: {
    label: 'Flames',
    r: { start: '\u{e0c2}', sep: '\u{e0c0}', thin: '\u{e0c1}', end: '\u{e0c0}' },
    l: { start: '\u{e0c2}', sep: '\u{e0c2}', thin: '\u{e0c3}', end: '\u{e0c0}' },
  },
  pixel: {
    label: 'Pixels',
    r: { start: '\u{e0c7}', sep: '\u{e0c6}', thin: '\u{e0c6}', end: '\u{e0c6}' },
    l: { start: '\u{e0c7}', sep: '\u{e0c7}', thin: '\u{e0c7}', end: '\u{e0c6}' },
  },
  ice: {
    label: 'Ice',
    r: { start: '\u{e0ca}', sep: '\u{e0c8}', thin: '\u{e0c8}', end: '\u{e0c8}' },
    l: { start: '\u{e0ca}', sep: '\u{e0ca}', thin: '\u{e0ca}', end: '\u{e0c8}' },
  },
  blocks: {
    label: 'Fade blocks',
    r: { start: '░▒▓', sep: '▓▒░', thin: '│', end: '▓▒░' },
    l: { start: '░▒▓', sep: '░▒▓', thin: '│', end: '▓▒░' },
  },
};

export function separatorGlyphs(style: SeparatorStyle, dir: 'r' | 'l'): SepGlyphs | null {
  if (style === 'none') return null;
  return SEPARATORS[style][dir];
}
