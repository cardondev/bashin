/**
 * Right-hand panel: edit the selected element, or the prompt's settings.
 */
import { ChevronDown, Copy, Eye, EyeOff, Settings2, Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { getPalette, PALETTES } from '../../data/palettes';
import type { Palette } from '../../data/palette-types';
import { getDef, optionsWithDefaults, type Field } from '../../lib/elements';
import { ATTRS, type Attr, type ColorRef, type PromptElement, type Style, type Visibility } from '../../lib/model';
import { SEPARATORS } from '../../lib/sgr';
import { usePrompt } from '../../store/prompt';
import { useUI } from '../../store/ui';
import { Icon } from '../ui/Icon';
import { Button, Field as FieldRow, Input, Segmented, Select, Switch, Tip } from '../ui/primitives';
import { cn } from '../../lib/cn';
import { refToHex } from '../../lib/colorref';
import { ColorPicker } from './ColorPicker';
import { GlyphInput } from './GlyphInput';

const ATTR_LABEL: Record<Attr, { short: ReactNode; title: string }> = {
  bold: { short: <b>B</b>, title: 'Bold' },
  dim: { short: <span className="opacity-60">D</span>, title: 'Dim' },
  italic: { short: <i className="font-serif">I</i>, title: 'Italic' },
  underline: { short: <u>U</u>, title: 'Underline' },
  blink: { short: <span className="term-blink">K</span>, title: 'Blink' },
  reverse: { short: <span className="rounded-sm bg-text px-0.5 text-[color:var(--ctp-base)]">R</span>, title: 'Reverse' },
  strike: { short: <s>S</s>, title: 'Strikethrough' },
  overline: { short: <span className="overline">O</span>, title: 'Overline' },
};

function Section({ title, children, defaultOpen = true, aside }: { title: string; children: ReactNode; defaultOpen?: boolean; aside?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-surface0/80 px-4 py-3.5 first:border-t-0">
      <div className="flex items-center justify-between">
        <button type="button" className="flex items-center gap-1.5 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
          <ChevronDown className={cn('size-3.5 text-overlay1 transition-transform', !open && '-rotate-90')} />
          <span className="eyebrow">{title}</span>
        </button>
        {aside}
      </div>
      {open && <div className="mt-3 flex flex-col gap-3">{children}</div>}
    </section>
  );
}

function AttrToggles({ style, onToggle }: { style: Style | undefined; onToggle: (a: Attr, v: boolean) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1">
      {ATTRS.map((a) => (
        <Tip key={a} label={ATTR_LABEL[a].title}>
          <button
            type="button"
            aria-pressed={!!style?.[a]}
            aria-label={ATTR_LABEL[a].title}
            onClick={() => onToggle(a, !style?.[a])}
            className={cn(
              'flex h-8 items-center justify-center rounded-lg font-mono text-sm transition-colors',
              style?.[a] ? 'bg-accent/20 text-accent ring-1 ring-accent/40' : 'bg-base text-overlay2 ring-1 ring-surface1 hover:text-text',
            )}
          >
            {ATTR_LABEL[a].short}
          </button>
        </Tip>
      ))}
    </div>
  );
}

function StyleEditor({ el, which, palette, compact }: { el: PromptElement; which: 'style' | 'rootStyle' | 'errorStyle'; palette: Palette; compact?: boolean }) {
  const setStyle = usePrompt((s) => s.setStyle);
  const st = el[which];
  const bgHex = refToHex(el.style?.bg, palette) ?? undefined;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Text color">
          <ColorPicker
            label="Text color"
            palette={palette}
            value={st?.fg}
            onChange={(v) => setStyle(el.id, which, { fg: v ?? (which === 'style' ? undefined : null) })}
            against={bgHex}
          />
        </FieldRow>
        <FieldRow label="Background">
          <ColorPicker
            label="Background"
            palette={palette}
            value={st?.bg}
            onChange={(v) => setStyle(el.id, which, { bg: v ?? (which === 'style' ? undefined : null) })}
          />
        </FieldRow>
      </div>
      {!compact && <AttrToggles style={st} onToggle={(a, v) => setStyle(el.id, which, { [a]: v })} />}
      {compact && (
        <div className="flex gap-1">
          {(['bold', 'italic', 'blink'] as const).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={!!st?.[a]}
              onClick={() => setStyle(el.id, which, { [a]: !st?.[a] })}
              className={cn(
                'h-7 rounded-lg px-2.5 text-xs transition-colors',
                st?.[a] ? 'bg-accent/20 text-accent ring-1 ring-accent/40' : 'bg-base text-overlay2 ring-1 ring-surface1 hover:text-text',
              )}
            >
              {ATTR_LABEL[a].title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OptionField({ f, el, value, palette }: { f: Field; el: PromptElement; value: unknown; palette: Palette }) {
  const setOption = usePrompt((s) => s.setOption);
  const set = (v: unknown) => setOption(el.id, f.key, v);
  const id = `opt-${el.id}-${f.key}`;
  switch (f.k) {
    case 'toggle':
      return (
        <div className="flex items-start justify-between gap-3">
          <label htmlFor={id} className="flex flex-col gap-0.5 text-sm text-subtext1">
            {f.label}
            {f.help && <span className="text-[0.7rem] leading-snug text-overlay1">{f.help}</span>}
          </label>
          <Switch id={id} checked={value === true} onChange={set} label={f.label} />
        </div>
      );
    case 'select':
      return (
        <FieldRow label={f.label} help={f.help} htmlFor={id}>
          <Select id={id} value={String(value ?? '')} onChange={(e) => set(e.target.value)}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FieldRow>
      );
    case 'number':
      return (
        <FieldRow label={f.unit ? `${f.label} (${f.unit})` : f.label} help={f.help} htmlFor={id}>
          <Input
            id={id}
            type="number"
            min={f.min}
            max={f.max}
            step={f.step ?? 1}
            value={Number(value ?? 0)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) set(Math.max(f.min ?? -Infinity, Math.min(f.max ?? Infinity, n)));
            }}
          />
        </FieldRow>
      );
    case 'color':
      return (
        <FieldRow label={f.label} help={f.help}>
          <ColorPicker label={f.label} palette={palette} value={value as ColorRef | null} onChange={set} />
        </FieldRow>
      );
    case 'glyph':
      return (
        <FieldRow label={f.label} help={f.help}>
          <GlyphInput value={String(value ?? '')} onChange={set} placeholder={f.placeholder} ariaLabel={f.label} />
        </FieldRow>
      );
    default:
      return (
        <FieldRow label={f.label} help={f.help} htmlFor={id}>
          <Input id={id} mono={f.mono} value={String(value ?? '')} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />
        </FieldRow>
      );
  }
}

const VIS: { value: Visibility; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'error', label: 'Only after a failed command' },
  { value: 'success', label: 'Only after a successful command' },
  { value: 'root', label: 'Only as root' },
  { value: 'user', label: 'Only as a regular user' },
  { value: 'ssh', label: 'Only over SSH' },
  { value: 'local', label: 'Only on the local machine' },
];

function ElementInspector({ el }: { el: PromptElement }) {
  const doc = usePrompt((s) => s.doc);
  const { update, remove, duplicate } = usePrompt.getState();
  const select = useUI((s) => s.select);
  const palette = getPalette(doc.settings.palette);
  const def = getDef(el.type);
  const o = optionsWithDefaults(el);
  const structural = def.structural === 'newline' || def.structural === 'group-end';

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Icon name={def.icon} className="size-[1.125rem]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold tracking-tight">{def.name}</h3>
            {el.disabled && <span className="rounded bg-surface0 px-1.5 text-[0.65rem] text-overlay1">hidden</span>}
          </div>
          <p className="mt-0.5 text-xs leading-snug text-subtext0">{def.description}</p>
        </div>
        <Button size="icon-sm" variant="ghost" aria-label="Close" onClick={() => select(null)}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex gap-1 px-4 pb-3">
        <Button size="sm" variant="outline" onClick={() => update(el.id, { disabled: !el.disabled })}>
          {el.disabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          {el.disabled ? 'Show' : 'Hide'}
        </Button>
        {el.type !== 'group-end' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const id = duplicate(el.id);
              if (id) select(id);
            }}
          >
            <Copy className="size-3.5" /> Duplicate
          </Button>
        )}
        <Button
          size="sm"
          variant="danger"
          className="ml-auto"
          onClick={() => {
            remove(el.id);
            select(null);
          }}
        >
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>

      {def.fields.length > 0 && (
        <Section title="Content">
          {def.fields
            .filter((f) => !f.when || f.when(o))
            .map((f) => (
              <OptionField key={f.key} f={f} el={el} value={o[f.key]} palette={palette} />
            ))}
        </Section>
      )}

      {!structural && !def.invisible && (
        <>
          <Section title="Style">
            <StyleEditor el={el} which="style" palette={palette} />
            {el.style?.bg && doc.settings.separator !== 'none' && (
              <p className="text-[0.7rem] leading-snug text-overlay1">
                With a background this element becomes a <b className="text-subtext0">{SEPARATORS[doc.settings.separator as keyof typeof SEPARATORS]?.label ?? 'powerline'}</b> segment.
              </p>
            )}
          </Section>
          {def.structural !== 'fill' && (
            <Section title="Prefix & suffix" defaultOpen={!!(el.prefix || el.suffix)}>
              <div className="grid grid-cols-1 gap-3">
                <FieldRow label="Before">
                  <GlyphInput value={el.prefix ?? ''} onChange={(v) => update(el.id, { prefix: v || undefined })} placeholder="nothing" ariaLabel="Prefix" />
                </FieldRow>
                <FieldRow label="After">
                  <GlyphInput value={el.suffix ?? ''} onChange={(v) => update(el.id, { suffix: v || undefined })} placeholder="nothing" ariaLabel="Suffix" />
                </FieldRow>
                <p className="text-[0.7rem] leading-snug text-overlay1">Shown and hidden together with the element — the place for spaces around optional parts.</p>
              </div>
            </Section>
          )}
          {def.structural !== 'fill' && (
            <Section title="Visibility" defaultOpen={!!el.show && el.show !== 'always'}>
              <Select value={el.show ?? 'always'} onChange={(e) => update(el.id, { show: e.target.value as Visibility })} aria-label="Show">
                {VIS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Section>
          )}
          <Section title="As root" defaultOpen={!!el.rootStyle} aside={el.rootStyle ? <ResetLink onClick={() => usePrompt.getState().setStyle(el.id, 'rootStyle', null)} /> : undefined}>
            <StyleEditor el={el} which="rootStyle" palette={palette} compact />
          </Section>
          <Section title="After an error" defaultOpen={!!el.errorStyle} aside={el.errorStyle ? <ResetLink onClick={() => usePrompt.getState().setStyle(el.id, 'errorStyle', null)} /> : undefined}>
            <StyleEditor el={el} which="errorStyle" palette={palette} compact />
          </Section>
        </>
      )}
      {structural && (
        <p className="px-4 pb-4 text-sm text-subtext0">
          {el.type === 'newline' ? 'Everything after this starts on a new line.' : 'The group closes here. Drag it to change which elements are inside.'}
        </p>
      )}
    </div>
  );
}

function ResetLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[0.7rem] text-overlay1 hover:text-red">
      clear
    </button>
  );
}

