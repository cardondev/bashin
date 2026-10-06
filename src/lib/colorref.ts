/** Display helpers for document colors. */
import { ANSI_NAMES } from '../data/palettes';
import type { Palette } from '../data/palette-types';
import { hexToRgb, indexToRgb, rgbToHex, XTERM_256 } from './color';
import { RGB_FLAG, type TColor } from './term';
import type { ColorRef } from './model';

export function refToHex(ref: ColorRef | null | undefined, palette: Palette): string | null {
  if (!ref) return null;
  if (ref.t === 'token') return palette.tokens[ref.v] ?? null;
  if (ref.t === 'hex') return ref.v;
  if (ref.t === 'ansi') return palette.terminal.ansi[ref.v] ?? null;
  return rgbToHex(XTERM_256[ref.v] ?? XTERM_256[0]);
}

export function refLabel(ref: ColorRef | null | undefined): string {
  if (!ref) return 'Default';
  if (ref.t === 'token') return ref.v;
  if (ref.t === 'hex') return ref.v;
  if (ref.t === 'ansi') return ANSI_NAMES[ref.v] ?? `ansi ${ref.v}`;
  return `color ${ref.v}`;
}

/** Hex for an emulator cell color (-1 → undefined: the terminal default). */
export function cellColorHex(c: TColor, palette: Palette): string | undefined {
  if (c === -1) return undefined;
  if (c >= RGB_FLAG) return rgbToHex(hexToRgb((c - RGB_FLAG).toString(16).padStart(6, '0')));
  return rgbToHex(indexToRgb(c, palette.terminal.ansi));
}
