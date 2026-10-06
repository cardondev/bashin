/**
 * Palette data shapes.
 *
 * Every palette exposes the same 26 semantic slots Catppuccin uses, so a prompt
 * colored with "mauve" or "surface0" re-themes cleanly when the palette changes.
 * Palettes that are not Catppuccin map their own colors onto those slots.
 */

export const ACCENT_TOKENS = [
  'rosewater',
  'flamingo',
  'pink',
  'mauve',
  'red',
  'maroon',
  'peach',
  'yellow',
  'green',
  'teal',
  'sky',
  'sapphire',
  'blue',
  'lavender',
] as const;

export const NEUTRAL_TOKENS = [
  'text',
  'subtext1',
  'subtext0',
  'overlay2',
  'overlay1',
  'overlay0',
  'surface2',
  'surface1',
  'surface0',
  'base',
  'mantle',
  'crust',
] as const;

export const TOKENS = [...ACCENT_TOKENS, ...NEUTRAL_TOKENS] as const;

export type AccentToken = (typeof ACCENT_TOKENS)[number];
export type NeutralToken = (typeof NEUTRAL_TOKENS)[number];
export type TokenName = (typeof TOKENS)[number];

/** Hex color, `#rrggbb` (lowercase). */
export type Hex = string;

export interface TerminalColors {
  background: Hex;
  foreground: Hex;
  cursor: Hex;
  selection: Hex;
  /** 16 ANSI colors: 0–7 normal, 8–15 bright. */
  ansi: Hex[];
}

/**
 * Raw palette definition. `neutrals` may be partial — missing neutral slots are
 * interpolated between the terminal background and foreground in OKLab.
 */
export interface PaletteSource {
  id: string;
  name: string;
  family: string;
  dark: boolean;
  /** Where the colors come from (official repo / docs). */
  source: string;
  terminal: TerminalColors;
  accents: Record<AccentToken, Hex>;
  neutrals?: Partial<Record<NeutralToken, Hex>>;
}

/** Fully resolved palette used by the app. */
export interface Palette {
  id: string;
  name: string;
  family: string;
  dark: boolean;
  source: string;
  terminal: TerminalColors;
  tokens: Record<TokenName, Hex>;
}
