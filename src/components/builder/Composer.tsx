/**
 * The prompt as a row of chips: one per element, in order, wrapping at each
 * new line. Drag to reorder (or drop library items in), click to edit.
 */
import { useDndMonitor, useDraggable, useDroppable } from '@dnd-kit/core';
import { CornerDownLeft, EyeOff, GripVertical, MoveHorizontal, Plus } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import type { Palette } from '../../data/palette-types';
import { getDef, optionsWithDefaults } from '../../lib/elements';
import type { PromptElement } from '../../lib/model';
import { usePrompt } from '../../store/prompt';
import { useUI } from '../../store/ui';
import { Icon } from '../ui/Icon';
import { Button, Popover } from '../ui/primitives';
import { cn } from '../../lib/cn';
import { refToHex } from '../../lib/colorref';
import { Library } from './Library';

export interface Sample {
  text: string;
  runs: { text: string; fg?: string; bg?: string }[];
}

export interface DropTarget {
  id: string;
  side: 'before' | 'after';
}

function chipColors(el: PromptElement, palette: Palette) {
  return {
    fg: refToHex(el.style?.fg, palette) ?? palette.terminal.foreground,
    bg: refToHex(el.style?.bg, palette) ?? undefined,
  };
}

function summary(el: PromptElement): string {
  const o = optionsWithDefaults(el);
  switch (el.type) {
    case 'text':
      return JSON.stringify(String(o.text ?? '')).slice(1, -1) || '(empty)';
    case 'symbol':
      return String(o.char ?? '');
    case 'prompt-char':
      return String(o.char ?? '');
    case 'fill':
      return `${String(o.char ?? '─').repeat(3)}`;
    case 'group':
      return `${o.open ?? ''}…${o.close ?? ''}`;
    case 'env':
      return `$${o.name}`;
    case 'command':
      return `$(${o.cmd})`;
    default:
      return '';
  }
}

function Chip({
  el,
  index,
  sample,
  palette,
  selected,
  hovered,
  drop,
}: {
  el: PromptElement;
  index: number;
  sample: Sample | undefined;
  palette: Palette;
  selected: boolean;
  hovered: boolean;
  drop: 'before' | 'after' | null;
}) {
  const def = getDef(el.type);
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({ id: el.id, data: { from: 'composer', index } });
  const { setNodeRef: dropRef } = useDroppable({ id: el.id });
  const select = useUI((s) => s.select);
  const hover = useUI((s) => s.hover);
  const ref = (n: HTMLElement | null) => {
    dragRef(n);
    dropRef(n);
  };
  const { fg } = chipColors(el, palette);
  const hiddenNow = !sample?.text && !def.structural && !def.invisible;
  const indicator = drop && (
    <span
      className={cn('pointer-events-none absolute inset-y-0.5 w-0.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]', drop === 'before' ? '-left-[5px]' : '-right-[5px]')}
    />
  );
  const common = {
    ref,
    ...attributes,
    ...listeners,
    'data-chip': el.id,
    onClick: () => select(selected ? null : el.id),
    onMouseEnter: () => hover(el.id),
    onMouseLeave: () => hover(null),
    'aria-pressed': selected,
    'aria-label': `${def.name}${sample?.text ? `: ${sample.text}` : ''}`,
  } as const;

  if (el.type === 'newline')
    return (
      <div className="relative basis-full">
        <button
          type="button"
          {...common}
          className={cn(
            'flex h-6 w-full items-center gap-2 rounded-lg px-2 text-[0.6875rem] text-overlay1 transition-colors hover:text-text',
            selected ? 'bg-accent/15 text-accent ring-1 ring-accent/50' : 'hover:bg-surface0/50',
            isDragging && 'opacity-30',
          )}
        >
          <span className="h-px flex-1 bg-surface1" />
          <CornerDownLeft className="size-3" /> new line
          <span className="h-px flex-1 bg-surface1" />
        </button>
        {indicator}
      </div>
    );

  const isGroup = el.type === 'group' || el.type === 'group-end';
  const showText = sample?.text ?? '';

  return (
    <div className={cn('relative', el.type === 'fill' && 'min-w-24 flex-1')}>
      <button
        type="button"
        {...common}
        className={cn(
          'group/chip flex h-14 w-full min-w-0 max-w-[18rem] flex-col justify-center gap-1 rounded-xl border px-2.5 text-left transition-[border-color,background,box-shadow] duration-150',
          el.type === 'fill' && 'max-w-none',
          selected
            ? 'border-accent bg-accent/10 shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)]'
            : hovered
              ? 'border-surface2 bg-surface0/60'
              : 'border-surface0 bg-base/70 hover:border-surface2',
          isGroup && !selected && 'border-dashed',
          el.disabled && 'opacity-45',
          isDragging && 'opacity-30',
        )}
      >
        <span className="flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-overlay1">
          <GripVertical className="-ml-1 size-3 shrink-0 text-surface2 group-hover/chip:text-overlay1" />
          <Icon name={def.icon} className="size-3 shrink-0" />
          <span className="truncate">{el.type === 'group-end' ? 'end group' : def.name}</span>
          {el.disabled ? (
            <EyeOff className="ml-auto size-3 shrink-0" />
          ) : (
            hiddenNow && <span className="ml-auto shrink-0 rounded bg-surface0 px-1 text-[0.55rem] normal-case tracking-normal text-overlay0">hidden now</span>
          )}
        </span>
        <span
          className="block min-h-[1.25rem] truncate rounded-md px-1.5 font-mono text-[0.8125rem] leading-5"
          style={{
            backgroundColor: palette.terminal.background,
            color: fg,
            fontFamily: '"JetBrains Mono Variable", "Bashin Symbols", monospace',
          }}
        >
          {el.type === 'fill' ? (
            <span className="flex items-center gap-1 opacity-80">
              <MoveHorizontal className="size-3.5" />
              {summary(el)}
            </span>
          ) : el.type === 'title' ? (
            <span className="text-overlay1">window title</span>
          ) : showText.trim() ? (
            sample!.runs.map((r, i) => (
              <span key={i} style={{ color: r.fg ?? palette.terminal.foreground, backgroundColor: r.bg }}>
                {r.text.replace(/ /g, '\u00a0')}
              </span>
            ))
          ) : showText ? (
            <span className="opacity-40">{'␣'.repeat(Math.min(6, showText.length))}</span>
          ) : (
            <span className="opacity-50">{summary(el) || def.name.toLowerCase()}</span>
          )}
        </span>
      </button>
      {indicator}
    </div>
  );
}

