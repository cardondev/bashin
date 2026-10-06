/**
 * Prompt document → IR program.
 */
import { getPalette } from '../data/palettes';
import type { Palette } from '../data/palette-types';
import { getDef, optionsWithDefaults, type BuildCtx } from './elements';
import { RESET, type Cond, type Dir, type Line, type Op, type Program, type SGR, type StyleChoice, type VarRef } from './ir';
import type { PromptDoc, PromptElement, Style, Visibility } from './model';
import type { Provider } from './providers';
import { resolveStyle } from './sgr';
import { charWidth } from './wcwidth';

function mergeStyle(...styles: (Style | null | undefined)[]): Style {
  const out: Record<string, unknown> = {};
  for (const s of styles) if (s) for (const [k, v] of Object.entries(s)) if (v !== undefined) out[k] = v;
  return out as Style;
}

const sameSGR = (a: SGR | undefined, b: SGR | undefined) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

/** The element's style (merged with a part override) in each runtime state. */
export function styleChoice(el: PromptElement, over: Style | null, palette: Palette): StyleChoice {
  const c: StyleChoice = { b: resolveStyle(mergeStyle(el.style, over), palette) };
  if (el.rootStyle) c.r = resolveStyle(mergeStyle(el.style, el.rootStyle, over), palette);
  if (el.errorStyle) c.e = resolveStyle(mergeStyle(el.style, el.errorStyle, over), palette);
  if (el.rootStyle && el.errorStyle)
    c.re = resolveStyle(mergeStyle(el.style, el.rootStyle, el.errorStyle, over), palette);
  if (c.r && sameSGR(c.r, c.b)) delete c.r;
  if (c.e && sameSGR(c.e, c.b)) delete c.e;
  if (c.re && sameSGR(c.re, c.e ?? c.r ?? c.b)) delete c.re;
  return c;
}

function only(c: StyleChoice, keep: (s: SGR) => SGR): StyleChoice {
  const out: StyleChoice = { b: keep(c.b) };
  if (c.r) out.r = keep(c.r);
  if (c.e) out.e = keep(c.e);
  if (c.re) out.re = keep(c.re);
  return out;
}

function visibilityCond(v: Visibility | undefined): Cond | null {
  switch (v) {
    case 'error':
      return { k: 'err' };
    case 'success':
      return { k: 'ok' };
    case 'root':
      return { k: 'root' };
    case 'user':
      return { k: 'user' };
    case 'ssh':
      return { k: 'ssh' };
    case 'local':
      return { k: 'local' };
    default:
      return null;
  }
}

function and(...cs: (Cond | null | undefined)[]): Cond | null {
  const list = cs.filter((c): c is Cond => !!c);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  return { k: 'and', c: list };
}

function resolveRsty(ops: Op[], el: PromptElement, palette: Palette): { ops: Op[]; restyled: boolean } {
  let restyled = false;
  const walk = (list: Op[]): Op[] =>
    list.map((op): Op => {
      switch (op.t) {
        case 'rsty':
          restyled = true;
          return { t: 'sty', s: styleChoice(el, op.o, palette) };
        case 'if':
          return { ...op, then: walk(op.then), else: op.else ? walk(op.else) : undefined };
        case 'join':
          return { ...op, items: op.items.map((it) => ({ c: it.c, ops: walk(it.ops) })) };
        case 'title':
          return { ...op, body: walk(op.body) };
        default:
          return op;
      }
    });
  return { ops: walk(ops), restyled };
}

