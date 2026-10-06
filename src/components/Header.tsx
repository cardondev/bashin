import { BookOpen, Command, Hammer, LayoutGrid, Moon, Palette as PaletteIcon, Sun } from 'lucide-react';
import { ACCENT_TOKENS } from '../data/palette-types';
import { useUI, type Flavor, type View } from '../store/ui';
import { GithubMark } from './ui/Icon';
import { Button, Popover, Tip } from './ui/primitives';
import { cn } from '../lib/cn';

export const REPO_URL = 'https://github.com/cardondev/bashin';

export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="bashin-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="var(--ctp-crust)" />
      <rect x="2" y="2" width="60" height="60" rx="14" fill="none" stroke="url(#bashin-logo)" strokeWidth="3" />
      <path d="M17 22l11 10-11 10" fill="none" stroke="url(#bashin-logo)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 43h14" stroke="var(--ctp-pink)" strokeWidth="6" strokeLinecap="round">
        <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.5;0.5;0.95;1" dur="1.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

const VIEWS: { id: View; label: string; icon: typeof Hammer }[] = [
  { id: 'builder', label: 'Builder', icon: Hammer },
  { id: 'gallery', label: 'Gallery', icon: LayoutGrid },
  { id: 'learn', label: 'Learn', icon: BookOpen },
];

const FLAVORS: { id: Flavor; label: string; swatch: string }[] = [
  { id: 'mocha', label: 'Mocha', swatch: '#1e1e2e' },
  { id: 'macchiato', label: 'Macchiato', swatch: '#24273a' },
  { id: 'frappe', label: 'Frappé', swatch: '#303446' },
  { id: 'latte', label: 'Latte', swatch: '#eff1f5' },
];

function ThemeMenu() {
  const { flavor, accent, setFlavor, setAccent } = useUI();
  return (
    <Popover
      align="end"
      className="w-64"
      trigger={
        <Button size="icon" variant="ghost" aria-label="Site theme">
          <PaletteIcon className="size-4" />
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <div className="eyebrow mb-2">Catppuccin flavor</div>
          <div className="grid grid-cols-2 gap-1.5">
            {FLAVORS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFlavor(f.id)}
                aria-pressed={flavor === f.id}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition-colors',
                  flavor === f.id ? 'border-accent bg-accent/10' : 'border-surface0 hover:border-surface2',
                )}
              >
                <span className="size-4 rounded-full ring-1 ring-black/20" style={{ backgroundColor: f.swatch }} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow mb-2">Accent</div>
          <div className="grid grid-cols-7 gap-1.5">
            {ACCENT_TOKENS.map((a) => (
              <button
                key={a}
                type="button"
                title={a}
                aria-label={`Accent ${a}`}
                aria-pressed={accent === a}
                onClick={() => setAccent(a)}
                className={cn('size-6 rounded-full ring-1 ring-black/20 transition-transform hover:scale-110', accent === a && 'outline-2 outline-offset-2 outline-text')}
                style={{ backgroundColor: `var(--ctp-${a})` }}
              />
            ))}
          </div>
        </div>
      </div>
    </Popover>
  );
}

export function Header() {
  const { view, setView, flavor, toggleDark } = useUI();
  const setUI = useUI((s) => s.set);
  return (
    <header className="sticky top-0 z-40 border-b border-surface0/70 bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1760px] items-center gap-3 px-4 xl:px-6">
        <button type="button" onClick={() => setView('builder')} className="flex items-center gap-2.5" aria-label="Bashin home">
          <Logo />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[1.05rem] font-bold tracking-tight">Bashin</span>
            <span className="mt-0.5 hidden text-[0.6875rem] text-overlay1 sm:block">prompt generator</span>
          </span>
        </button>

        <nav className="ml-2 flex items-center gap-0.5 rounded-xl bg-crust/50 p-0.5 ring-1 ring-surface0 sm:ml-6" aria-label="Sections">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-current={view === v.id ? 'page' : undefined}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-[0.6rem] px-2.5 text-[0.8125rem] font-medium transition-colors sm:px-3',
                view === v.id ? 'bg-surface0 text-text shadow-sm' : 'text-overlay2 hover:text-text',
              )}
            >
              <v.icon className="size-3.5" />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setUI('paletteOpen', true)}
            className="hidden h-9 items-center gap-2 rounded-xl border border-surface0 bg-crust/40 pl-3 pr-1.5 text-[0.8125rem] text-overlay1 transition-colors hover:border-surface2 hover:text-text md:flex"
          >
            <Command className="size-3.5" />
            Search & actions
            <span className="kbd">⌘K</span>
          </button>
          <Tip label={flavor === 'latte' ? 'Dark mode' : 'Light mode'}>
            <Button size="icon" variant="ghost" onClick={toggleDark} aria-label="Toggle dark mode">
              {flavor === 'latte' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </Tip>
          <ThemeMenu />
          <Tip label="cardondev/bashin on GitHub">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex size-9 items-center justify-center rounded-xl text-subtext1 transition-colors hover:bg-surface0/70 hover:text-text" aria-label="GitHub repository">
              <GithubMark />
            </a>
          </Tip>
        </div>
      </div>
    </header>
  );
}
