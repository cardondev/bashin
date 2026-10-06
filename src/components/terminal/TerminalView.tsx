/**
 * Draws a Terminal screen as HTML, cell-accurate: every non-ASCII glyph gets
 * its own cell box so box drawing, emoji and Nerd Font icons stay on the grid,
 * and powerline separators are drawn as vectors that fill the cell exactly.
 */
import { memo, useMemo, type CSSProperties, type ReactNode } from 'react';
import type { Palette } from '../../data/palette-types';
import { mix } from '../../lib/color';
import { cellColorHex } from '../../lib/colorref';
import { styleKey, type Cell, type CellStyle, type Terminal } from '../../lib/term';
import { cn } from '../../lib/cn';

const cssCache = new WeakMap<Palette, Map<string, CSSProperties>>();

function cellCss(st: CellStyle, palette: Palette): CSSProperties {
  let cache = cssCache.get(palette);
  if (!cache) cssCache.set(palette, (cache = new Map()));
  const key = styleKey(st);
  const hit = cache.get(key);
  if (hit) return hit;
  const term = palette.terminal;
  let fg = cellColorHex(st.fg, palette) ?? term.foreground;
  let bg = cellColorHex(st.bg, palette);
  if (st.reverse) {
    const f = fg;
    fg = bg ?? term.background;
    bg = f;
  }
  if (st.dim) fg = mix(fg, bg ?? term.background, 0.42);
  const deco: string[] = [];
  if (st.underline) deco.push('underline');
  if (st.strike) deco.push('line-through');
  if (st.overline) deco.push('overline');
  const css: CSSProperties = {
    color: st.hidden ? 'transparent' : fg,
    backgroundColor: bg,
    fontWeight: st.bold ? 700 : undefined,
    fontStyle: st.italic ? 'italic' : undefined,
    textDecorationLine: deco.length ? deco.join(' ') : undefined,
    textDecorationStyle: st.underline === 3 ? 'wavy' : st.underline === 2 ? 'double' : st.underline === 4 ? 'dotted' : st.underline === 5 ? 'dashed' : undefined,
    textUnderlineOffset: st.underline ? '0.18em' : undefined,
  };
  cache.set(key, css);
  return css;
}

// ── powerline glyphs as vectors ─────────────────────────────────────────────

const stroke = { fill: 'none', strokeWidth: 1.1, vectorEffect: 'non-scaling-stroke' as const };

const PL: Record<number, (c: string) => ReactNode> = {
  0xe0b0: (c) => <polygon points="0,0 10,10 0,20" fill={c} />,
  0xe0b1: (c) => <polyline points="0,0 10,10 0,20" stroke={c} {...stroke} />,
  0xe0b2: (c) => <polygon points="10,0 0,10 10,20" fill={c} />,
  0xe0b3: (c) => <polyline points="10,0 0,10 10,20" stroke={c} {...stroke} />,
  0xe0b4: (c) => <path d="M0,0 C5.6,0 10,4.5 10,10 C10,15.5 5.6,20 0,20 Z" fill={c} />,
  0xe0b5: (c) => <path d="M0,0 C5.6,0 10,4.5 10,10 C10,15.5 5.6,20 0,20" stroke={c} {...stroke} />,
  0xe0b6: (c) => <path d="M10,0 C4.4,0 0,4.5 0,10 C0,15.5 4.4,20 10,20 Z" fill={c} />,
  0xe0b7: (c) => <path d="M10,0 C4.4,0 0,4.5 0,10 C0,15.5 4.4,20 10,20" stroke={c} {...stroke} />,
  0xe0b8: (c) => <polygon points="0,0 0,20 10,20" fill={c} />,
  0xe0b9: (c) => <line x1="0" y1="0" x2="10" y2="20" stroke={c} {...stroke} />,
  0xe0ba: (c) => <polygon points="10,0 10,20 0,20" fill={c} />,
  0xe0bb: (c) => <line x1="10" y1="0" x2="0" y2="20" stroke={c} {...stroke} />,
  0xe0bc: (c) => <polygon points="0,0 10,0 0,20" fill={c} />,
  0xe0bd: (c) => <line x1="10" y1="0" x2="0" y2="20" stroke={c} {...stroke} />,
  0xe0be: (c) => <polygon points="0,0 10,0 10,20" fill={c} />,
  0xe0bf: (c) => <line x1="0" y1="0" x2="10" y2="20" stroke={c} {...stroke} />,
};

const isPua = (cp: number) => (cp >= 0xe000 && cp <= 0xf8ff) || (cp >= 0xf0000 && cp <= 0xffffd);

interface Seg {
  kind: 'run' | 'cell' | 'pl' | 'icon';
  text: string;
  w: number;
  st: CellStyle;
  tag: string | null;
  cursor?: boolean;
}

function segments(row: Cell[], cursorCol: number | null): Seg[] {
  const out: Seg[] = [];
  for (let c = 0; c < row.length; c++) {
    const cell = row[c];
    if (cell.w === 0) continue;
    const cp = cell.ch.codePointAt(0) ?? 32;
    const isCursor = cursorCol === c;
    const special = isCursor || cell.w === 2 || cp > 0x7e || cp < 0x20;
    if (special) {
      out.push({
        kind: PL[cp] ? 'pl' : isPua(cp) ? 'icon' : 'cell',
        text: cell.ch,
        w: cell.w,
        st: cell.st,
        tag: cell.tag,
        cursor: isCursor,
      });
      continue;
    }
    const last = out[out.length - 1];
    if (last && last.kind === 'run' && last.st === cell.st && last.tag === cell.tag) {
      last.text += cell.ch;
      last.w += 1;
    } else out.push({ kind: 'run', text: cell.ch, w: 1, st: cell.st, tag: cell.tag });
  }
  return out;
}

