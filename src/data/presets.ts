/**
 * Ready-made prompts for the gallery.
 *
 * The NovaShell set recreates the prompts that ship with NovaShell 2 and 3
 * (fancy, lowkey, pico, nova, dev, classic, bare, matrix, retro, maxprompt,
 * maxgit, maxpower) — everything in one PS1 here, so even the full-width rules
 * survive Ctrl-L. The rest are inspired by popular prompts and distro defaults.
 */
import type { ColorRef, PromptDoc, PromptElement, PromptSettings, Style } from '../lib/model';
import { DEFAULT_SETTINGS, tok } from '../lib/model';
import type { Scenario } from '../lib/scenario';
import type { TokenName } from './palette-types';

export type PresetTag =
  | 'novashell'
  | 'minimal'
  | 'powerline'
  | 'multi-line'
  | 'git'
  | 'retro'
  | 'distro'
  | 'nerd-font'
  | 'right-prompt'
  | 'colorful';

export interface Preset {
  id: string;
  name: string;
  description: string;
  tags: PresetTag[];
  /** Credit line shown on the card. */
  origin: string;
  doc: PromptDoc;
  /** Scenario the gallery card previews in. */
  scenario?: Partial<Scenario>;
}

// ── tiny builders ────────────────────────────────────────────────────────────

type Partialish = Omit<PromptElement, 'id' | 'type'>;

let seq = 0;
const id = () => `p${(++seq).toString(36)}`;

function el(type: PromptElement['type'], extra: Partialish = {}): PromptElement {
  return { id: id(), type, ...extra };
}

const c = (t: TokenName): ColorRef => tok(t);
const ansi = (v: number): ColorRef => ({ t: 'ansi', v });
const fg = (t: TokenName | ColorRef, more: Style = {}): Style => ({ fg: typeof t === 'string' ? c(t) : t, ...more });
const on = (bgT: TokenName | ColorRef, fgT: TokenName | ColorRef, more: Style = {}): Style => ({
  bg: typeof bgT === 'string' ? c(bgT) : bgT,
  fg: typeof fgT === 'string' ? c(fgT) : fgT,
  ...more,
});

const text = (s: string, style?: Style, extra: Partialish = {}) => el('text', { options: { text: s }, style, ...extra });
const sym = (s: string, style?: Style, extra: Partialish = {}) => el('symbol', { options: { char: s }, style, ...extra });
const nl = () => el('newline');
const fill = (ch: string, style?: Style) => el('fill', { options: { char: ch }, style });
const group = (open: string, close: string, sep: string, style?: Style, extra: Partialish = {}) =>
  el('group', { options: { open, close, sep }, style, ...extra });
const end = () => el('group-end');

function doc(name: string, elements: PromptElement[], settings: Partial<PromptSettings> = {}): PromptDoc {
  return { v: 1, name, elements, settings: { ...DEFAULT_SETTINGS, separator: 'none', ...settings } };
}

// Glyphs used below (all in the bundled Nerd Font subset)
const NF = {
  branch: '\u{f418}',
  plBranch: '\u{e0a0}',
  clock: '\u{f017}',
  calendar: '\u{f073}',
  user: '\u{f007}',
  bolt: '\u{f0e7}',
  folder: '\u{f07c}',
  home: '\u{f015}',
  lock: '\u{f023}',
  python: '\u{e73c}',
  node: '\u{f0399}',
  docker: '\u{f0868}',
  k8s: '\u{f10fe}',
  aws: '\u{f0ef}',
  check: '\u{f00c}',
  close: '\u{f0156}',
  timer: '\u{f051b}',
  terminal: '\u{f120}',
  rocket: '\u{f135}',
  server: '\u{f233}',
  tux: '\u{f31a}',
};

// ── NovaShell ────────────────────────────────────────────────────────────────

const novaFancy: Preset = {
  id: 'novashell-fancy',
  name: 'NovaShell Fancy',
  description: 'The original three-line NovaShell layout: a ═ rule, time · date · user@host, the path, then ❯❯❯.',
  tags: ['novashell', 'multi-line', 'colorful'],
  origin: 'NovaShell 2 · fancypants',
  doc: doc('NovaShell Fancy', [
    fill('═', fg('yellow')),
    nl(),
    text('┌─[', fg('yellow')),
    el('time', { options: { format: 'zone' }, style: fg('sky') }),
    text(']─[', fg('yellow')),
    el('date', { options: { format: 'long' }, style: fg('peach') }),
    text(']─[', fg('yellow')),
    el('user', { style: fg('green'), rootStyle: fg('red') }),
    text('@', fg('text')),
    el('host', { style: fg('teal') }),
    text(']', fg('yellow')),
    nl(),
    text('├─[', fg('yellow')),
    el('cwd', { style: fg('green') }),
    text(']', fg('yellow')),
    nl(),
    text('└─', fg('yellow')),
    el('prompt-char', {
      options: { char: '❯❯❯', rootChar: '⚡❯❯❯', errorChar: '' },
      style: fg('text', { italic: true }),
      rootStyle: fg('red', { italic: true, blink: true }),
    }),
    text(' '),
  ]),
};