function SeparatorSample({ id, palette }: { id: string; palette: Palette }) {
  const a = palette.tokens.mauve;
  const b = palette.tokens.blue;
  const bg = palette.terminal.background;
  const shapes: Record<string, [string, string, string]> = {
    // [start, sep, end] as SVG path data inside a 30×20 box per glyph slot
    none: ['', '', ''],
    powerline: ['', 'M0,0 L10,10 L0,20 Z', 'M0,0 L10,10 L0,20 Z'],
    capsule: ['M10,0 C4.4,0 0,4.5 0,10 C0,15.5 4.4,20 10,20 Z', 'M0,0 L10,10 L0,20 Z', 'M0,0 C5.6,0 10,4.5 10,10 C10,15.5 5.6,20 0,20 Z'],
    round: ['M10,0 C4.4,0 0,4.5 0,10 C0,15.5 4.4,20 10,20 Z', 'M0,0 C5.6,0 10,4.5 10,10 C10,15.5 5.6,20 0,20 Z', 'M0,0 C5.6,0 10,4.5 10,10 C10,15.5 5.6,20 0,20 Z'],
    slant: ['M10,0 L10,20 L0,20 Z', 'M0,0 L10,0 L0,20 Z', 'M0,0 L10,0 L0,20 Z'],
    backslant: ['M0,0 L10,0 L10,20 Z', 'M0,0 L0,20 L10,20 Z', 'M0,0 L0,20 L10,20 Z'],
    flame: ['M10,0 C3,3 7,7 2,10 C7,13 3,17 10,20 Z', 'M0,0 C7,3 3,7 8,10 C3,13 7,17 0,20 Z', 'M0,0 C7,3 3,7 8,10 C3,13 7,17 0,20 Z'],
    pixel: ['M10,0 L6,0 L6,5 L3,5 L3,10 L6,10 L6,15 L3,15 L3,20 L10,20 Z', 'M0,0 L4,0 L4,5 L7,5 L7,10 L4,10 L4,15 L7,15 L7,20 L0,20 Z', 'M0,0 L4,0 L4,5 L7,5 L7,10 L4,10 L4,15 L7,15 L7,20 L0,20 Z'],
    ice: ['M10,0 L5,3 L8,7 L4,10 L8,13 L5,17 L10,20 Z', 'M0,0 L5,3 L2,7 L6,10 L2,13 L5,17 L0,20 Z', 'M0,0 L5,3 L2,7 L6,10 L2,13 L5,17 L0,20 Z'],
    blocks: ['', '', ''],
  };
  const [s, m, e] = shapes[id] ?? shapes.none;
  if (id === 'blocks')
    return (
      <span className="font-mono text-[0.7rem] leading-none" style={{ color: a }}>
        ░▒▓<span style={{ backgroundColor: a, color: bg }}>&nbsp;a&nbsp;</span>
        <span style={{ backgroundColor: b, color: a }}>▓▒░</span>
        <span style={{ backgroundColor: b, color: bg }}>&nbsp;b&nbsp;</span>
        <span style={{ color: b }}>▓▒░</span>
      </span>
    );
  return (
    <svg viewBox="0 0 70 20" className="h-4 w-14" aria-hidden>
      {s && <path d={s} transform="translate(0,0)" fill={a} />}
      <rect x={s ? 10 : 0} y="0" width={s ? 20 : 30} height="20" fill={a} />
      {id === 'none' ? (
        <rect x="34" y="0" width="22" height="20" fill={b} />
      ) : (
        <>
          <rect x="30" y="0" width="30" height="20" fill={b} />
          {m && <path d={m} transform="translate(30,0)" fill={a} />}
          {e && <path d={e} transform="translate(60,0)" fill={b} />}
        </>
      )}
    </svg>
  );
}

