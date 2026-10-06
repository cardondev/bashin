/**
 * The builder: library · (preview, composer, code) · inspector.
 */
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Blocks, Import, Redo2, Undo2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { getPalette } from '../../data/palettes';
import { useCompiled, useDemo, useFitCols, useMediaQuery, useNow, useSession } from '../../hooks';
import { cellColorHex } from '../../lib/colorref';
import { getDef } from '../../lib/elements';
import type { ElementType } from '../../lib/model';
import { redo, undo, usePrompt } from '../../store/prompt';
import { useUI } from '../../store/ui';
import { OutputPanel } from '../output/OutputPanel';
import { PreviewPanel } from '../preview/PreviewPanel';
import { Icon } from '../ui/Icon';
import { Button, Tip } from '../ui/primitives';
import { Composer, type DropTarget, type Sample } from './Composer';
import { Inspector } from './Inspector';
import { Library } from './Library';

const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length) {
    // Prefer a chip over the composer container behind it.
    const chip = hits.find((h) => h.id !== 'composer:end');
    return chip ? [chip] : hits;
  }
  return rectIntersection(args);
};

export function Builder() {
  const doc = usePrompt((s) => s.doc);
  const ui = useUI(
    useShallow((s) => ({
      fontSize: s.fontSize,
      scenario: s.scenario,
      liveClock: s.liveClock,
      demo: s.demo,
      showHistory: s.showHistory,
      shell: s.shell,
    })),
  );
  const prog = useCompiled(doc);
  const palette = getPalette(doc.settings.palette);
  const previewRef = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery('(min-width: 1024px)');
  const phone = !useMediaQuery('(min-width: 640px)');
  const fontSize = phone ? Math.min(ui.fontSize, 11) : ui.fontSize;
  const fit = useFitCols(previewRef, fontSize, 34);
  const cols = fit ?? ui.scenario.cols;
  const usesTime = useMemo(() => [...prog.types].some((t) => t === 'time' || t === 'date'), [prog]);
  const now = useNow(ui.liveClock && usesTime);
  const demo = useDemo(ui.demo, ui.scenario);
  const depth = doc.settings.depth === 'auto' ? 'truecolor' : doc.settings.depth;
  const session = useSession({
    prog,
    doc,
    scenario: ui.scenario,
    cols,
    depth,
    showHistory: ui.showHistory,
    demo,
    now: ui.liveClock && usesTime ? now : null,
  });
  const canUndo = useStore(usePrompt.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(usePrompt.temporal, (s) => s.futureStates.length > 0);

  // What each element drew in the live prompt, color by color — shown on its chip.
  const samples = useMemo(() => {
    const out = new Map<string, Sample>();
    const rows = session.term.rows.slice(session.promptRow);
    for (const row of rows)
      for (const cell of row) {
        if (!cell.tag || cell.w === 0) continue;
        const fg = cellColorHex(cell.st.reverse ? cell.st.bg : cell.st.fg, palette);
        const bg = cellColorHex(cell.st.reverse ? cell.st.fg : cell.st.bg, palette);
        const cur = out.get(cell.tag) ?? { text: '', runs: [] };
        out.set(cell.tag, cur);
        cur.text += cell.ch;
        const last = cur.runs[cur.runs.length - 1];
        if (last && last.fg === fg && last.bg === bg) last.text += cell.ch;
        else cur.runs.push({ text: cell.ch, fg, bg });
      }
    return out;
  }, [session, palette]);

  // ── drag and drop ─────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const [active, setActive] = useState<{ id: string; type: ElementType } | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);

  const onStart = (e: DragStartEvent) => {
    const d = e.active.data.current as { from: string; type?: ElementType };
    const type = d.from === 'library' ? d.type! : doc.elements.find((x) => x.id === e.active.id)?.type ?? 'text';
    setActive({ id: String(e.active.id), type });
  };
  // Where a drop would land: before/after the chip under the pointer, or at the end.
  const targetOf = (e: DragMoveEvent | DragEndEvent): DropTarget | null => {
    const over = e.over;
    if (!over) return null;
    if (over.id === 'composer:end') return { id: 'composer:end', side: 'after' };
    if (over.id === e.active.id) return null;
    // the pointer, not the dragged item's center, decides the side
    const a = e.activatorEvent as MouseEvent | TouchEvent | null;
    const p0 = a && 'touches' in a ? a.touches[0] : (a as MouseEvent | null);
    if (!p0) return null;
    const px = p0.clientX + e.delta.x;
    const py = p0.clientY + e.delta.y;
    const isRow = usePrompt.getState().doc.elements.find((x) => x.id === over.id)?.type === 'newline';
    const side = isRow
      ? py > over.rect.top + over.rect.height / 2
        ? 'after'
        : 'before'
      : px > over.rect.left + over.rect.width / 2
        ? 'after'
        : 'before';
    return { id: String(over.id), side };
  };
  const onMove = (e: DragMoveEvent) => setDrop(targetOf(e));
  const onEnd = (e: DragEndEvent) => {
    const target = targetOf(e);
    setActive(null);
    setDrop(null);
    if (!target) return;
    const els = usePrompt.getState().doc.elements;
    let to = target.id === 'composer:end' ? els.length : els.findIndex((x) => x.id === target.id) + (target.side === 'after' ? 1 : 0);
    const d = e.active.data.current as { from: string; type?: ElementType };
    if (d.from === 'library') {
      const id = usePrompt.getState().insert(d.type!, to);
      if (d.type !== 'newline') useUI.getState().select(id);
      return;
    }
    const from = els.findIndex((x) => x.id === e.active.id);
    if (from < 0) return;
    if (from < to) to -= 1;
    if (from !== to) usePrompt.getState().move(from, to);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onStart} onDragMove={onMove} onDragEnd={onEnd} onDragCancel={() => (setActive(null), setDrop(null))}>
      <div className="mx-auto grid w-full max-w-[1760px] grid-cols-1 gap-4 px-4 pb-10 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[16.5rem_minmax(0,1fr)_21rem] xl:px-6">
        <aside className="panel hidden max-h-[calc(100dvh-6.5rem)] min-h-0 flex-col self-start overflow-hidden xl:sticky xl:top-[5.25rem] xl:flex" aria-label="Element library">
          <div className="flex items-center gap-2 border-b border-surface0/80 px-4 py-3">
            <Blocks className="size-4 text-accent" />
            <h2 className="text-sm font-semibold tracking-tight">Elements</h2>
            <span className="ml-auto text-[0.6875rem] text-overlay1">click or drag</span>
          </div>
          <Library className="min-h-0 flex-1" />
        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          <PreviewPanel ref={previewRef} session={session} palette={palette} cols={cols} shell={ui.shell} fontSize={fontSize} />

          <section className="panel p-3 sm:p-4" aria-label="Prompt composer">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight">Layout</h2>
              <span className="hidden text-xs text-overlay1 sm:inline">Drag to reorder · click to edit · ⌥←/→ moves · ⌫ deletes</span>
              <div className="ml-auto flex items-center gap-1">
                <Tip label="Import an existing PS1 or PROMPT">
                  <Button size="sm" variant="ghost" onClick={() => useUI.getState().set('importOpen', true)}>
                    <Import className="size-3.5" /> Import
                  </Button>
                </Tip>
                <Tip label="Undo" kbd="⌘Z">
                  <Button size="icon-sm" variant="ghost" disabled={!canUndo} onClick={undo} aria-label="Undo">
                    <Undo2 className="size-3.5" />
                  </Button>
                </Tip>
                <Tip label="Redo" kbd="⇧⌘Z">
                  <Button size="icon-sm" variant="ghost" disabled={!canRedo} onClick={redo} aria-label="Redo">
                    <Redo2 className="size-3.5" />
                  </Button>
                </Tip>
              </div>
            </div>
            <Composer samples={samples} palette={palette} drop={drop} />
          </section>

          {!wide && (
            <section className="panel overflow-hidden" aria-label="Inspector">
              <Inspector />
            </section>
          )}

          <OutputPanel prog={prog} />
        </main>

        {wide && (
          <aside className="panel sticky top-[5.25rem] max-h-[calc(100dvh-6.5rem)] self-start overflow-y-auto" aria-label="Inspector">
            <Inspector />
          </aside>
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {active && (
          <div className="flex h-12 items-center gap-2 rounded-xl border border-accent bg-mantle px-3 text-sm shadow-2xl shadow-black/40">
            <Icon name={getDef(active.type).icon} className="size-4 text-accent" />
            {getDef(active.type).name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