const novaMinimal: Preset = {
  id: 'novashell-lowkey',
  name: 'NovaShell Lowkey',
  description: 'Just the host and a chevron. Nothing to read, nothing to wait for.',
  tags: ['novashell', 'minimal'],
  origin: 'NovaShell 2 · lowkey',
  doc: doc('NovaShell Lowkey', [el('host', { style: fg('teal') }), text(' '), text('>', fg('peach')), text(' ')]),
};

const novaPico: Preset = {
  id: 'novashell-pico',
  name: 'NovaShell Pico',
  description: 'Minimal with enough info: user@host, a short path, an exit-code badge, λ.',
  tags: ['novashell', 'minimal'],
  origin: 'NovaShell 2 · pico',
  scenario: { exitCode: 1 },
  doc: doc('NovaShell Pico', [
    el('user', { style: fg('green'), rootStyle: fg('red') }),
    text('@', fg('overlay0')),
    el('host', { style: fg('teal') }),
    text(' '),
    el('cwd', { options: { mode: 'trim', depth: 3, ellipsis: '...', keepHome: false }, style: fg('green') }),
    text(' '),
    el('exit-code', { options: { mode: 'error', format: 'code', errorSymbol: '' }, prefix: '[', suffix: '] ', style: fg('red') }),
    el('prompt-char', { options: { char: 'λ', rootChar: '#' }, style: fg('green'), errorStyle: fg('red'), rootStyle: fg('red') }),
    text(' '),
  ]),
};

const novaNova: Preset = {
  id: 'novashell-nova',
  name: 'NovaShell Nova',
  description: 'Two lines with rounded corners; venv · k8s · ssh · jobs · tmux · status · time right-aligned.',
  tags: ['novashell', 'multi-line', 'right-prompt'],
  origin: 'NovaShell 2 · nova',
  scenario: { venv: '/home/nova/projects/infra/.venv', k8s: 'prod-eu-west-1', jobs: 1 },
  doc: doc('NovaShell Nova', [
    text('╭─[', fg('yellow')),
    el('user', { style: fg('green'), rootStyle: fg('red') }),
    text('@', fg('text')),
    el('host', { style: fg('teal') }),
    text(']─[', fg('yellow')),
    el('cwd', { style: fg('green') }),
    text(']', fg('yellow')),
    fill('─', fg('yellow')),
    group(' ', '', ' '),
    el('venv', { prefix: '(', suffix: ')', style: fg('mauve') }),
    el('k8s', { prefix: 'k8s:', style: fg('pink') }),
    el('ssh', { options: { text: 'ssh' }, style: fg('peach') }),
    el('jobs', { options: { symbol: 'jobs:', count: true, min: 1 }, style: fg('yellow') }),
    el('tmux', { prefix: 'tmux:', style: fg('sky') }),
    el('exit-code', { options: { mode: 'always', format: 'code' }, style: fg('green'), errorStyle: fg('red') }),
    el('time', { options: { format: '24' }, style: fg('sky') }),
    end(),
    nl(),
    text('╰─', fg('yellow')),
    el('prompt-char', { options: { char: '❯', rootChar: '' }, style: fg('peach'), rootStyle: fg('red') }),
    text(' '),
  ]),
};

const novaDev: Preset = {
  id: 'novashell-dev',
  name: 'NovaShell Dev',
  description: "The engineer's daily driver: exit badge, user@host, short path, a {venv k8s tmux ssh} cluster, ∎.",
  tags: ['novashell', 'minimal'],
  origin: 'NovaShell 2 · dev',
  scenario: { venv: '/home/nova/projects/infra/.venv', k8s: 'staging', exitCode: 2 },
  doc: doc('NovaShell Dev', [
    el('exit-code', { options: { mode: 'error', format: 'code', errorSymbol: '' }, prefix: '[', suffix: '] ', style: fg('red') }),
    el('user', { style: fg('green'), rootStyle: fg('red') }),
    text('@', fg('overlay0')),
    el('host', { style: fg('teal') }),
    text(' '),
    el('cwd', { options: { mode: 'trim', depth: 3, ellipsis: '...', keepHome: false }, style: fg('green') }),
    text(' '),
    group('{', '} ', ' ', fg('overlay0')),
    el('venv', { prefix: '(', suffix: ')', style: fg('mauve') }),
    el('k8s', { prefix: 'k8s:', style: fg('pink') }),
    el('tmux', { prefix: 'tmux:', style: fg('sky') }),
    el('ssh', { style: fg('peach') }),
    end(),
    el('prompt-char', { options: { char: '∎', rootChar: '#' }, style: fg('green'), rootStyle: fg('red') }),
    text(' '),
  ]),
};

const novaClassic: Preset = {
  id: 'novashell-classic',
  name: 'NovaShell Classic',
  description: 'The long-serving three-line box in Catppuccin Macchiato: date, user@host, ╔══[path]═════, ╚═⟫.',
  tags: ['novashell', 'multi-line', 'colorful'],
  origin: 'NovaShell 2 · classic',
  doc: doc(
    'NovaShell Classic',
    [
      el('date', { options: { format: 'custom', custom: '%a %b %d, %Y %H:%M %Z' }, style: fg('mauve') }),
      text(' '),
      el('user', { style: fg('blue') }),
      text('@', fg('peach')),
      el('host', { style: fg('sapphire') }),
      el('prompt-char', { options: { char: '$', rootChar: ' #' }, style: fg('green'), rootStyle: fg('green', { blink: true }) }),
      nl(),
      text('╔══[', fg('lavender')),
      el('cwd', { style: fg('sky') }),
      text(']═════', fg('lavender')),
      nl(),
      text('╚═', fg('yellow')),
      text('⟫', fg('peach')),
      text(' '),
    ],
    { palette: 'catppuccin-macchiato' },
  ),
};