/** Characters a fill may repeat: one column wide and inert in PS1/PROMPT. */
export function cleanFill(ch: unknown): string {
  const first = [...String(ch ?? '')][0] ?? ' ';
  if (/[\\$`%'"!\x00-\x1f\x7f]/.test(first) || charWidth(first.codePointAt(0)!) !== 1) return '─';
  return first;
}

export function isSegmentElement(el: PromptElement, separator: PromptDoc['settings']['separator']): boolean {
  if (separator === 'none' || el.disabled) return false;
  const def = getDef(el.type);
  if ((def.structural && def.structural !== 'group') || def.invisible) return false;
  return !!el.style?.bg;
}

export function splitLines(elements: PromptElement[]): PromptElement[][] {
  const lines: PromptElement[][] = [[]];
  for (const el of elements) {
    if (el.disabled) continue;
    if (el.type === 'newline') lines.push([]);
    else lines[lines.length - 1].push(el);
  }
  return lines;
}

export function compile(doc: PromptDoc, paletteOverride?: Palette): Program {
  const palette = paletteOverride ?? getPalette(doc.settings.palette);
  const settings = doc.settings;
  const providers = new Map<string, Provider>();
  const types = new Set<string>();

  const ctx: BuildCtx = {
    palette,
    settings,
    use(p) {
      const existing = providers.get(p.key);
      if (!existing) providers.set(p.key, p);
      else if (existing.merge) providers.set(p.key, existing.merge(p));
      return (n: string): VarRef => ({ p: p.key, n });
    },
  };

  const padding = ' '.repeat(Math.max(0, Math.min(3, settings.padding | 0)));
  const lines: Line[] = [];

  /** One element's ops (without its tag), plus the condition it hides behind. */
  /**
   * One element's ops (without its tag), plus the condition it hides behind.
   * `mode`: a line member, a member of a plain group (`pills` closes each
   * segment so the group separator sits between them), or a member of a
   * segment group (drawn as plain runs on the group's background).
   */
  const compileElement = (
    el: PromptElement,
    dir: Dir,
    hasSeg: boolean,
    mode: 'line' | 'group' | 'pills' | 'seg-group' = 'line',
    /** Style to leave behind instead of a reset (members of a segment group keep its background). */
    endStyle?: StyleChoice,
  ): { cond: Cond | null; body: Op[] } => {
    const inGroup = mode === 'seg-group';
    types.add(el.type);
    const def = getDef(el.type);
    const o = optionsWithDefaults(el);
    const choice = styleChoice(el, null, palette);
    const built = def.build(el, o, ctx);
    const { ops: content, restyled } = resolveRsty(built.ops, el, palette);
    const cond = and(visibilityCond(el.show), built.cond);
    const body: Op[] = [];
    if (def.invisible) return { cond, body: content };
    const seg = !inGroup && isSegmentElement(el, settings.separator);
    if (seg) {
      body.push({
        t: 'seg',
        bg: only(choice, (s) => (s.bg ? { bg: s.bg } : {})),
        text: only(choice, (s) => (s.fg ? { fg: s.fg } : {})),
        dir,
      });
    } else if (hasSeg && !inGroup) {
      body.push({ t: 'segEnd', dir });
    }
    body.push({ t: 'sty', s: choice });
    if (seg && padding) body.push({ t: 'lit', s: padding });
    if (el.prefix) body.push({ t: 'lit', s: el.prefix });
    body.push(...content);
    if (el.suffix || (seg && padding)) {
      if (restyled) body.push({ t: 'sty', s: choice });
      if (el.suffix) body.push({ t: 'lit', s: el.suffix });
      if (seg && padding) body.push({ t: 'lit', s: padding });
    }
    if (!seg) body.push({ t: 'sty', s: endStyle ?? RESET });
    else if (mode === 'pills') body.push({ t: 'segEnd', dir });
    return { cond, body };
  };

  /** A member of a segment group inherits the group's background (and its root/error backgrounds). */
  const onGroupBg = (m: PromptElement, g: PromptElement): PromptElement => {
    const withBg = (s: Style | undefined, bg: Style['bg']): Style | undefined => (bg && !s?.bg ? { ...s, bg } : s);
    return {
      ...m,
      style: withBg(m.style, g.style?.bg) ?? {},
      rootStyle: g.rootStyle?.bg ? withBg(m.rootStyle ?? {}, g.rootStyle.bg) : m.rootStyle,
      errorStyle: g.errorStyle?.bg ? withBg(m.errorStyle ?? {}, g.errorStyle.bg) : m.errorStyle,
    };
  };

  for (const els of splitLines(doc.elements)) {
    const ops: Op[] = [];
    const firstFill = els.findIndex((e) => e.type === 'fill');
    const hasSeg = els.some((e) => isSegmentElement(e, settings.separator));
    let fills = 0;

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      types.add(el.type);
      const def = getDef(el.type);
      const dir: Dir = firstFill >= 0 && i > firstFill ? 'l' : 'r';
      const o = optionsWithDefaults(el);

      if (def.structural === 'fill') {
        if (hasSeg) ops.push({ t: 'tag', id: null }, { t: 'segEnd', dir: fills === 0 ? 'r' : 'l' });
        ops.push({ t: 'tag', id: el.id }, { t: 'fill', ch: cleanFill(o.char), s: styleChoice(el, null, palette) }, { t: 'tag', id: null });
        fills++;
        continue;
      }
      if (el.type === 'group-end') continue; // unmatched

      if (el.type === 'group') {
        // Members run up to the matching group-end (or the end of the line, or a fill).
        const members: PromptElement[] = [];
        let j = i + 1;
        for (; j < els.length; j++) {
          const m = els[j];
          if (m.type === 'group-end') break;
          if (m.type === 'fill' || m.type === 'group') {
            j--;
            break;
          }
          members.push(m);
        }
        i = Math.min(j, els.length - 1);
        const choice = styleChoice(el, null, palette);
        const sep = String(o.sep ?? ' ');
        const segGroup = isSegmentElement(el, settings.separator);
        const memberMode = segGroup ? 'seg-group' : sep ? 'pills' : 'group';
        const items = members.map((m) => {
          const c = compileElement(segGroup ? onGroupBg(m, el) : m, dir, hasSeg, memberMode, segGroup ? choice : undefined);
          return { c: c.cond ?? ({ k: 'true' } as Cond), ops: [{ t: 'tag', id: m.id } as Op, ...c.body, { t: 'tag', id: el.id } as Op] };
        });
        const always = items.some((it) => it.c.k === 'true');
        const cond = and(visibilityCond(el.show), always || !items.length ? null : { k: 'or', c: items.map((it) => it.c) });
        const open = String(o.open ?? '');
        const close = String(o.close ?? '');
        const body: Op[] = [];
        if (segGroup) {
          body.push({
            t: 'seg',
            bg: only(choice, (s) => (s.bg ? { bg: s.bg } : {})),
            text: only(choice, (s) => (s.fg ? { fg: s.fg } : {})),
            dir,
          });
          body.push({ t: 'sty', s: choice });
          if (padding) body.push({ t: 'lit', s: padding });
          if (el.prefix) body.push({ t: 'lit', s: el.prefix });
          if (open) body.push({ t: 'lit', s: open });
          body.push({ t: 'join', sep, items });
          body.push({ t: 'sty', s: choice });
          if (close) body.push({ t: 'lit', s: close });
          if (el.suffix) body.push({ t: 'lit', s: el.suffix });
          if (padding) body.push({ t: 'lit', s: padding });
        } else {
          if (hasSeg) body.push({ t: 'segEnd', dir });
          if (open || el.prefix) body.push({ t: 'sty', s: choice }, { t: 'lit', s: (el.prefix ?? '') + open }, { t: 'sty', s: RESET });
          body.push({ t: 'join', sep, items });
          if (hasSeg) body.push({ t: 'segEnd', dir });
          if (close || el.suffix) body.push({ t: 'sty', s: choice }, { t: 'lit', s: close + (el.suffix ?? '') }, { t: 'sty', s: RESET });
        }
        ops.push({ t: 'tag', id: el.id });
        if (cond) ops.push({ t: 'if', c: cond, then: body });
        else ops.push(...body);
        ops.push({ t: 'tag', id: null });
        continue;
      }

      const { cond, body } = compileElement(el, dir, hasSeg);
      ops.push({ t: 'tag', id: el.id });
      if (cond) ops.push({ t: 'if', c: cond, then: body });
      else ops.push(...body);
      ops.push({ t: 'tag', id: null });
    }

    if (hasSeg) {
      const lastDir: Dir = firstFill >= 0 && firstFill < els.length - 1 ? 'l' : 'r';
      ops.push({ t: 'segEnd', dir: lastDir });
    }
    lines.push({ ops, fills });
  }

  const ps2 = settings.ps2
    ? {
        text: settings.ps2,
        s: { b: resolveStyle(settings.ps2Color ? { fg: settings.ps2Color } : undefined, palette) },
      }
    : null;

  return { lines, providers, separator: settings.separator, newlineBefore: settings.newlineBefore, ps2, types };
}

/** Walk every op, depth first. */
export function walkOps(ops: Op[], fn: (op: Op) => void) {
  for (const op of ops) {
    fn(op);
    if (op.t === 'if') {
      walkOps(op.then, fn);
      if (op.else) walkOps(op.else, fn);
    } else if (op.t === 'join') for (const it of op.items) walkOps(it.ops, fn);
    else if (op.t === 'title') walkOps(op.body, fn);
  }
}