export function Composer({ samples, palette, drop }: { samples: Map<string, Sample>; palette: Palette; drop: DropTarget | null }) {
  const elements = usePrompt((s) => s.doc.elements);
  const selectedId = useUI((s) => s.selectedId);
  const hoverId = useUI((s) => s.hoverId);
  const { setNodeRef } = useDroppable({ id: 'composer:end' });
  const [addOpen, setAddOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  useDndMonitor({ onDragStart: () => setDragging(true), onDragEnd: () => setDragging(false), onDragCancel: () => setDragging(false) });

  const onKey = (e: KeyboardEvent) => {
    const id = (e.target as HTMLElement).closest('[data-chip]')?.getAttribute('data-chip');
    if (!id) return;
    const i = elements.findIndex((x) => x.id === id);
    const { move, remove, duplicate } = usePrompt.getState();
    const { select } = useUI.getState();
    const focus = (j: number) => {
      const t = elements[Math.max(0, Math.min(elements.length - 1, j))];
      if (t) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-chip="${t.id}"]`)?.focus());
    };
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.altKey) {
      e.preventDefault();
      const j = e.key === 'ArrowLeft' ? i - 1 : i + 1;
      if (j >= 0 && j < elements.length) {
        move(i, j);
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-chip="${id}"]`)?.focus());
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      focus(e.key === 'ArrowLeft' ? i - 1 : i + 1);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      remove(id);
      select(null);
      focus(i);
    } else if (e.key.toLowerCase() === 'd' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const n = duplicate(id);
      if (n) select(n);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onKeyDown={onKey}
      className={cn('flex flex-wrap items-stretch gap-2 rounded-2xl p-1 transition-colors', dragging && 'bg-accent/5 ring-1 ring-dashed ring-accent/30')}
      role="list"
      aria-label="Prompt elements"
    >
      {elements.map((el, i) => (
        <Chip
          key={el.id}
          el={el}
          index={i}
          sample={samples.get(el.id)}
          palette={palette}
          selected={el.id === selectedId}
          hovered={el.id === hoverId}
          drop={drop?.id === el.id ? drop.side : null}
        />
      ))}
      <Popover
        open={addOpen}
        onOpenChange={setAddOpen}
        className="w-80 p-0"
        trigger={
          <Button variant="outline" className={cn('h-14 border-dashed px-4', drop?.id === 'composer:end' && 'border-accent text-accent')} aria-label="Add element">
            <Plus className="size-4" /> Add
          </Button>
        }
      >
        <div className="max-h-[60vh]" onClick={(e) => (e.target as HTMLElement).closest('button[title^="Add"]') && setAddOpen(false)}>
          <Library compact className="max-h-[60vh]" />
        </div>
      </Popover>
    </div>
  );
}