const novaBare: Preset = {
  id: 'novashell-bare',
  name: 'NovaShell Bare',
  description: 'Plain user@host dir$ — no colors, no escapes. For serial consoles, recordings and screen readers.',
  tags: ['novashell', 'minimal'],
  origin: 'NovaShell 2 · bare',
  doc: doc('NovaShell Bare', [
    el('user', { style: {} }),
    text('@', {}),
    el('host', { style: {} }),
    text(' ', {}),
    el('cwd', { options: { mode: 'base' }, style: {} }),
    el('prompt-char', { options: { char: '$', rootChar: '#' }, style: {} }),
    text(' ', {}),
  ]),
};

const novaMatrix: Preset = {
  id: 'novashell-matrix',
  name: 'NovaShell Matrix',
  description: 'Green phosphor: dim time, bright user@host, mid-green path, a hollow badge after failures.',
  tags: ['novashell', 'retro'],
  origin: 'NovaShell 2 · matrix',
  scenario: { exitCode: 130 },
  doc: doc(
    'NovaShell Matrix',
    [
      el('time', { options: { format: '24' }, style: fg('overlay0') }),
      text(' '),
      el('user', { style: fg('text') }),
      text('@', fg('text')),
      el('host', { style: fg('text') }),
      text(' '),
      el('cwd', { style: fg('blue') }),
      text(' '),
      el('exit-code', { options: { mode: 'error', format: 'code', errorSymbol: '' }, prefix: '[', suffix: '] ', style: fg('red') }),
      el('prompt-char', { options: { char: '▸', rootChar: '' }, style: fg('text'), rootStyle: fg('red') }),
      text(' '),
    ],
    { palette: 'phosphor' },
  ),
};

const novaRetro: Preset = {
  id: 'novashell-retro',
  name: 'NovaShell Retro',
  description: 'Warm amber like a VT220: history number, time and user@host dim; the path bright.',
  tags: ['novashell', 'retro', 'multi-line'],
  origin: 'NovaShell 2 · retro',
  doc: doc(
    'NovaShell Retro',
    [
      text('▚ ', fg('overlay1')),
      el('history', { prefix: '', style: fg('overlay1') }),
      text(' ', fg('overlay1')),
      el('time', { options: { format: '24' }, style: fg('overlay1') }),
      text(' ', fg('overlay1')),
      el('user', { style: fg('overlay1') }),
      text('@', fg('overlay1')),
      el('host', { style: fg('overlay1') }),
      text(' ', fg('overlay1')),
      el('cwd', { style: fg('text') }),
      nl(),
      el('prompt-char', { options: { char: '$', rootChar: '#' }, style: fg('text') }),
      text(' '),
    ],
    { palette: 'amber' },
  ),
};

const maxLines = (git: boolean): PromptElement[] => [
  fill('=', fg('yellow')),
  nl(),
  text('┌─[', fg('yellow')),
  el('time', { options: { format: 'zone' }, style: fg('sky') }),
  text(']─[', fg('yellow')),
  el('date', { options: { format: 'long' }, style: fg('peach') }),
  text(']─[', fg('yellow')),
  el('user', { style: fg('green'), rootStyle: fg('red') }),
  text('@', fg('text')),
  el('host', { style: fg('teal') }),
  text(']─[', fg('yellow')),
  el('os', { options: { show: 'label' }, style: fg('mauve') }),
  text(']', fg('yellow')),
  nl(),
  text('├─[', fg('yellow')),
  el('cwd', { style: fg('green') }),
  text(']', fg('yellow')),
  ...(git
    ? [
        group('─[', ']', ' ', fg('yellow')),
        el('git-branch', { options: { icon: 'git:', showOp: true }, style: fg('pink') }),
        el('git-status', { options: { style: 'counts', colorize: true, clean: true }, style: fg('peach') }),
        end(),
      ]
    : []),
  nl(),
  text('└─', fg('yellow')),
  el('prompt-char', {
    options: { char: '❯❯❯', rootChar: '⚡❯❯❯' },
    style: fg('text', { italic: true }),
    errorStyle: fg('red', { italic: true }),
    rootStyle: fg('red', { italic: true, blink: true }),
  }),
  text(' '),
];

const novaMax: Preset = {
  id: 'novashell-maxprompt',
  name: 'NovaShell MaxPrompt',
  description: 'NovaShell 3’s default: an = rule, time · date · user@host · OS in a box, the path, ❯❯❯ that turns red on failure.',
  tags: ['novashell', 'multi-line', 'colorful'],
  origin: 'NovaShell 3 · maxprompt',
  doc: doc('NovaShell MaxPrompt', maxLines(false)),
};

const novaMaxGit: Preset = {
  id: 'novashell-maxgit',
  name: 'NovaShell MaxGit',
  description: 'MaxPrompt plus git on the path line: ─[git:main +1 ~2 ?3 ↑1], read without forking outside repos.',
  tags: ['novashell', 'multi-line', 'git', 'colorful'],
  origin: 'NovaShell 3 · maxgit',
  doc: doc('NovaShell MaxGit', maxLines(true)),
};

