/**
 * Color math: hex/RGB conversion, OKLab interpolation and distance, the
 * xterm-256 table, nearest-color matching for 256/16-color output, and WCAG
 * contrast.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = Number.parseInt(h.slice(0, 6), 16);
  if (!/^[0-9a-f]{6}$/i.test(h.slice(0, 6)) || Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const h = (v: number) => clamp255(v).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function isHex(s: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(s.trim());
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// ── OKLab ────────────────────────────────────────────────────────────────────

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return c * 255;
}

export type Lab = [number, number, number];

export function rgbToOklab({ r, g, b }: RGB): Lab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, A, B]: Lab): RGB {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: clamp255(linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: clamp255(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: clamp255(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  };
}

/** Interpolate two hex colors in OKLab; t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const la = rgbToOklab(hexToRgb(a));
  const lb = rgbToOklab(hexToRgb(b));
  return rgbToHex(
    oklabToRgb([la[0] + (lb[0] - la[0]) * t, la[1] + (lb[1] - la[1]) * t, la[2] + (lb[2] - la[2]) * t]),
  );
}

/** Perceptual distance (Euclidean in OKLab). */
export function distance(a: RGB, b: RGB): number {
  const x = rgbToOklab(a);
  const y = rgbToOklab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

// ── xterm-256 ────────────────────────────────────────────────────────────────

const CUBE = [0, 95, 135, 175, 215, 255];

/** Standard xterm defaults for 0–15 (only used when no terminal palette is given). */
const XTERM_16 = [
  '#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000ee', '#cd00cd', '#00cdcd', '#e5e5e5',
  '#7f7f7f', '#ff0000', '#00ff00', '#ffff00', '#5c5cff', '#ff00ff', '#00ffff', '#ffffff',
];

export const XTERM_256: RGB[] = (() => {
  const out: RGB[] = XTERM_16.map(hexToRgb);
  for (let r = 0; r < 6; r++)
    for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) out.push({ r: CUBE[r], g: CUBE[g], b: CUBE[b] });
  for (let i = 0; i < 24; i++) {
    const v = 8 + i * 10;
    out.push({ r: v, g: v, b: v });
  }
  return out;
})();

const LAB_256 = XTERM_256.map(rgbToOklab);

/** Nearest xterm-256 index in 16–255 (0–15 vary per terminal theme, so they are skipped). */
export function nearest256(c: RGB): number {
  const lab = rgbToOklab(c);
  let best = 16;
  let bestD = Infinity;
  for (let i = 16; i < 256; i++) {
    const p = LAB_256[i];
    const d = (lab[0] - p[0]) ** 2 + (lab[1] - p[1]) ** 2 + (lab[2] - p[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Nearest of the 16 ANSI colors of a terminal palette. */
export function nearestAnsi(c: RGB, ansi: string[]): number {
  const lab = rgbToOklab(c);
  let best = 0;
  let bestD = Infinity;
  ansi.forEach((hex, i) => {
    const p = rgbToOklab(hexToRgb(hex));
    // Chroma matters more than lightness when collapsing to 16 colors, so a
    // pastel mauve lands on magenta rather than on white.
    const d = 0.6 * (lab[0] - p[0]) ** 2 + (lab[1] - p[1]) ** 2 + (lab[2] - p[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** RGB of a 0–255 index, using the terminal's 16 colors for 0–15. */
export function indexToRgb(i: number, ansi?: string[]): RGB {
  if (i < 16 && ansi?.[i]) return hexToRgb(ansi[i]);
  return XTERM_256[Math.max(0, Math.min(255, i))];
}

// ── Contrast ─────────────────────────────────────────────────────────────────

export function luminance({ r, g, b }: RGB): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
