/**
 * Document helpers: create, clone, validate, share.
 */
import LZString from 'lz-string';
import { PALETTES } from '../data/palettes';
import { ELEMENTS, getDef } from './elements';
import {
  DEFAULT_SETTINGS,
  newId,
  type ElementType,
  type PromptDoc,
  type PromptElement,
  type PromptSettings,
} from './model';

export function makeElement(type: ElementType): PromptElement {
  const d = getDef(type).defaults();
  return { id: newId(), type, ...structuredClone(d) };
}

/** Deep copy with fresh ids. */
export function cloneDoc(doc: PromptDoc): PromptDoc {
  const copy = structuredClone(doc);
  copy.elements = copy.elements.map((e) => ({ ...e, id: newId() }));
  return copy;
}

const SEPARATORS = new Set(['none', 'powerline', 'capsule', 'round', 'slant', 'backslant', 'flame', 'pixel', 'ice', 'blocks']);
const DEPTHS = new Set(['truecolor', '256', '16', 'auto']);

function cleanSettings(s: unknown): PromptSettings {
  const o = (s && typeof s === 'object' ? s : {}) as Partial<PromptSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...o,
    palette: PALETTES.some((p) => p.id === o.palette) ? o.palette! : DEFAULT_SETTINGS.palette,
    depth: DEPTHS.has(String(o.depth)) ? o.depth! : DEFAULT_SETTINGS.depth,
    separator: SEPARATORS.has(String(o.separator)) ? o.separator! : DEFAULT_SETTINGS.separator,
    padding: Math.max(0, Math.min(3, Number(o.padding ?? DEFAULT_SETTINGS.padding) | 0)),
    newlineBefore: !!o.newlineBefore,
    ps2: typeof o.ps2 === 'string' ? o.ps2.slice(0, 40) : DEFAULT_SETTINGS.ps2,
  };
}

/** Accept anything that looks like a prompt document; drop what doesn't. */
export function validateDoc(raw: unknown): PromptDoc | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<PromptDoc>;
  if (!Array.isArray(r.elements)) return null;
  const elements: PromptElement[] = [];
  for (const e of r.elements.slice(0, 200)) {
    if (!e || typeof e !== 'object' || !(e.type in ELEMENTS)) continue;
    elements.push({
      id: typeof e.id === 'string' && e.id ? e.id : newId(),
      type: e.type,
      ...(e.options && typeof e.options === 'object' ? { options: e.options } : {}),
      ...(e.style ? { style: e.style } : {}),
      ...(e.rootStyle ? { rootStyle: e.rootStyle } : {}),
      ...(e.errorStyle ? { errorStyle: e.errorStyle } : {}),
      ...(typeof e.prefix === 'string' ? { prefix: e.prefix } : {}),
      ...(typeof e.suffix === 'string' ? { suffix: e.suffix } : {}),
      ...(e.show ? { show: e.show } : {}),
      ...(e.disabled ? { disabled: true } : {}),
    });
  }
  return {
    v: 1,
    name: typeof r.name === 'string' && r.name.trim() ? r.name.slice(0, 80) : 'My prompt',
    elements,
    settings: cleanSettings(r.settings),
  };
}

// ── share links ──────────────────────────────────────────────────────────────

export function encodeDoc(doc: PromptDoc): string {
  const slim = { ...doc, elements: doc.elements.map(({ id: _id, ...rest }) => rest) };
  return LZString.compressToEncodedURIComponent(JSON.stringify(slim));
}

export function decodeDoc(s: string): PromptDoc | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(s);
    if (!json) return null;
    const doc = validateDoc(JSON.parse(json));
    return doc ? cloneDoc(doc) : null;
  } catch {
    return null;
  }
}

export function shareUrl(doc: PromptDoc): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}?p=${encodeDoc(doc)}`;
}

/** Where a group's matching end marker is (or -1). */
export function groupEnd(elements: PromptElement[], start: number): number {
  for (let i = start + 1; i < elements.length; i++) {
    const t = elements[i].type;
    if (t === 'group-end') return i;
    if (t === 'group' || t === 'newline' || t === 'fill') return -1;
  }
  return -1;
}