const novaMaxPower: Preset = {
  id: 'novashell-maxpower',
  name: 'NovaShell MaxPower',
  description: 'MaxPrompt’s information as Rosé Pine Moon powerline capsules with Nerd Font icons.',
  tags: ['novashell', 'powerline', 'multi-line', 'nerd-font', 'git'],
  origin: 'NovaShell 3 · maxpower',
  doc: doc(
    'NovaShell MaxPower',
    [
      fill('─', fg('surface2')),
      nl(),
      text('╭─', fg('overlay0')),
      el('time', { options: { format: 'zone' }, prefix: `${NF.clock} `, style: on('yellow', 'base') }),
      el('date', { options: { format: 'long' }, prefix: `${NF.calendar} `, style: on('rosewater', 'base') }),
      group('', '', '', on('mauve', 'base'), { prefix: `${NF.user} `, rootStyle: { bg: c('red') } }),
      el('user', { style: fg('base') }),
      text('@', fg('base')),
      el('host', { style: fg('base') }),
      end(),
      el('os', { options: { show: 'icon-label' }, style: on('sky', 'base') }),
      nl(),
      text('╰─', fg('overlay0')),
      el('cwd', { prefix: `${NF.folder} `, style: on('blue', 'text') }),
      el('git-branch', { options: { icon: `${NF.branch} `, showOp: true }, style: on('surface0', 'yellow') }),
      text(' '),
      el('prompt-char', { options: { char: '❯', rootChar: '' }, style: fg('sky'), errorStyle: fg('red') }),
      text(' '),
    ],
    { palette: 'rose-pine-moon', separator: 'capsule' },
  ),
};

// ── Popular prompts ──────────────────────────────────────────────────────────

const pure: Preset = {
  id: 'pure',
  name: 'Pure',
  description: 'Pretty, minimal and fast: path, branch, dirty mark, arrows and duration — then a lone ❯.',
  tags: ['minimal', 'multi-line', 'git'],
  origin: 'Inspired by sindresorhus/pure',
  scenario: { durationMs: 7300 },
  doc: doc(
    'Pure',
    [
      el('user', { show: 'ssh', suffix: ' ', style: fg('overlay1') }),
      el('cwd', { style: fg('blue') }),
      el('git-branch', { options: { icon: '', showOp: true }, prefix: ' ', style: fg('overlay1') }),
      el('git-status', { options: { style: 'arrows', dirty: '*', colorize: false, clean: false }, style: fg('pink') }),
      el('duration', { options: { threshold: 5000, format: 'human' }, prefix: ' ', style: fg('yellow') }),
      nl(),
      el('venv', { prefix: '', suffix: ' ', style: fg('overlay1') }),
      el('prompt-char', { options: { char: '❯', rootChar: '' }, style: fg('mauve'), errorStyle: fg('red') }),
      text(' '),
    ],
    { newlineBefore: true },
  ),
};

const starship: Preset = {
  id: 'starship',
  name: 'Starship',
  description: 'Starship’s defaults: “~/repo on  main [!?⇡] via ⬢ v22 took 4s”, then a green ❯.',
  tags: ['multi-line', 'git', 'nerd-font'],
  origin: 'Inspired by starship.rs',
  scenario: { durationMs: 4100 },
  doc: doc(
    'Starship',
    [
      el('cwd', { options: { mode: 'repo' }, style: fg('teal', { bold: true }) }),
      el('git-branch', { options: { icon: `${NF.plBranch} `, showOp: true }, prefix: ' on ', style: fg('mauve', { bold: true }) }),
      el('git-status', { options: { style: 'starship', colorize: false, clean: false }, prefix: ' ', style: fg('red', { bold: true }) }),
      el('node', { prefix: ' via ⬢ v', style: fg('green', { bold: true }) }),
      el('venv', { prefix: ' via 🐍 (', suffix: ')', style: fg('yellow', { bold: true }) }),
      el('duration', { options: { threshold: 2000, format: 'human' }, prefix: ' took ', style: fg('yellow', { bold: true }) }),
      nl(),
      el('prompt-char', { options: { char: '❯', rootChar: '' }, style: fg('green', { bold: true }), errorStyle: fg('red', { bold: true }) }),
      text(' '),
    ],
    { newlineBefore: true },
  ),
};

const agnoster: Preset = {
  id: 'agnoster',
  name: 'Agnoster',
  description: 'The classic powerline theme: status, user@host, directory and branch on solid blocks.',
  tags: ['powerline', 'git', 'nerd-font'],
  origin: 'Inspired by agnoster (oh-my-zsh)',
  doc: doc(
    'Agnoster',
    [
      el('exit-code', { options: { mode: 'error', format: 'none', errorSymbol: '✘' }, style: on('crust', 'red') }),
      el('jobs', { options: { symbol: '⚙', count: false, min: 1 }, style: on('crust', 'sky') }),
      group('', '', '', on('surface0', 'text')),
      el('user', { style: fg('text'), rootStyle: { fg: c('yellow') } }),
      text('@', fg('text')),
      el('host', { style: fg('text') }),
      end(),
      el('cwd', { style: on('blue', 'crust') }),
      group('', '', ' ', on('green', 'crust')),
      el('git-branch', { options: { icon: `${NF.plBranch} `, showOp: true }, style: fg('crust') }),
      el('git-status', { options: { style: 'arrows', dirty: '±', colorize: false, clean: false }, style: fg('crust') }),
      end(),
      text(' '),
    ],
    { separator: 'powerline' },
  ),
};

