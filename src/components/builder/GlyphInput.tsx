/**
 * A text input with a symbol picker: Unicode symbols, box drawing, emoji and
 * the bundled Nerd Font icons, searchable.
 */
import { Search, Smile } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { NERD_GLYPHS, type GlyphCategory } from '../../data/nerd-glyphs';
import { SYMBOL_GROUPS } from '../../data/symbols';
import { Button, Input, Popover, Segmented } from '../ui/primitives';
import { cn } from '../../lib/cn';

const NERD_CATS: { id: GlyphCategory; label: string }[] = [
  { id: 'powerline', label: 'Powerline' },
  { id: 'os', label: 'OS & distros' },
  { id: 'dev', label: 'Languages & tools' },
  { id: 'git', label: 'Git' },
  { id: 'files', label: 'Files' },
  { id: 'status', label: 'Status' },
  { id: 'time', label: 'Time' },
  { id: 'arrows', label: 'Arrows' },
  { id: 'system', label: 'System' },
  { id: 'misc', label: 'Misc' },
];

function GlyphButton({ ch, title, onPick, nerd }: { ch: string; title: string; onPick: (c: string) => void; nerd?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={() => onPick(ch)}
      className={cn(
        'flex size-8 items-center justify-center rounded-lg text-[1rem] text-text transition-colors hover:bg-surface0 hover:text-accent focus-visible:bg-surface0',
        nerd ? 'font-[Bashin_Symbols] text-[1.05rem]' : 'font-mono',
      )}
      style={nerd ? { fontFamily: '"Bashin Symbols", monospace' } : undefined}
    >
      {ch}
    </button>
  );
}

export function GlyphPicker({ onPick }: { onPick: (c: string) => void }) {
  const [tab, setTab] = useState<'symbols' | 'nerd'>('symbols');
  const [q, setQ] = useState('');
  const nerd = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? NERD_GLYPHS.filter((g) => g.label.toLowerCase().includes(s) || g.name.includes(s) || g.keywords?.some((k) => k.includes(s)))
      : NERD_GLYPHS;
    return NERD_CATS.map((c) => ({ ...c, glyphs: list.filter((g) => g.category === c.id) })).filter((c) => c.glyphs.length);
  }, [q]);

  return (
    <div className="flex w-[21rem] flex-col gap-2">
      <div className="flex items-center justify-between">
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'symbols', label: 'Unicode' },
            { value: 'nerd', label: 'Nerd Font' },
          ]}
        />
        {tab === 'nerd' && <span className="text-[0.65rem] text-overlay1">{NERD_GLYPHS.length} icons</span>}
      </div>
      {tab === 'nerd' && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-overlay1" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons — git, python, folder…" className="h-8 pl-8 text-xs" autoFocus />
        </div>
      )}
      <div className="max-h-72 overflow-y-auto pr-1">
        {tab === 'symbols'
          ? SYMBOL_GROUPS.map((g) => (
              <div key={g.id} className="mb-2">
                <div className="eyebrow mb-1">{g.label}</div>
                <div className="flex flex-wrap">
                  {g.chars.map((c) => (
                    <GlyphButton key={c} ch={c} title={`U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`} onPick={onPick} />
                  ))}
                </div>
              </div>
            ))
          : nerd.map((c) => (
              <div key={c.id} className="mb-2">
                <div className="eyebrow mb-1">{c.label}</div>
                <div className="flex flex-wrap">
                  {c.glyphs.map((g) => (
                    <GlyphButton key={g.code} nerd ch={g.char} title={`${g.label} · nf-${g.name}`} onPick={onPick} />
                  ))}
                </div>
              </div>
            ))}
        {tab === 'nerd' && !nerd.length && <p className="py-6 text-center text-xs text-overlay1">No icons match “{q}”.</p>}
      </div>
      {tab === 'nerd' && (
        <p className="text-[0.65rem] leading-snug text-overlay1">
          Needs a <a className="text-accent underline-offset-2 hover:underline" href="https://www.nerdfonts.com/font-downloads" target="_blank" rel="noreferrer">Nerd Font</a> in your terminal.
        </p>
      )}
    </div>
  );
}

export function GlyphInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  mono = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  mono?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const sel = useRef<[number, number] | null>(null);
  const remember = () => {
    const el = ref.current;
    if (el) sel.current = [el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length];
  };
  const insert = (c: string) => {
    const [a, b] = sel.current ?? [value.length, value.length];
    const next = value.slice(0, a) + c + value.slice(b);
    onChange(next);
    sel.current = [a + c.length, a + c.length];
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(a + c.length, a + c.length);
    });
  };
  return (
    <div className="flex gap-1.5">
      <Input
        ref={ref}
        mono={mono}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => {
          onChange(e.target.value);
          remember();
        }}
        onSelect={remember}
        onKeyUp={remember}
        onClick={remember}
        className="term-input"
        style={{ fontFamily: '"JetBrains Mono Variable", "Bashin Symbols", monospace' }}
      />
      <Popover
        align="end"
        trigger={
          <Button size="icon" variant="outline" aria-label="Insert a symbol" title="Insert a symbol">
            <Smile className="size-4" />
          </Button>
        }
      >
        <GlyphPicker onPick={insert} />
      </Popover>
    </div>
  );
}