export interface TerminalViewProps {
  term: Terminal;
  palette: Palette;
  fontSize?: number;
  cursor?: boolean;
  title?: string;
  chrome?: boolean;
  minRows?: number;
  hoverTag?: string | null;
  selectedTag?: string | null;
  onTagHover?: (tag: string | null) => void;
  onTagClick?: (tag: string) => void;
  className?: string;
  bodyClassName?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  /** Keep only the last N rows. */
  maxRows?: number;
}

export const TerminalView = memo(function TerminalView({
  term,
  palette,
  fontSize = 14,
  cursor = true,
  title,
  chrome = true,
  minRows = 0,
  hoverTag,
  selectedTag,
  onTagHover,
  onTagClick,
  className,
  bodyClassName,
  badge,
  actions,
  maxRows,
}: TerminalViewProps) {
  const t = palette.terminal;
  const rows = useMemo(() => {
    const all = term.rows.map((row, r) => {
      const cols = cursor && r === term.r ? term.c : null;
      let cells = row;
      if (cols !== null && row.length <= cols) {
        cells = [...row];
        while (cells.length <= cols) cells.push({ ch: ' ', w: 1, st: DEFAULT_ST, tag: null });
      }
      return segments(cells, cols);
    });
    return maxRows && all.length > maxRows ? all.slice(all.length - maxRows) : all;
  }, [term, cursor, maxRows]);

  const pad = Math.max(0, minRows - rows.length);

  const render = (s: Seg, i: number) => {
    const base = cellCss(s.st, palette);
    let style: CSSProperties = base;
    if (s.cursor) style = { ...base, backgroundColor: t.cursor, color: t.background };
    const cls = cn(
      s.tag && s.tag === selectedTag ? 'term-sel' : s.tag && s.tag === hoverTag ? 'term-hl' : undefined,
      s.st.blink && 'term-blink',
      s.cursor && cursor && 'term-cursor',
    );
    const data = s.tag ? { 'data-tag': s.tag } : undefined;
    if (s.kind === 'run')
      return (
        <span key={i} style={style} className={cls || undefined} {...data}>
          {s.text}
        </span>
      );
    const width = { width: `${s.w}ch` };
    if (s.kind === 'pl') {
      const cp = s.text.codePointAt(0)!;
      return (
        <span key={i} style={{ ...style, ...width }} className={cn('term-pl', cls)} {...data}>
          <svg viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden>
            {PL[cp](String(style.color ?? t.foreground))}
          </svg>
        </span>
      );
    }
    return (
      <span key={i} style={{ ...style, ...width }} className={cn('term-cell', s.kind === 'icon' && 'term-icon', cls)} {...data}>
        {s.text}
      </span>
    );
  };

  const body = (
    <div
      className={cn('term overflow-hidden px-4 py-3.5', bodyClassName)}
      style={{ fontSize, color: t.foreground, backgroundColor: t.background }}
      onMouseMove={
        onTagHover
          ? (e) => {
              const el = (e.target as HTMLElement).closest('[data-tag]');
              onTagHover(el ? el.getAttribute('data-tag') : null);
            }
          : undefined
      }
      onMouseLeave={onTagHover ? () => onTagHover(null) : undefined}
      onClick={
        onTagClick
          ? (e) => {
              const el = (e.target as HTMLElement).closest('[data-tag]');
              const tag = el?.getAttribute('data-tag');
              if (tag) onTagClick(tag);
            }
          : undefined
      }
    >
      {rows.map((segs, r) => (
        <div key={r} className="term-row">
          {segs.length ? segs.map(render) : ' '}
        </div>
      ))}
      {Array.from({ length: pad }, (_, i) => (
        <div key={`p${i}`} className="term-row">
          {' '}
        </div>
      ))}
    </div>
  );

  if (!chrome) return <div className={cn('overflow-hidden', className)}>{body}</div>;

  return (
    <div
      className={cn('overflow-hidden rounded-2xl ring-1 ring-black/20 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]', className)}
      style={{ backgroundColor: t.background }}
    >
      <div
        className="relative flex h-9 items-center gap-2 px-3.5"
        style={{ backgroundColor: mix(t.background, palette.dark ? '#000000' : t.foreground, palette.dark ? 0.28 : 0.07) }}
      >
        <span className="size-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
        <span className="size-3 rounded-full" style={{ backgroundColor: '#febc2e' }} />
        <span className="size-3 rounded-full" style={{ backgroundColor: '#28c840' }} />
        <div
          className="pointer-events-none absolute inset-x-24 truncate text-center font-mono text-xs"
          style={{ color: mix(t.foreground, t.background, 0.35) }}
        >
          {title}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {badge}
          {actions}
        </div>
      </div>
      {body}
    </div>
  );
});

const DEFAULT_ST: CellStyle = Object.freeze({
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