const p10kLean: Preset = {
  id: 'p10k-lean',
  name: 'Lean',
  description: 'Powerlevel10k’s lean style: dir and git on the left, status and time on the right, ❯ below.',
  tags: ['multi-line', 'git', 'right-prompt'],
  origin: 'Inspired by powerlevel10k (lean)',
  scenario: { exitCode: 1, durationMs: 3200 },
  doc: doc('Lean', [
    el('cwd', { options: { mode: 'trim', depth: 4 }, style: fg('blue', { bold: true }) }),
    el('git-branch', { options: { icon: ' ', showOp: true }, style: fg('green') }),
    el('git-status', { options: { style: 'counts', colorize: true, clean: false }, prefix: ' ', style: fg('yellow') }),
    fill(' '),
    group('', '', ' '),
    el('exit-code', { options: { mode: 'error', format: 'code', errorSymbol: '✘ ' }, style: fg('red') }),
    el('duration', { options: { threshold: 3000, format: 'human' }, style: fg('peach') }),
    el('jobs', { options: { symbol: '✦', count: true, min: 1 }, style: fg('green') }),
    el('venv', { style: fg('teal') }),
    el('time', { options: { format: '24' }, prefix: 'at ', style: fg('overlay1') }),
    end(),
    nl(),
    el('prompt-char', { options: { char: '❯', rootChar: '' }, style: fg('green'), errorStyle: fg('red') }),
    text(' '),
  ]),
};

const p10kRainbow: Preset = {
  id: 'p10k-rainbow',
  name: 'Rainbow',
  description: 'Powerlevel10k’s rainbow style: framed lines, colored segments flowing in from both edges.',
  tags: ['powerline', 'multi-line', 'right-prompt', 'nerd-font', 'git', 'colorful'],
  origin: 'Inspired by powerlevel10k (rainbow)',
  scenario: { durationMs: 2300, venv: '/home/nova/projects/bashin/.venv' },
  doc: doc(
    'Rainbow',
    [
      text('╭─', fg('surface2')),
      el('os', { options: { show: 'icon' }, style: on('text', 'crust') }),
      el('cwd', { options: { mode: 'trim', depth: 3, home: NF.home }, prefix: `${NF.folder} `, style: on('blue', 'crust', { bold: true }) }),
      el('git-branch', { options: { icon: `${NF.branch} `, showOp: true }, style: on('green', 'crust') }),
      el('git-status', { options: { style: 'counts', colorize: false, clean: false }, style: on('green', 'crust') }),
      fill('─', fg('surface2')),
      el('exit-code', { options: { mode: 'always', format: 'code', errorSymbol: '✘ ', successSymbol: '✔' }, style: on('surface1', 'green'), errorStyle: { bg: c('red'), fg: c('crust') } }),
      el('duration', { options: { threshold: 2000, format: 'human' }, prefix: `${NF.timer} `, style: on('yellow', 'crust') }),
      el('venv', { prefix: `${NF.python} `, style: on('teal', 'crust') }),
      el('time', { options: { format: '24' }, prefix: `${NF.clock} `, style: on('text', 'crust') }),
      text('─╮', fg('surface2')),
      nl(),
      text('╰─', fg('surface2')),
      el('prompt-char', { options: { char: '❯', rootChar: '#' }, style: fg('green'), errorStyle: fg('red') }),
      text(' '),
    ],
    { separator: 'powerline' },
  ),
};

const robby: Preset = {
  id: 'robbyrussell',
  name: 'Robby Russell',
  description: 'oh-my-zsh’s default: ➜  folder git:(branch) ✗.',
  tags: ['minimal', 'git'],
  origin: 'Inspired by oh-my-zsh robbyrussell',
  doc: doc('Robby Russell', [
    el('prompt-char', { options: { char: '➜', rootChar: '' }, style: fg('green', { bold: true }), errorStyle: fg('red', { bold: true }) }),
    text('  '),
    el('cwd', { options: { mode: 'base' }, style: fg('teal', { bold: true }) }),
    group(' git:(', ')', '', fg('blue', { bold: true })),
    el('git-branch', { options: { icon: '', showOp: false }, style: fg('red', { bold: true }) }),
    end(),
    el('git-status', { options: { style: 'arrows', dirty: '✗', aheadBehind: false, colorize: false, clean: false }, prefix: ' ', style: fg('yellow', { bold: true }) }),
    text(' '),
  ]),
};

