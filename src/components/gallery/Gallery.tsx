/**
 * Every preset rendered live, plus the prompts saved in this browser.
 */
import { BookmarkPlus, Search, Trash2, Wand2 } from 'lucide-react';
import { memo, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFitFont } from '../../hooks';
import { toast } from 'sonner';
import { getPalette } from '../../data/palettes';
import { PRESETS, type Preset, type PresetTag } from '../../data/presets';
import { compile } from '../../lib/compile';
import type { PromptDoc } from '../../lib/model';
import { renderSession } from '../../lib/render';
import { DEFAULT_SCENARIO, type Scenario } from '../../lib/scenario';
import { useLibrary } from '../../store/library';
import { loadDoc } from '../../store/actions';
import { usePrompt } from '../../store/prompt';
import { TerminalView } from '../terminal/TerminalView';
import { Badge, Button, Input } from '../ui/primitives';
import { cn } from '../../lib/cn';

const TAGS: { id: PresetTag | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'novashell', label: 'NovaShell' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'multi-line', label: 'Multi-line' },
  { id: 'powerline', label: 'Powerline' },
  { id: 'right-prompt', label: 'Right prompt' },
  { id: 'git', label: 'Git' },
  { id: 'retro', label: 'Retro' },
  { id: 'distro', label: 'Distro defaults' },
  { id: 'colorful', label: 'Colorful' },
  { id: 'nerd-font', label: 'Nerd Font' },
];

const MIN_COLS = 56;
const MAX_COLS = 128;

const Card = memo(function Card({ name, description, origin, tags, doc, scenario, onUse, extra }: {
  name: string;
  description: string;
  origin: string;
  tags: string[];
  doc: PromptDoc;
  scenario?: Partial<Scenario>;
  onUse: () => void;
  extra?: ReactNode;
}) {
  const palette = getPalette(doc.settings.palette);
  const box = useRef<HTMLButtonElement>(null);
  const { session, cols } = useMemo(() => {
    const prog = compile(doc);
    const depth = doc.settings.depth === 'auto' ? 'truecolor' : doc.settings.depth;
    const scn: Scenario = { ...DEFAULT_SCENARIO, ...scenario };
    // Measure the prompt's natural width (fills excluded), then render it at that width.
    const fills = new Set(doc.elements.filter((e) => e.type === 'fill').map((e) => e.id));
    const probe = renderSession(prog, { palette, depth, history: [], current: { ...scn, cols: 220 }, tags: true });
    let widest = 0;
    for (const row of probe.term.rows) {
      let w = 0;
      // count what the prompt drew: its elements' cells and separator caps, not fills or padding
      for (const cell of row) if (cell.w && (cell.tag ? !fills.has(cell.tag) : cell.ch !== ' ')) w += cell.w;
      widest = Math.max(widest, w);
    }
    const cols = Math.max(MIN_COLS, Math.min(MAX_COLS, widest + (fills.size ? 10 : 3)));
    return { cols, session: renderSession(prog, { palette, depth, history: [], current: { ...scn, cols } }) };
  }, [doc, scenario, palette]);
  const fontSize = useFitFont(box, cols);
  return (
    <article className="group panel flex flex-col overflow-hidden transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-surface2">
      <button ref={box} type="button" onClick={onUse} className="block w-full text-left" aria-label={`Use ${name}`} style={{ backgroundColor: palette.terminal.background }}>
        <TerminalView term={session.term} palette={palette} fontSize={fontSize} chrome={false} minRows={3} bodyClassName="px-3.5 py-3" className="pointer-events-none" />
      </button>
      <div className="flex flex-1 flex-col gap-2 border-t border-surface0/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight">{name}</h3>
            <p className="text-[0.7rem] text-overlay1">{origin}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {extra}
            <Button size="sm" variant="primary" onClick={onUse}>
              <Wand2 className="size-3.5" /> Use
            </Button>
          </div>
        </div>
        <p className="text-[0.8125rem] leading-snug text-subtext0">{description}</p>
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          <Badge>{palette.name}</Badge>
          {tags.map((t) => (
            <Badge key={t} tone="accent">
              {t}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
});

export function Gallery() {
  const [tag, setTag] = useState<PresetTag | 'all'>('all');
  const [q, setQ] = useState('');
  const saved = useLibrary((s) => s.saved);
  const { remove, save } = useLibrary.getState();
  const doc = usePrompt((s) => s.doc);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PRESETS.filter((p) => (tag === 'all' || p.tags.includes(tag)) && (!s || `${p.name} ${p.description} ${p.origin} ${p.tags.join(' ')}`.toLowerCase().includes(s)));
  }, [tag, q]);

  return (
    <div className="mx-auto w-full max-w-[1760px] px-4 pb-16 pt-8 xl:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
          <p className="mt-1.5 max-w-2xl text-subtext0">
            Every card is the real prompt, rendered live. The NovaShell set recreates the twelve prompts that ship with NovaShell; the rest
            are inspired by popular themes and distro defaults. Pick one, then make it yours.
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-overlay1" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search presets…" className="pl-9" aria-label="Search presets" />
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by tag">
        {TAGS.map((t) => {
          const count = t.id === 'all' ? PRESETS.length : PRESETS.filter((p) => p.tags.includes(t.id as PresetTag)).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tag === t.id}
              onClick={() => setTag(t.id)}
              className={cn(
                'h-8 rounded-full px-3.5 text-[0.8125rem] font-medium transition-colors',
                tag === t.id ? 'bg-accent text-crust' : 'bg-surface0/70 text-subtext0 hover:bg-surface0 hover:text-text',
              )}
            >
              {t.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {(saved.length > 0 || tag === 'all') && !q && (
        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Saved in this browser</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                save(doc);
                toast.success(`Saved “${doc.name}”`);
              }}
            >
              <BookmarkPlus className="size-3.5" /> Save current prompt
            </Button>
          </div>
          {saved.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {saved.map((s) => (
                <Card
                  key={s.id}
                  name={s.name}
                  description={`Saved ${new Date(s.savedAt).toLocaleString()}`}
                  origin="Your prompt"
                  tags={[]}
                  doc={s.doc}
                  onUse={() => loadDoc(s.doc, s.name)}
                  extra={
                    <Button size="icon-sm" variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => remove(s.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-surface1 px-4 py-6 text-center text-sm text-overlay1">
              Prompts you save appear here. They stay in this browser — use Share links to move them around.
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {list.map((p: Preset) => (
          <Card key={p.id} name={p.name} description={p.description} origin={p.origin} tags={p.tags} doc={p.doc} scenario={p.scenario} onUse={() => loadDoc(p.doc, p.name)} />
        ))}
      </div>
      {!list.length && <p className="py-16 text-center text-overlay1">No presets match.</p>}
    </div>
  );
}
