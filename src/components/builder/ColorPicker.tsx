/**
 * Pick a color as a palette token (re-themes with the palette), a terminal
 * ANSI color (follows the user's terminal theme), an xterm-256 index, or hex.
 */
import { Ban, Pipette } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ANSI_NAMES } from '../../data/palettes';
import type { Palette } from '../../data/palette-types';
import { ACCENT_TOKENS, NEUTRAL_TOKENS } from '../../data/palette-types';
import { contrastRatio, hexToRgb, isHex, rgbToHex, XTERM_256 } from '../../lib/color';
import { refLabel, refToHex } from '../../lib/colorref';
import type { ColorRef } from '../../lib/model';
import { Button, Input, Popover, Segmented } from '../ui/primitives';
import { cn } from '../../lib/cn';

type Tab = 'palette' | 'ansi' | '256' | 'hex';

function Swatch({ hex, active, title, onClick, size = 'md' }: { hex: string; active?: boolean; title: string; onClick: () => void; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-md ring-1 ring-inset ring-black/20 transition-transform hover:scale-110 focus-visible:scale-110',
        size === 'sm' ? 'size-4 rounded-[3px]' : 'size-7',
        active && 'outline-2 outline-offset-2 outline-accent',
      )}
      style={{ backgroundColor: hex }}
    />
  );
}

export function ColorPicker({
  value,
  onChange,
  palette,
  label,
  allowNone = true,
  against,
}: {
  value: ColorRef | null | undefined;
  onChange: (v: ColorRef | null) => void;
  palette: Palette;
  label: string;
  allowNone?: boolean;
  /** Background to check contrast against. */
  against?: string;
}) {
  const [tab, setTab] = useState<Tab>(value?.t === 'ansi' ? 'ansi' : value?.t === 'x256' ? '256' : value?.t === 'hex' ? 'hex' : 'palette');
  const hex = refToHex(value, palette);
  const [draft, setDraft] = useState(hex ?? '#cba6f7');
  const bg = against ?? palette.terminal.background;
  const ratio = hex ? contrastRatio(hexToRgb(hex), hexToRgb(bg)) : null;

  const trigger = (
    <button
      type="button"
      className="group flex h-9 w-full min-w-0 items-center gap-2 rounded-xl border border-surface1 bg-base px-2 text-left text-sm transition-colors hover:border-surface2"
      aria-label={`${label}: ${refLabel(value)}`}
    >
      <span
        className="size-5 shrink-0 rounded-md ring-1 ring-inset ring-black/25"
        style={hex ? { backgroundColor: hex } : { background: 'repeating-linear-gradient(45deg, var(--ctp-surface1) 0 3px, transparent 3px 6px)' }}
      />
      <span className="truncate text-subtext1 group-hover:text-text">{refLabel(value)}</span>
      {ratio !== null && ratio < 3 && (
        <span className="ml-auto shrink-0 rounded bg-yellow/15 px-1 text-[0.625rem] font-semibold text-yellow" title={`Contrast ${ratio.toFixed(1)}:1 against the background`}>
          low
        </span>
      )}
    </button>
  );

  const section = (title: string, children: ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <div className="eyebrow">{title}</div>
      {children}
    </div>
  );

  const content = (() => {
    if (tab === 'palette')
      return (
        <div className="flex flex-col gap-3">
          {section(
            'Accents',
            <div className="grid grid-cols-7 gap-1.5">
              {ACCENT_TOKENS.map((t) => (
                <Swatch key={t} hex={palette.tokens[t]} title={t} active={value?.t === 'token' && value.v === t} onClick={() => onChange({ t: 'token', v: t })} />
              ))}
            </div>,
          )}
          {section(
            'Neutrals',
            <div className="grid grid-cols-6 gap-1.5">
              {NEUTRAL_TOKENS.map((t) => (
                <Swatch key={t} hex={palette.tokens[t]} title={t} active={value?.t === 'token' && value.v === t} onClick={() => onChange({ t: 'token', v: t })} />
              ))}
            </div>,
          )}
          <p className="text-[0.7rem] leading-snug text-overlay1">Palette colors follow the palette you pick in Prompt settings.</p>
        </div>
      );
    if (tab === 'ansi')
      return (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-8 gap-1.5">
            {palette.terminal.ansi.map((h, i) => (
              <Swatch key={i} hex={h} title={`${i} · ${ANSI_NAMES[i]}`} active={value?.t === 'ansi' && value.v === i} onClick={() => onChange({ t: 'ansi', v: i })} />
            ))}
          </div>
          <p className="text-[0.7rem] leading-snug text-overlay1">
            ANSI colors are drawn by your terminal’s own theme — the most portable choice, and what distro prompts use.
          </p>
        </div>
      );
    if (tab === '256')
      return (
        <div className="flex flex-col gap-2">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
            {XTERM_256.slice(16).map((c, k) => {
              const i = k + 16;
              return <Swatch key={i} size="sm" hex={rgbToHex(c)} title={`color ${i}`} active={value?.t === 'x256' && value.v === i} onClick={() => onChange({ t: 'x256', v: i })} />;
            })}
          </div>
        </div>
      );
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-surface1" style={{ backgroundColor: isHex(draft) ? draft : '#000' }}>
            <input
              type="color"
              value={isHex(draft) ? draft : '#000000'}
              onChange={(e) => {
                setDraft(e.target.value);
                onChange({ t: 'hex', v: e.target.value.toLowerCase() });
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Pick a color"
            />
            <Pipette className="absolute inset-0 m-auto size-4 text-white mix-blend-difference" />
          </label>
          <Input
            mono
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              const v = e.target.value.trim();
              if (isHex(v.startsWith('#') ? v : `#${v}`)) onChange({ t: 'hex', v: (v.startsWith('#') ? v : `#${v}`).toLowerCase() });
            }}
            placeholder="#cba6f7"
          />
        </div>
        <p className="text-[0.7rem] leading-snug text-overlay1">Exact 24-bit color. Downsampled for 256/16-color output.</p>
      </div>
    );
  })();

  return (
    <Popover trigger={trigger} className="w-[19rem]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Segmented
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'palette', label: 'Palette' },
              { value: 'ansi', label: 'ANSI' },
              { value: '256', label: '256' },
              { value: 'hex', label: 'Hex' },
            ]}
          />
          {allowNone && (
            <Button size="icon-sm" variant="ghost" onClick={() => onChange(null)} title="Default color" aria-label="Default color">
              <Ban className="size-3.5" />
            </Button>
          )}
        </div>
        {content}
        {ratio !== null && (
          <div className="flex items-center justify-between rounded-lg bg-crust/60 px-2.5 py-1.5 text-[0.7rem] text-subtext0">
            <span className="flex items-center gap-2">
              <span className="rounded px-1.5 font-mono text-[0.7rem]" style={{ backgroundColor: bg, color: hex ?? undefined }}>
                Aa
              </span>
              contrast on the background
            </span>
            <span className={cn('font-mono font-semibold', ratio >= 4.5 ? 'text-green' : ratio >= 3 ? 'text-yellow' : 'text-red')}>{ratio.toFixed(1)}:1</span>
          </div>
        )}
      </div>
    </Popover>
  );
}