const spaceship: Preset = {
  id: 'spaceship',
  name: 'Spaceship',
  description: '“nova at zeus in ~/repo on  main [!] via ⬢ took 3s” — a sentence that reads like a status line.',
  tags: ['multi-line', 'git', 'nerd-font'],
  origin: 'Inspired by spaceship-prompt',
  scenario: { durationMs: 3100 },
  doc: doc(
    'Spaceship',
    [
      el('user', { show: 'ssh', style: fg('yellow', { bold: true }), suffix: '' }),
      el('host', { options: { onlySsh: true }, prefix: ' at ', style: fg('green', { bold: true }) }),
      el('cwd', { options: { mode: 'trim', depth: 3 }, prefix: ' in ', style: fg('teal', { bold: true }) }),
      el('git-branch', { options: { icon: `${NF.plBranch} `, showOp: true }, prefix: ' on ', style: fg('mauve', { bold: true }) }),
      el('git-status', { options: { style: 'starship', colorize: false, clean: false }, prefix: ' ', style: fg('red', { bold: true }) }),
      el('node', { prefix: ' via ⬢ v', style: fg('green', { bold: true }) }),
      el('duration', { options: { threshold: 2000, format: 'human' }, prefix: ' took ', style: fg('yellow', { bold: true }) }),
      nl(),
      el('prompt-char', { options: { char: '➜', rootChar: '' }, style: fg('green', { bold: true }), errorStyle: fg('red', { bold: true }) }),
      text(' '),
    ],
    { newlineBefore: true },
  ),
};

const fish: Preset = {
  id: 'fish',
  name: 'Fish',
  description: 'fish’s default look in bash: abbreviated parents, (branch), and a >.',
  tags: ['minimal', 'git'],
  origin: 'Inspired by the fish shell',
  doc: doc('Fish', [
    el('user', { style: fg('green') }),
    text('@'),
    el('host', { style: {} }),
    text(' '),
    el('cwd', { options: { fish: true, fishLen: 1 }, style: fg('green') }),
    group(' (', ')', '', fg('text')),
    el('git-branch', { options: { icon: '', showOp: true }, style: fg('mauve') }),
    end(),
    el('prompt-char', { options: { char: '>', rootChar: '#' }, style: {}, errorStyle: fg('red') }),
    text(' '),
  ]),
};

// ── Distro defaults ──────────────────────────────────────────────────────────

const kali: Preset = {
  id: 'kali',
  name: 'Kali-style two-line',
  description: 'The ┌──(user㉿host)-[~] / └─$ layout, in your terminal’s own ANSI colors. Red for root.',
  tags: ['distro', 'multi-line'],
  origin: 'Inspired by Kali Linux’s zsh prompt',
  doc: doc('Kali-style two-line', [
    text('┌──(', fg(ansi(2)), { rootStyle: fg(ansi(4)) }),
    el('user', { style: fg(ansi(12), { bold: true }), rootStyle: fg(ansi(9), { bold: true }) }),
    text('㉿', fg(ansi(12), { bold: true }), { rootStyle: fg(ansi(9), { bold: true }) }),
    el('host', { style: fg(ansi(12), { bold: true }), rootStyle: fg(ansi(9), { bold: true }) }),
    text(')-[', fg(ansi(2)), { rootStyle: fg(ansi(4)) }),
    el('cwd', { style: { bold: true } }),
    text(']', fg(ansi(2)), { rootStyle: fg(ansi(4)) }),
    nl(),
    text('└─', fg(ansi(2)), { rootStyle: fg(ansi(4)) }),
    el('prompt-char', { options: { char: '$', rootChar: '#' }, style: fg(ansi(12), { bold: true }), rootStyle: fg(ansi(9), { bold: true }) }),
    text(' '),
  ]),
};

const parrot: Preset = {
  id: 'parrot',
  name: 'Parrot-style',
  description: '┌─[✗]─[user@host]─[~] / └──╼ $ with a red frame and a failure badge.',
  tags: ['distro', 'multi-line'],
  origin: 'Inspired by Parrot OS’s bash prompt',
  scenario: { exitCode: 1 },
  doc: doc('Parrot-style', [
    text('┌─', fg(ansi(1))),
    group('[', ']─', '', fg(ansi(1)), { show: 'error' }),
    sym('✗', fg(ansi(1)), { show: 'error' }),
    end(),
    text('[', fg(ansi(1))),
    el('user', { style: fg(ansi(7)), rootStyle: fg(ansi(9), { bold: true }) }),
    text('@', fg(ansi(11), { bold: true })),
    el('host', { style: fg(ansi(14), { bold: true }) }),
    text(']─[', fg(ansi(1))),
    el('cwd', { style: fg(ansi(2)) }),
    text(']', fg(ansi(1))),
    nl(),
    text('└──╼ ', fg(ansi(1))),
    el('prompt-char', { options: { char: '$', rootChar: '#' }, style: fg(ansi(11), { bold: true }) }),
    text(' '),
  ]),
};

const ubuntu: Preset = {
  id: 'ubuntu',
  name: 'Ubuntu / Debian color',
  description: 'The color_prompt from Debian’s skeleton .bashrc: bold green user@host, bold blue path, and a window title.',
  tags: ['distro', 'minimal'],
  origin: 'Debian/Ubuntu /etc/skel/.bashrc',
  doc: doc('Ubuntu / Debian color', [
    el('title', { options: { format: 'user-host-cwd' } }),
    el('user', { style: fg(ansi(2), { bold: true }) }),
    text('@', fg(ansi(2), { bold: true })),
    el('host', { style: fg(ansi(2), { bold: true }) }),
    text(':'),
    el('cwd', { style: fg(ansi(4), { bold: true }) }),
    el('prompt-char', { options: { char: '$', rootChar: '#' }, style: {} }),
    text(' '),
  ]),
};

