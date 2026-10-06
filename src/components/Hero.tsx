import { ArrowRight, BadgeCheck, LayoutGrid, Shield, Zap } from 'lucide-react';
import { PALETTES } from '../data/palettes';
import { PRESETS } from '../data/presets';
import { ELEMENT_LIST } from '../lib/elements';
import { useUI } from '../store/ui';
import { Button } from './ui/primitives';

export function Hero() {
  const setView = useUI((s) => s.setView);
  const stats = [
    { icon: BadgeCheck, text: 'Every preset tested in real bash 3.2 & 5.3 and zsh 5.9' },
    { icon: Zap, text: 'Git status without forking outside repos' },
    { icon: Shield, text: 'Injection-safe: paths & branches are never executed' },
  ];
  return (
    <section className="relative overflow-hidden">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex w-full max-w-[1760px] flex-col gap-5 px-4 pb-6 pt-8 lg:flex-row lg:items-end lg:justify-between xl:px-6">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-surface0 bg-mantle/70 px-3 py-1 text-xs text-subtext0">
            <span className="size-1.5 rounded-full bg-green shadow-[0_0_8px_var(--ctp-green)]" />
            {ELEMENT_LIST.filter((e) => !e.hidden).length} elements · {PRESETS.length} presets · {PALETTES.length} palettes · bash &amp; zsh
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Build the prompt you look at{' '}
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">all day.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-[0.95rem] leading-relaxed text-subtext0 sm:text-[1rem]">
            Drag elements together, watch them render in a real terminal emulator as you change the situation — failed commands,
            dirty repos, root over SSH — and copy fast, readable code for <code className="font-mono text-[0.9em] text-text">~/.bashrc</code> or{' '}
            <code className="font-mono text-[0.9em] text-text">~/.zshrc</code>.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <ul className="flex flex-col gap-1.5 text-[0.8125rem] text-subtext0">
            {stats.map((s) => (
              <li key={s.text} className="flex items-center gap-2">
                <s.icon className="size-4 shrink-0 text-accent" />
                {s.text}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setView('gallery')}>
              <LayoutGrid className="size-4" /> Browse {PRESETS.length} presets
            </Button>
            <Button variant="ghost" onClick={() => setView('learn')}>
              How prompts work <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
