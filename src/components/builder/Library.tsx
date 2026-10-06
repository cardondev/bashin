/**
 * The element library: every building block, searchable, click or drag to add.
 */
import { useDraggable } from '@dnd-kit/core';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATEGORIES, ELEMENT_LIST, type ElementDef } from '../../lib/elements';
import { addElement } from '../../store/actions';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/primitives';
import { cn } from '../../lib/cn';

function Item({ def, compact }: { def: ElementDef; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib:${def.type}`,
    data: { from: 'library', type: def.type },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => addElement(def.type)}
      className={cn(
        'group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface0/70 focus-visible:bg-surface0/70',
        isDragging && 'opacity-40',
      )}
      title={`Add ${def.name}`}
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface0 text-subtext1 transition-colors group-hover:bg-accent/15 group-hover:text-accent">
        <Icon name={def.icon} className="size-[0.95rem]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium leading-tight text-text">{def.name}</span>
        {!compact && <span className="mt-0.5 line-clamp-2 block text-[0.7rem] leading-snug text-overlay1">{def.description}</span>}
      </span>
    </button>
  );
}

export function Library({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const defs = ELEMENT_LIST.filter((d) => !d.hidden).filter(
      (d) =>
        !s ||
        d.name.toLowerCase().includes(s) ||
        d.description.toLowerCase().includes(s) ||
        d.type.includes(s) ||
        d.keywords?.some((k) => k.toLowerCase().includes(s)),
    );
    return CATEGORIES.map((c) => ({ ...c, defs: defs.filter((d) => d.category === c.id) })).filter((g) => g.defs.length);
  }, [q]);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="relative px-3 pb-2 pt-3">
        <Search className="pointer-events-none absolute left-5.5 top-1/2 mt-0.5 size-3.5 -translate-y-1/2 text-overlay1" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search elements…" className="h-8 pl-8 text-[0.8125rem]" aria-label="Search elements" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-3">
        {groups.map((g) => (
          <div key={g.id} className="mb-1">
            <div className="eyebrow px-2.5 pb-1 pt-2.5">{g.label}</div>
            {g.defs.map((d) => (
              <Item key={d.type} def={d} compact={compact} />
            ))}
          </div>
        ))}
        {!groups.length && <p className="px-3 py-8 text-center text-xs text-overlay1">Nothing matches “{q}”.</p>}
      </div>
    </div>
  );
}