const rhel: Preset = {
  id: 'rhel',
  name: 'RHEL / Fedora / Arch',
  description: 'The stock [user@host dir]$ that greets you on most Red Hat, Fedora and Arch boxes.',
  tags: ['distro', 'minimal'],
  origin: 'RHEL /etc/bashrc',
  doc: doc('RHEL / Fedora / Arch', [
    text('[', {}),
    el('user', { style: {} }),
    text('@', {}),
    el('host', { style: {} }),
    text(' ', {}),
    el('cwd', { options: { mode: 'base' }, style: {} }),
    text(']', {}),
    el('prompt-char', { options: { char: '$', rootChar: '#' }, style: {} }),
    text(' ', {}),
  ]),
};

// ── Bashin originals ─────────────────────────────────────────────────────────

const mochaPills: Preset = {
  id: 'mocha-pills',
  name: 'Mocha Pills',
  description: 'Separate rounded pills in Catppuccin accents, with context pills that appear only when needed.',
  tags: ['powerline', 'nerd-font', 'git', 'colorful'],
  origin: 'Bashin original',
  scenario: { venv: '/home/nova/projects/bashin/.venv' },
  doc: doc(
    'Mocha Pills',
    [
      group('', '', ' '),
      el('user', { prefix: `${NF.user} `, style: on('mauve', 'crust', { bold: true }), rootStyle: { bg: c('red') } }),
      el('cwd', { options: { mode: 'trim', depth: 3 }, prefix: `${NF.folder} `, style: on('blue', 'crust') }),
      el('git-branch', { options: { icon: `${NF.branch} `, showOp: true }, style: on('green', 'crust') }),
      el('git-status', { options: { style: 'counts', colorize: false, clean: false }, style: on('peach', 'crust') }),
      el('venv', { prefix: `${NF.python} `, style: on('yellow', 'crust') }),
      el('exit-code', { options: { mode: 'error', format: 'name', errorSymbol: `${NF.close} ` }, style: on('red', 'crust') }),
      end(),
      nl(),
      el('prompt-char', { options: { char: '❯', rootChar: '#' }, style: fg('mauve', { bold: true }), errorStyle: fg('red', { bold: true }) }),
      text(' '),
    ],
    { separator: 'round' },
  ),
};

const timeTraveler: Preset = {
  id: 'time-traveler',
  name: 'Right-hand Clock',
  description: 'One line. Path and branch on the left; exit status and the clock pinned to the right edge.',
  tags: ['minimal', 'right-prompt', 'git'],
  origin: 'Bashin original',
  scenario: { exitCode: 127 },
  doc: doc('Right-hand Clock', [
    el('cwd', { options: { mode: 'repo' }, style: fg('sapphire', { bold: true }) }),
    el('git-branch', { options: { icon: ' ⎇ ', showOp: true }, style: fg('mauve') }),
    text(' '),
    el('prompt-char', { options: { char: '›', rootChar: '#' }, style: fg('peach', { bold: true }), errorStyle: fg('red', { bold: true }) }),
    text(' '),
    fill(' '),
    group('', '', ' · ', fg('overlay0')),
    el('exit-code', { options: { mode: 'error', format: 'name', errorSymbol: '✗ ' }, style: fg('red') }),
    el('duration', { options: { threshold: 1000, format: 'human' }, style: fg('yellow') }),
    el('time', { options: { format: '24s' }, style: fg('overlay1') }),
    end(),
  ]),
};

const lambda: Preset = {
  id: 'lambda',
  name: 'Lambda',
  description: 'Fish-style path and a λ that blushes after a failure. Tiny, quick, readable.',
  tags: ['minimal'],
  origin: 'Bashin original',
  doc: doc('Lambda', [
    el('cwd', { options: { fish: true, fishLen: 1 }, style: fg('lavender') }),
    el('git-branch', { options: { icon: ':', showOp: false }, style: fg('overlay1') }),
    text(' '),
    el('prompt-char', { options: { char: 'λ', rootChar: 'Λ' }, style: fg('pink', { bold: true }), errorStyle: fg('red', { bold: true }) }),
    text(' '),
  ]),
};

const boxed: Preset = {
  id: 'dashboard',
  name: 'Dashboard',
  description: 'A full-width header bar with everything you might want, and a quiet input line.',
  tags: ['multi-line', 'right-prompt', 'git', 'nerd-font', 'colorful'],
  origin: 'Bashin original',
  scenario: { k8s: 'prod-eu-west-1', aws: 'platform-admin', venv: '/home/nova/projects/infra/.venv' },
  doc: doc('Dashboard', [
    text('▌', fg('mauve')),
    el('os', { options: { show: 'icon' }, suffix: ' ', style: fg('mauve') }),
    el('user', { style: fg('text', { bold: true }), rootStyle: fg('red', { bold: true }) }),
    text('@', fg('overlay1')),
    el('host', { style: fg('teal') }),
    el('ssh', { options: { text: ' (ssh)' }, style: fg('peach') }),
    text('  '),
    el('cwd', { options: { mode: 'trim', depth: 4, readonly: ` ${NF.lock}` }, prefix: `${NF.folder} `, style: fg('blue') }),
    el('git-branch', { options: { icon: `${NF.branch} `, showOp: true }, prefix: '  ', style: fg('green') }),
    el('git-status', { options: { style: 'dots', colorize: true, clean: true }, prefix: ' ', style: fg('peach') }),
    fill('·', fg('surface1')),
    group('', '', '  '),
    el('venv', { prefix: `${NF.python} `, style: fg('yellow') }),
    el('k8s', { prefix: `${NF.k8s} `, style: fg('sapphire') }),
    el('aws', { prefix: `${NF.aws} `, style: fg('peach') }),
    el('time', { options: { format: '24' }, prefix: `${NF.clock} `, style: fg('overlay2') }),
    end(),
    nl(),
    text('▌', fg('mauve')),
    el('exit-code', { options: { mode: 'error', format: 'code', errorSymbol: '✗' }, suffix: ' ', style: fg('red') }),
    el('prompt-char', { options: { char: '$', rootChar: '#' }, style: fg('mauve', { bold: true }) }),
    text(' '),
  ]),
};

