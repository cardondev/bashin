import { flavors } from '@catppuccin/palette';
import { mix } from '../lib/color';
import {
  ACCENT_TOKENS,
  NEUTRAL_TOKENS,
  type AccentToken,
  type NeutralToken,
  type Palette,
  type PaletteSource,
  type TokenName,
} from './palette-types';
import { EXTRA_PALETTES } from './palettes-extra';

export type { Palette, TokenName } from './palette-types';

// ── Catppuccin (exact values from @catppuccin/palette) ──────────────────────

const ANSI_ORDER = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const;

function catppuccin(id: 'mocha' | 'macchiato' | 'frappe' | 'latte'): PaletteSource {
  const f = flavors[id];
  const c = f.colors;
  const accents = Object.fromEntries(ACCENT_TOKENS.map((t) => [t, c[t].hex])) as Record<AccentToken, string>;
  const neutrals = Object.fromEntries(NEUTRAL_TOKENS.map((t) => [t, c[t].hex])) as Record<NeutralToken, string>;
  const ansi = [
    ...ANSI_ORDER.map((k) => f.ansiColors[k].normal.hex),
    ...ANSI_ORDER.map((k) => f.ansiColors[k].bright.hex),
  ];
  return {
    id: `catppuccin-${id}`,
    name: `Catppuccin ${f.name}`,
    family: 'Catppuccin',
    dark: f.dark,
    source: 'https://catppuccin.com/palette',
    terminal: {
      background: c.base.hex,
      foreground: c.text.hex,
      cursor: c.rosewater.hex,
      selection: c.surface2.hex,
      ansi,
    },
    accents,
    neutrals,
  };
}

// ── Monochrome CRT palettes (NovaShell's matrix and retro prompts) ──────────

const PHOSPHOR: PaletteSource = {
  id: 'phosphor',
  name: 'Green Phosphor',
  family: 'CRT',
  dark: true,
  source: 'NovaShell matrix prompt (0;255;65 / 0;180;45 / 0;110;30)',
  terminal: {
    background: '#050a05',
    foreground: '#00ff41',
    cursor: '#00ff41',
    selection: '#0a4a14',
    ansi: [
      '#0b1f0b', '#ff4040', '#00b42d', '#7fff4f', '#00a86b', '#3cff7a', '#00e08a', '#00b42d',
      '#006e1e', '#ff6060', '#00ff41', '#b6ff8a', '#00d084', '#5cff9a', '#66ffcc', '#c8ffc8',
    ],
  },
  accents: {
    rosewater: '#c8ffc8', flamingo: '#9dff9d', pink: '#5cff9a', mauve: '#3cff7a', red: '#ff4040',
    maroon: '#ff6060', peach: '#7fff4f', yellow: '#b6ff8a', green: '#00ff41', teal: '#00d084',
    sky: '#66ffcc', sapphire: '#00c060', blue: '#00b42d', lavender: '#8cffb0',
  },
  neutrals: {
    text: '#00ff41', subtext1: '#00e03a', subtext0: '#00c032', overlay2: '#00a02a', overlay1: '#008a24',
    overlay0: '#006e1e', surface2: '#0a4a14', surface1: '#083810', surface0: '#06280c', base: '#050a05',
    mantle: '#030603', crust: '#010301',
  },
};

const AMBER: PaletteSource = {
  id: 'amber',
  name: 'Amber CRT',
  family: 'CRT',
  dark: true,
  source: 'NovaShell retro prompt (255;176;0 / 170;110;0)',
  terminal: {
    background: '#120c02',
    foreground: '#ffb000',
    cursor: '#ffb000',
    selection: '#5c3b00',
    ansi: [
      '#2a1c05', '#ff5f1f', '#ffb000', '#ffd75f', '#cc8a00', '#ff9d3c', '#ffc966', '#ffb000',
      '#6b4600', '#ff7a45', '#ffc23a', '#ffe08a', '#e6a100', '#ffb366', '#ffd699', '#ffe5b4',
    ],
  },
  accents: {
    rosewater: '#ffe5b4', flamingo: '#ffd699', pink: '#ffb366', mauve: '#ff9d3c', red: '#ff5f1f',
    maroon: '#ff7a45', peach: '#ff9d3c', yellow: '#ffd75f', green: '#ffb000', teal: '#ffc966',
    sky: '#ffd699', sapphire: '#e6a100', blue: '#cc8a00', lavender: '#ffe08a',
  },
  neutrals: {
    text: '#ffb000', subtext1: '#eaa000', subtext0: '#d48f00', overlay2: '#bf7f00', overlay1: '#aa6e00',
    overlay0: '#8f5c00', surface2: '#5c3b00', surface1: '#432b02', surface0: '#2e1e03', base: '#120c02',
    mantle: '#0c0801', crust: '#070500',
  },
};

// ── Resolution ───────────────────────────────────────────────────────────────

/** Fractions from background (0) to foreground (1) for interpolated neutrals. */
const NEUTRAL_STEPS: Partial<Record<NeutralToken, number>> = {
  surface0: 0.11,
  surface1: 0.22,
  surface2: 0.33,
  overlay0: 0.45,
  overlay1: 0.56,
  overlay2: 0.67,
  subtext0: 0.78,
  subtext1: 0.89,
};

export function resolvePalette(src: PaletteSource): Palette {
  const bg = src.neutrals?.base ?? src.terminal.background;
  const fg = src.neutrals?.text ?? src.terminal.foreground;
  const n = src.neutrals ?? {};
  const neutrals = {} as Record<NeutralToken, string>;
  for (const t of NEUTRAL_TOKENS) {
    if (n[t]) neutrals[t] = n[t]!;
    else if (t === 'base') neutrals[t] = bg;
    else if (t === 'text') neutrals[t] = fg;
    else if (t === 'mantle') neutrals[t] = src.dark ? mix(bg, '#000000', 0.18) : mix(bg, fg, 0.05);
    else if (t === 'crust') neutrals[t] = src.dark ? mix(bg, '#000000', 0.38) : mix(bg, fg, 0.1);
    else neutrals[t] = mix(bg, fg, NEUTRAL_STEPS[t] ?? 0.5);
  }
  return {
    id: src.id,
    name: src.name,
    family: src.family,
    dark: src.dark,
    source: src.source,
    terminal: { ...src.terminal, ansi: src.terminal.ansi.map((h) => h.toLowerCase()) },
    tokens: { ...src.accents, ...neutrals } as Record<TokenName, string>,
  };
}

export const PALETTES: Palette[] = [
  catppuccin('mocha'),
  catppuccin('macchiato'),
  catppuccin('frappe'),
  catppuccin('latte'),
  ...EXTRA_PALETTES,
  PHOSPHOR,
  AMBER,
].map(resolvePalette);

export const DEFAULT_PALETTE_ID = 'catppuccin-mocha';

const BY_ID = new Map(PALETTES.map((p) => [p.id, p]));

export function getPalette(id: string | undefined): Palette {
  return (id && BY_ID.get(id)) || BY_ID.get(DEFAULT_PALETTE_ID)!;
}

export const ANSI_NAMES = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'bright black', 'bright red', 'bright green', 'bright yellow', 'bright blue', 'bright magenta', 'bright cyan', 'bright white',
];
