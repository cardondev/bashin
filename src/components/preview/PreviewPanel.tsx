/**
 * The live terminal preview: the prompt rendered in a scenario, with the
 * command that led there, or an animated demo session.
 */
import { Clock3, History, Minus, Pause, Play, Plus } from 'lucide-react';
import { forwardRef } from 'react';
import type { Palette } from '../../data/palette-types';
import type { Session } from '../../lib/render';
import { effectiveScenario } from '../../lib/scenario';
import { useUI } from '../../store/ui';
import { TerminalView } from '../terminal/TerminalView';
import { Button, Tip } from '../ui/primitives';
import { cn } from '../../lib/cn';
import { ScenarioBar } from './ScenarioBar';

export const PreviewPanel = forwardRef<HTMLDivElement, { session: Session; palette: Palette; cols: number; shell: string; fontSize: number }>(function PreviewPanel(
  { session, palette, cols, shell, fontSize },
  ref,
) {
  const { demo, showHistory, liveClock, selectedId, hoverId, scenario } = useUI();
  const { select, hover, set } = useUI.getState();
  const s = effectiveScenario(scenario);
  const title = session.title ?? `${s.user}@${s.host}: ${shell} — ${cols}×${Math.max(8, session.term.rows.length)}`;

  return (
    <section className="flex flex-col gap-3" aria-label="Live preview">
      <div ref={ref} className="min-w-0">
        <TerminalView
          term={session.term}
          palette={palette}
          fontSize={fontSize}
          title={title}
          minRows={demo ? 14 : 4}
          maxRows={demo ? 14 : undefined}
          hoverTag={hoverId}
          selectedTag={selectedId}
          onTagHover={demo ? undefined : hover}
          onTagClick={demo ? undefined : (t) => select(t === selectedId ? null : t)}
          className={cn(!demo && 'cursor-pointer')}
          badge={
            <span className="hidden rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider sm:inline" style={{ color: palette.terminal.foreground, opacity: 0.55 }}>
              {palette.name}
            </span>
          }
        />
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border border-surface0/70 bg-mantle/70 p-2.5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          {demo ? (
            <p className="flex h-7 items-center gap-2 px-1 text-xs text-subtext0">
              <span className="size-2 animate-pulse rounded-full bg-red" /> Playing a demo session — watch the prompt react to each command.
            </p>
          ) : (
            <ScenarioBar />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
          <Tip label={demo ? 'Stop the demo' : 'Play a demo session'}>
            <Button size="sm" variant={demo ? 'primary' : 'outline'} onClick={() => set('demo', !demo)}>
              {demo ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              Demo
            </Button>
          </Tip>
          <Tip label={showHistory ? 'Hide the previous command' : 'Show the previous command'}>
            <Button size="icon-sm" variant={showHistory ? 'secondary' : 'ghost'} onClick={() => set('showHistory', !showHistory)} aria-label="Toggle history" aria-pressed={showHistory}>
              <History className="size-3.5" />
            </Button>
          </Tip>
          <Tip label={liveClock ? 'Clock is live' : 'Clock is frozen'}>
            <Button size="icon-sm" variant={liveClock ? 'secondary' : 'ghost'} onClick={() => set('liveClock', !liveClock)} aria-label="Toggle live clock" aria-pressed={liveClock}>
              <Clock3 className="size-3.5" />
            </Button>
          </Tip>
          <div className="ml-1 flex items-center rounded-lg ring-1 ring-surface0">
            <Button size="icon-sm" variant="ghost" aria-label="Smaller text" onClick={() => set('fontSize', Math.max(9, fontSize - 1))}>
              <Minus className="size-3.5" />
            </Button>
            <span className="w-7 text-center font-mono text-[0.6875rem] text-overlay1">{fontSize}</span>
            <Button size="icon-sm" variant="ghost" aria-label="Larger text" onClick={() => set('fontSize', Math.min(20, fontSize + 1))}>
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});