const synthwave: Preset = {
  id: 'synthwave',
  name: 'Synthwave',
  description: 'Flame-edged neon segments over a deep purple night.',
  tags: ['powerline', 'nerd-font', 'colorful', 'git'],
  origin: 'Bashin original',
  doc: doc(
    'Synthwave',
    [
      el('user', { style: on('pink', 'crust', { bold: true }) }),
      el('cwd', { options: { mode: 'base' }, style: on('mauve', 'crust') }),
      el('git-branch', { options: { icon: `${NF.branch} `, showOp: true }, style: on('blue', 'crust') }),
      el('exit-code', { options: { mode: 'error', format: 'code', errorSymbol: '✗' }, style: on('red', 'crust') }),
      text(' '),
      el('prompt-char', { options: { char: '❯', rootChar: '#' }, style: fg('pink'), errorStyle: fg('red') }),
      text(' '),
    ],
    { separator: 'flame', palette: 'tokyo-night' },
  ),
};

const nordSlant: Preset = {
  id: 'nord-slant',
  name: 'Nord Slants',
  description: 'Arctic blues with slanted segment edges.',
  tags: ['powerline', 'nerd-font', 'git'],
  origin: 'Bashin original',
  doc: doc(
    'Nord Slants',
    [
      el('host', { prefix: `${NF.server} `, style: on('surface1', 'text') }),
      el('cwd', { options: { mode: 'trim', depth: 3 }, style: on('sapphire', 'crust') }),
      el('git-branch', { options: { icon: `${NF.branch} `, showOp: true }, style: on('blue', 'crust') }),
      el('git-status', { options: { style: 'counts', colorize: false, clean: false }, style: on('blue', 'crust') }),
      nl(),
      el('prompt-char', { options: { char: '❯', rootChar: '#' }, style: fg('sky'), errorStyle: fg('red') }),
      text(' '),
    ],
    { separator: 'slant', palette: 'nord' },
  ),
};

const gruvboxBlocks: Preset = {
  id: 'gruvbox-blocks',
  name: 'Gruvbox Fade',
  description: 'Retro warm segments that fade out in ░▒▓ blocks — no Nerd Font needed.',
  tags: ['powerline', 'retro', 'colorful'],
  origin: 'Bashin original',
  doc: doc(
    'Gruvbox Fade',
    [
      el('user', { style: on('yellow', 'crust', { bold: true }), rootStyle: { bg: c('red') } }),
      el('cwd', { options: { mode: 'trim', depth: 2 }, style: on('green', 'crust') }),
      el('git-branch', { options: { icon: '', showOp: true }, style: on('teal', 'crust') }),
      text(' '),
      el('prompt-char', { options: { char: '$', rootChar: '#' }, style: fg('yellow', { bold: true }), errorStyle: fg('red', { bold: true }) }),
      text(' '),
    ],
    { separator: 'blocks', palette: 'gruvbox-dark' },
  ),
};

const emoji: Preset = {
  id: 'emoji',
  name: 'Emoji',
  description: 'No fonts to install: emoji markers for you, your folder and your branch.',
  tags: ['colorful', 'git'],
  origin: 'Bashin original',
  doc: doc('Emoji', [
    el('user', { prefix: '🐧 ', style: fg('yellow') }),
    el('cwd', { options: { mode: 'base' }, prefix: ' 📂 ', style: fg('blue') }),
    el('git-branch', { options: { icon: '', showOp: true }, prefix: ' 🌿 ', style: fg('green') }),
    el('exit-code', { options: { mode: 'error', format: 'none', errorSymbol: ' 💥' }, style: fg('red') }),
    text(' '),
    el('prompt-char', { options: { char: '⚡', rootChar: '💀' }, style: {} }),
    text(' '),
  ]),
};

export const PRESETS: Preset[] = [
  novaMax,
  novaMaxGit,
  novaMaxPower,
  novaFancy,
  novaNova,
  novaDev,
  novaPico,
  novaClassic,
  novaMatrix,
  novaRetro,
  novaMinimal,
  novaBare,
  pure,
  starship,
  agnoster,
  p10kLean,
  p10kRainbow,
  robby,
  spaceship,
  fish,
  mochaPills,
  timeTraveler,
  boxed,
  lambda,
  synthwave,
  nordSlant,
  gruvboxBlocks,
  emoji,
  kali,
  parrot,
  ubuntu,
  rhel,
];

export const DEFAULT_PRESET_ID = 'novashell-maxgit';

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