function PromptSettings() {
  const doc = usePrompt((s) => s.doc);
  const { setSettings, setName } = usePrompt.getState();
  const st = doc.settings;
  const palette = getPalette(st.palette);
  const families = [...new Set(PALETTES.map((p) => p.family))];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Settings2 className="size-[1.125rem]" />
        </div>
        <div>
          <h3 className="font-semibold tracking-tight">Prompt settings</h3>
          <p className="text-xs text-subtext0">Select an element to edit it.</p>
        </div>
      </div>
      <Section title="Name">
        <Input value={doc.name} onChange={(e) => setName(e.target.value)} aria-label="Prompt name" />
      </Section>
      <Section title="Palette">
        <div className="flex flex-col gap-3">
          {families.map((fam) => (
            <div key={fam} className="flex flex-col gap-1.5">
              <div className="text-[0.7rem] font-medium text-overlay1">{fam}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {PALETTES.filter((p) => p.family === fam).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSettings({ palette: p.id })}
                    aria-pressed={p.id === st.palette}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left text-xs transition-colors',
                      p.id === st.palette ? 'border-accent bg-accent/10 text-text' : 'border-surface0 hover:border-surface2',
                    )}
                  >
                    <span className="flex h-5 w-10 shrink-0 overflow-hidden rounded-md ring-1 ring-black/20" style={{ backgroundColor: p.terminal.background }}>
                      {(['red', 'yellow', 'green', 'blue', 'mauve'] as const).map((t) => (
                        <span key={t} className="mt-auto h-2 flex-1" style={{ backgroundColor: p.tokens[t] }} />
                      ))}
                    </span>
                    <span className="truncate">{p.name.replace(`${fam} `, '') || p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Segments">
        <FieldRow label="Joining elements that have a background">
          <div className="grid grid-cols-2 gap-1.5">
            {(['none', ...Object.keys(SEPARATORS)] as (keyof typeof SEPARATORS | 'none')[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSettings({ separator: id })}
                aria-pressed={st.separator === id}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs transition-colors',
                  st.separator === id ? 'border-accent bg-accent/10' : 'border-surface0 hover:border-surface2',
                )}
              >
                <span>{id === 'none' ? 'Plain' : SEPARATORS[id].label}</span>
                <SeparatorSample id={id} palette={palette} />
              </button>
            ))}
          </div>
        </FieldRow>
        <FieldRow label="Padding inside segments">
          <Segmented
            size="sm"
            value={String(st.padding)}
            onChange={(v) => setSettings({ padding: Number(v) })}
            options={['0', '1', '2'].map((v) => ({ value: v, label: v === '0' ? 'None' : `${v} space${v === '1' ? '' : 's'}` }))}
          />
        </FieldRow>
      </Section>
      <Section title="Output">
        <FieldRow
          label="Color depth"
          help={
            st.depth === 'auto'
              ? 'Ships all three tables and picks one at startup from $COLORTERM / $TERM.'
              : st.depth === '16'
                ? 'Maps colors onto the terminal’s own 16 — works everywhere, follows its theme.'
                : st.depth === '256'
                  ? 'Nearest xterm-256 colors, for terminals without 24-bit support (macOS Terminal before Tahoe, older tmux).'
                  : 'Exact colors. Supported by nearly every modern terminal.'
          }
        >
          <Segmented
            size="sm"
            value={st.depth}
            onChange={(v) => setSettings({ depth: v })}
            options={[
              { value: 'truecolor', label: '24-bit' },
              { value: '256', label: '256' },
              { value: '16', label: '16' },
              { value: 'auto', label: 'Auto' },
            ]}
          />
        </FieldRow>
        <div className="flex items-start justify-between gap-3">
          <label className="flex flex-col gap-0.5 text-sm text-subtext1" htmlFor="nl-before">
            Blank line before each prompt
            <span className="text-[0.7rem] text-overlay1">Separates commands visually (skipped for the first prompt).</span>
          </label>
          <Switch id="nl-before" checked={st.newlineBefore} onChange={(v) => setSettings({ newlineBefore: v })} />
        </div>
        <FieldRow label="Continuation prompt (PS2)" help="Shown on the lines of a multi-line command.">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <GlyphInput value={st.ps2} onChange={(v) => setSettings({ ps2: v })} ariaLabel="PS2" />
            <div className="w-28">
              <ColorPicker label="PS2 color" palette={palette} value={st.ps2Color} onChange={(v) => setSettings({ ps2Color: v })} />
            </div>
          </div>
        </FieldRow>
      </Section>
    </div>
  );
}

export function Inspector() {
  const selectedId = useUI((s) => s.selectedId);
  const el = usePrompt((s) => s.doc.elements.find((e) => e.id === selectedId));
  return <div className="flex flex-col">{el ? <ElementInspector key={el.id} el={el} /> : <PromptSettings />}</div>;
}
