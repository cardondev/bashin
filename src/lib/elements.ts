/**
 * The element catalog: every building block the editor offers, its defaults,
 * its inspector fields, and how it compiles to IR ops.
 */
import { OS_ICONS } from '../data/nerd-glyphs';
import type { Palette } from '../data/palette-types';
import type { Cond, Op, VarRef } from './ir';
import type { ColorRef, ElementType, PromptElement, PromptSettings, Style } from './model';
import { tok } from './model';
import {
  awsProvider,
  commandProvider,
  containerProvider,
  cwdProvider,
  dockerProvider,
  durationProvider,
  envProvider,
  gitProvider,
  ipProvider,
  jobsProvider,
  k8sProvider,
  loadProvider,
  nativeCwd,
  nixProvider,
  nodeProvider,
  osProvider,
  rcProvider,
  shlvlProvider,
  terraformProvider,
  tmuxProvider,
  venvProvider,
  writableProvider,
  type CwdOpts,
  type Provider,
} from './providers';

export type Category = 'basics' | 'identity' | 'path' | 'time' | 'status' | 'git' | 'dev' | 'system' | 'advanced';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'basics', label: 'Text & layout' },
  { id: 'identity', label: 'User & host' },
  { id: 'path', label: 'Directory' },
  { id: 'git', label: 'Git' },
  { id: 'status', label: 'Status' },
  { id: 'time', label: 'Date & time' },
  { id: 'dev', label: 'Dev context' },
  { id: 'system', label: 'System' },
  { id: 'advanced', label: 'Advanced' },
];

interface FieldBase {
  key: string;
  label: string;
  help?: string;
  /** Only shown when this returns true. */
  when?: (o: Record<string, unknown>) => boolean;
}

export type Field =
  | (FieldBase & { k: 'text'; placeholder?: string; mono?: boolean })
  | (FieldBase & { k: 'glyph'; placeholder?: string })
  | (FieldBase & { k: 'number'; min?: number; max?: number; step?: number; unit?: string })
  | (FieldBase & { k: 'toggle' })
  | (FieldBase & { k: 'select'; options: { value: string; label: string }[] })
  | (FieldBase & { k: 'color' });

export interface BuildCtx {
  use(p: Provider): (name: string) => VarRef;
  palette: Palette;
  settings: PromptSettings;
}

export interface Built {
  ops: Op[];
  /** The element hides itself when this is false. */
  cond?: Cond;
}

export interface ElementDef {
  type: ElementType;
  name: string;
  description: string;
  category: Category;
  /** Lucide icon name, or `si:<slug>` for a Simple Icons brand mark. */
  icon: string;
  keywords?: string[];
  defaults(): Omit<PromptElement, 'id' | 'type'>;
  fields: Field[];
  build(el: PromptElement, o: Record<string, any>, ctx: BuildCtx): Built;
  structural?: 'newline' | 'fill' | 'group' | 'group-end';
  /** Produces no visible text (e.g. the window title). */
  invisible?: boolean;
  /** Not offered in the element library (inserted along with another element). */
  hidden?: boolean;
  /** Needs a Nerd Font by default. */
  nerd?: boolean;
}

const lit = (s: string): Op => ({ t: 'lit', s });
const rsty = (o: Style | null): Op => ({ t: 'rsty', o });
const set = (v: VarRef): Cond => ({ k: 'set', v });
const gt = (v: VarRef, n = 0): Cond => ({ k: 'gt', v, n });
const fg = (c: ColorRef | null | undefined): Style | null => (c ? { fg: c } : null);

export const GIT_BRANCH_GLYPH = '\u{e0a0}';

const yes = (o: Record<string, unknown>, k: string) => o[k] === true;

function textOps(s: string | undefined): Op[] {
  return s ? [lit(s)] : [];
}

/** Git status indicator styles. */
export const GIT_STATUS_STYLES = {
  counts: { label: 'Counts  +1 ~2 ?3 ↑1', staged: '+', modified: '~', untracked: '?', conflicts: '!', ahead: '↑', behind: '↓', stash: '*', clean: '✓', counts: true, sep: ' ', wrap: ['', ''] },
  dots: { label: 'Dots  ●1✚2…3↑1', staged: '●', modified: '✚', untracked: '…', conflicts: '✖', ahead: '↑', behind: '↓', stash: '⚑', clean: '✔', counts: true, sep: '', wrap: ['', ''] },
  starship: { label: 'Starship  [!+?⇡]', staged: '+', modified: '!', untracked: '?', conflicts: '=', ahead: '⇡', behind: '⇣', stash: '$', clean: '', counts: false, sep: '', wrap: ['[', ']'] },
  arrows: { label: 'Pure  *⇡⇣', staged: '*', modified: '*', untracked: '*', conflicts: '*', ahead: '⇡', behind: '⇣', stash: '', clean: '', counts: false, sep: '', wrap: ['', ''] },
} as const;

export type GitStatusStyle = keyof typeof GIT_STATUS_STYLES;

const GIT_PARTS = ['conflicts', 'staged', 'modified', 'untracked', 'stash', 'ahead', 'behind'] as const;

const GIT_PART_COLORS: Record<(typeof GIT_PARTS)[number] | 'clean', ColorRef> = {
  staged: tok('green'),
  modified: tok('peach'),
  untracked: tok('overlay1'),
  conflicts: tok('red'),
  ahead: tok('sky'),
  behind: tok('sky'),
  stash: tok('mauve'),
  clean: tok('green'),
};

const CWD_DEFAULTS: CwdOpts = {
  mode: 'full',
  depth: 3,
  ellipsis: '…',
  keepHome: true,
  fish: false,
  fishLen: 1,
  home: '~',
  sep: '/',
};

const TIME_FORMATS: Record<string, { label: string; esc?: 'time24' | 'time12' | 'timeAmPm' | 'time24short'; fmt?: string }> = {
  '24': { label: '24-hour  13:02:28', esc: 'time24' },
  '24s': { label: '24-hour  13:02', esc: 'time24short' },
  '12': { label: '12-hour  01:02:28', esc: 'time12' },
  ampm: { label: 'am/pm  01:02 PM', esc: 'timeAmPm' },
  zone: { label: 'With zone  13:02:28 EDT', fmt: '%H:%M:%S %Z' },
  custom: { label: 'Custom strftime…' },
};

const DATE_FORMATS: Record<string, { label: string; fmt?: string }> = {
  default: { label: 'Tue Oct 06' },
  long: { label: 'Tuesday, October 06, 2026', fmt: '%A, %B %d, %Y' },
  iso: { label: '2026-10-06', fmt: '%Y-%m-%d' },
  us: { label: '10/06/26', fmt: '%m/%d/%y' },
  dm: { label: '06 Oct', fmt: '%d %b' },
  custom: { label: 'Custom strftime…' },
};

const optionsOf = (o: Record<string, { label: string }>) => Object.entries(o).map(([value, v]) => ({ value, label: v.label }));

// ── definitions ──────────────────────────────────────────────────────────────

const DEFS: ElementDef[] = [
  // basics
  {
    type: 'text',
    name: 'Text',
    description: 'Any literal text: brackets, separators, words.',
    category: 'basics',
    icon: 'Type',
    keywords: ['literal', 'string', 'bracket', 'space'],
    defaults: () => ({ options: { text: 'text' }, style: { fg: tok('text') } }),
    fields: [{ k: 'glyph', key: 'text', label: 'Text' }],
    build: (_el, o) => ({ ops: textOps(String(o.text ?? '')) }),
  },
  {
    type: 'symbol',
    name: 'Symbol',
    description: 'A glyph, emoji or Nerd Font icon.',
    category: 'basics',
    icon: 'Sparkles',
    keywords: ['icon', 'emoji', 'glyph', 'nerd', 'arrow', 'chevron'],
    defaults: () => ({ options: { char: '❯' }, style: { fg: tok('mauve') } }),
    fields: [{ k: 'glyph', key: 'char', label: 'Symbol' }],
    build: (_el, o) => ({ ops: textOps(String(o.char ?? '')) }),
  },
  {
    type: 'newline',
    name: 'New line',
    description: 'Start a new line of the prompt.',
    category: 'basics',
    icon: 'CornerDownLeft',
    keywords: ['line break', 'multi-line', 'two-line'],
    defaults: () => ({}),
    fields: [],
    build: () => ({ ops: [] }),
    structural: 'newline',
  },
  {
    type: 'fill',
    name: 'Fill',
    description: 'Stretch to the terminal width. Anything after it is right-aligned.',
    category: 'basics',
    icon: 'MoveHorizontal',
    keywords: ['right align', 'rprompt', 'rule', 'line', 'spacer', 'stretch'],
    defaults: () => ({ options: { char: '─' }, style: { fg: tok('surface2') } }),
    fields: [
      {
        k: 'glyph',
        key: 'char',
        label: 'Fill character',
        help: 'A space right-aligns quietly; ─ or ═ draws a rule. On the last line the fill becomes a right prompt.',
      },
    ],
    build: () => ({ ops: [] }),
    structural: 'fill',
  },
  {
    type: 'prompt-char',
    name: 'Prompt character',
    description: 'The character before your cursor. Changes for root and after errors.',
    category: 'basics',
    icon: 'ChevronRight',
    keywords: ['$', '#', 'arrow', 'caret', 'lambda', 'character'],
    defaults: () => ({
      options: { char: '❯', rootChar: '#', errorChar: '' },
      style: { fg: tok('green'), bold: true },
      errorStyle: { fg: tok('red') },
    }),
    fields: [
      { k: 'glyph', key: 'char', label: 'Character', help: 'Use $ for bash\'s own \\$ (shows # for root).' },
      { k: 'glyph', key: 'rootChar', label: 'As root', placeholder: 'same' },
      { k: 'glyph', key: 'errorChar', label: 'After an error', placeholder: 'same' },
    ],
    build(_el, o) {
      const ch = String(o.char ?? '❯');
      const root = String(o.rootChar ?? '');
      const err = String(o.errorChar ?? '');
      let ops: Op[];
      if (ch === '$' && (root === '#' || root === '')) ops = [{ t: 'esc', e: 'dollar' }];
      else if (root && root !== ch) ops = [{ t: 'if', c: { k: 'root' }, then: [lit(root)], else: [lit(ch)] }];
      else ops = [lit(ch)];
      if (err && err !== ch) ops = [{ t: 'if', c: { k: 'err' }, then: [lit(err)], else: ops }];
      return { ops };
    },
  },

  {
    type: 'group',
    name: 'Group',
    description: 'Wraps the elements up to its end marker. Hidden when they all are, and spaces them out.',
    category: 'basics',
    icon: 'Brackets',
    keywords: ['brackets', 'conditional', 'spacing', 'wrap', 'parentheses', 'braces'],
    defaults: () => ({ options: { open: '[', close: ']', sep: ' ' }, style: { fg: tok('overlay2') } }),
    fields: [
      { k: 'glyph', key: 'open', label: 'Opening text', placeholder: 'none' },
      { k: 'glyph', key: 'close', label: 'Closing text', placeholder: 'none' },
      { k: 'glyph', key: 'sep', label: 'Between members', placeholder: 'nothing', help: 'Placed only between members that are showing.' },
    ],
    build: () => ({ ops: [] }),
    structural: 'group',
  },
  {
    type: 'group-end',
    name: 'Group end',
    description: 'Where the group closes.',
    category: 'basics',
    icon: 'Brackets',
    defaults: () => ({}),
    fields: [],
    build: () => ({ ops: [] }),
    structural: 'group-end',
    hidden: true,
  },

  // identity
  {
    type: 'user',
    name: 'Username',
    description: 'Who you are logged in as (\\u). Turns red for root.',
    category: 'identity',
    icon: 'User',
    keywords: ['whoami', 'login', '\\u'],
    defaults: () => ({ style: { fg: tok('green') }, rootStyle: { fg: tok('red'), bold: true } }),
    fields: [],
    build: () => ({ ops: [{ t: 'esc', e: 'user' }] }),
  },
  {
    type: 'host',
    name: 'Hostname',
    description: 'The machine name (\\h), optionally only over SSH.',
    category: 'identity',
    icon: 'Server',
    keywords: ['machine', 'computer', '\\h', '\\H', 'fqdn'],
    defaults: () => ({ options: { full: false, onlySsh: false }, style: { fg: tok('teal') } }),
    fields: [
      { k: 'toggle', key: 'full', label: 'Full name (FQDN)' },
      { k: 'toggle', key: 'onlySsh', label: 'Only over SSH' },
    ],
    build: (_el, o) => ({
      ops: [{ t: 'esc', e: yes(o, 'full') ? 'hostFull' : 'host' }],
      cond: yes(o, 'onlySsh') ? { k: 'ssh' } : undefined,
    }),
  },
  {
    type: 'ssh',
    name: 'SSH indicator',
    description: 'Shown only in SSH sessions.',
    category: 'identity',
    icon: 'Network',
    keywords: ['remote', 'session'],
    defaults: () => ({ options: { text: 'ssh' }, style: { fg: tok('peach') } }),
    fields: [{ k: 'glyph', key: 'text', label: 'Text' }],
    build: (_el, o) => ({ ops: textOps(String(o.text ?? 'ssh')), cond: { k: 'ssh' } }),
  },
  {
    type: 'os',
    name: 'Operating system',
    description: 'Distro name or icon, read once from /etc/os-release.',
    category: 'identity',
    icon: 'si:linux',
    keywords: ['distro', 'rhel', 'rocky', 'ubuntu', 'fedora', 'macos', 'os-release'],
    defaults: () => ({ options: { show: 'label' }, style: { fg: tok('mauve') } }),
    fields: [
      {
        k: 'select',
        key: 'show',
        label: 'Show',
        options: [
          { value: 'label', label: 'Name + version  (Rocky Linux 9.6)' },
          { value: 'name', label: 'Name  (Rocky Linux)' },
          { value: 'pretty', label: 'Pretty name' },
          { value: 'id', label: 'ID  (rocky)' },
          { value: 'icon', label: 'Icon (Nerd Font)' },
          { value: 'icon-label', label: 'Icon + name + version' },
        ],
      },
    ],
    build(_el, o, ctx) {
      const show = String(o.show ?? 'label');
      const v = ctx.use(osProvider(OS_ICONS, show.startsWith('icon')));
      if (show === 'icon') return { ops: [{ t: 'var', v: v('icon') }] };
      if (show === 'icon-label') return { ops: [{ t: 'var', v: v('icon') }, lit(' '), { t: 'var', v: v('label') }] };
      return { ops: [{ t: 'var', v: v(show) }], cond: set(v(show)) };
    },
  },
  {
    type: 'container',
    name: 'Container',
    description: 'Shown inside Docker, Podman or toolbox containers.',
    category: 'identity',
    icon: 'Box',
    keywords: ['docker', 'podman', 'toolbox', 'distrobox'],
    defaults: () => ({ options: { text: '' }, prefix: '⬢ ', style: { fg: tok('sky') } }),
    fields: [{ k: 'glyph', key: 'text', label: 'Text', placeholder: 'container type' }],
    build(_el, o, ctx) {
      const v = ctx.use(containerProvider);
      const text = String(o.text ?? '');
      return { ops: text ? [lit(text)] : [{ t: 'var', v: v('kind') }], cond: set(v('kind')) };
    },
  },
  {
    type: 'shlvl',
    name: 'Shell level',
    description: 'Nesting depth ($SHLVL) when you are in a sub-shell.',
    category: 'identity',
    icon: 'Layers',
    keywords: ['subshell', 'nested', 'SHLVL'],
    defaults: () => ({ options: { min: 2 }, prefix: '↕', style: { fg: tok('overlay2') } }),
    fields: [{ k: 'number', key: 'min', label: 'Show from level', min: 1, max: 9 }],
    build(_el, o, ctx) {
      const v = ctx.use(shlvlProvider);
      return { ops: [{ t: 'var', v: v('n') }], cond: gt(v('n'), Math.max(0, Number(o.min ?? 2) - 1)) };
    },
  },
  {
    type: 'tty',
    name: 'Terminal device',
    description: 'Basename of the tty (\\l).',
    category: 'identity',
    icon: 'TerminalSquare',
    keywords: ['tty', 'pts', '\\l'],
    defaults: () => ({ style: { fg: tok('overlay1') } }),
    fields: [],
    build: () => ({ ops: [{ t: 'esc', e: 'tty' }] }),
  },
  {
    type: 'shell',
    name: 'Shell',
    description: 'Shell name or version (\\s, \\v, \\V).',
    category: 'identity',
    icon: 'si:gnubash',
    keywords: ['bash', 'version', '\\s', '\\v'],
    defaults: () => ({ options: { show: 'name' }, style: { fg: tok('overlay2') } }),
    fields: [
      {
        k: 'select',
        key: 'show',
        label: 'Show',
        options: [
          { value: 'name', label: 'Name  (bash)' },
          { value: 'version', label: 'Version  (5.3)' },
          { value: 'release', label: 'Release  (5.3.3)' },
        ],
      },
    ],
    build: (_el, o) => ({
      ops: [{ t: 'esc', e: o.show === 'version' ? 'version' : o.show === 'release' ? 'release' : 'shell' }],
    }),
  },

  // path
  {
    type: 'cwd',
    name: 'Directory',
    description: 'Where you are. Full, trimmed, fish-style or relative to the repo.',
    category: 'path',
    icon: 'FolderOpen',
    keywords: ['pwd', 'path', 'folder', '\\w', '\\W', 'cwd'],
    defaults: () => ({ options: { ...CWD_DEFAULTS, readonly: '', readonlyColor: tok('red') }, style: { fg: tok('blue'), bold: true } }),
    fields: [
      {
        k: 'select',
        key: 'mode',
        label: 'Show',
        options: [
          { value: 'full', label: 'Full path  ~/projects/bashin/src' },
          { value: 'trim', label: 'Last N directories  ~/…/bashin/src' },
          { value: 'base', label: 'Current folder only  src' },
          { value: 'repo', label: 'From repo root  bashin/src' },
        ],
      },
      { k: 'number', key: 'depth', label: 'Directories to keep', min: 1, max: 8, when: (o) => o.mode === 'trim' },
      { k: 'toggle', key: 'keepHome', label: 'Keep ~ when trimmed', when: (o) => o.mode === 'trim' },
      { k: 'glyph', key: 'ellipsis', label: 'Ellipsis', when: (o) => o.mode === 'trim' },
      { k: 'toggle', key: 'fish', label: 'Abbreviate parents (fish-style)', when: (o) => o.mode !== 'base' },
      { k: 'number', key: 'fishLen', label: 'Letters per parent', min: 1, max: 4, when: (o) => o.fish === true && o.mode !== 'base' },
      { k: 'glyph', key: 'home', label: 'Home symbol', help: '~ by default; try ⌂ or a Nerd Font house.' },
      { k: 'glyph', key: 'sep', label: 'Separator', help: '/ by default; try " › " or "  ".' },
      { k: 'glyph', key: 'readonly', label: 'Read-only marker', placeholder: 'none', help: 'Appended when you cannot write to the directory, e.g. 🔒 or a lock icon.' },
      { k: 'color', key: 'readonlyColor', label: 'Marker color', when: (o) => !!o.readonly },
    ],
    build(_el, o, ctx) {
      const opts: CwdOpts = {
        mode: (['full', 'base', 'trim', 'repo'].includes(String(o.mode)) ? o.mode : 'full') as CwdOpts['mode'],
        depth: Number(o.depth ?? 3),
        ellipsis: String(o.ellipsis ?? '…') || '…',
        keepHome: o.keepHome !== false,
        fish: o.fish === true,
        fishLen: Number(o.fishLen ?? 1),
        home: String(o.home ?? '~') || '~',
        sep: String(o.sep ?? '/') || '/',
      };
      const native = nativeCwd(opts);
      let ops: Op[];
      if (native) ops = [{ t: 'esc', e: native }];
      else {
        const git = opts.mode === 'repo' ? gitProvider({ status: false, untracked: false, timeout: 2 }) : null;
        if (git) ctx.use(git);
        const v = ctx.use(cwdProvider(opts, git));
        ops = [{ t: 'var', v: v('path') }];
      }
      const ro = String(o.readonly ?? '');
      if (ro) {
        const w = ctx.use(writableProvider);
        ops.push({ t: 'if', c: set(w('ro')), then: [rsty(fg(o.readonlyColor as ColorRef)), lit(ro)] });
      }
      return { ops };
    },
  },

  // time
  {
    type: 'time',
    name: 'Time',
    description: 'The clock when the prompt was drawn.',
    category: 'time',
    icon: 'Clock',
    keywords: ['clock', 'hour', '\\t', '\\T', '\\@', '\\A'],
    defaults: () => ({ options: { format: '24', custom: '%H:%M:%S' }, style: { fg: tok('sky') } }),
    fields: [
      { k: 'select', key: 'format', label: 'Format', options: optionsOf(TIME_FORMATS) },
      { k: 'text', key: 'custom', label: 'strftime format', mono: true, when: (o) => o.format === 'custom', help: '%H:%M:%S, %I:%M %p, %T %Z …' },
    ],
    build(_el, o) {
      const f = TIME_FORMATS[String(o.format)] ?? TIME_FORMATS['24'];
      if (f.esc) return { ops: [{ t: 'esc', e: f.esc }] };
      return { ops: [{ t: 'esc', e: 'strftime', fmt: f.fmt ?? String(o.custom ?? '%H:%M:%S') }] };
    },
  },
  {
    type: 'date',
    name: 'Date',
    description: 'Today\'s date in any strftime format.',
    category: 'time',
    icon: 'Calendar',
    keywords: ['day', 'calendar', '\\d', '\\D'],
    defaults: () => ({ options: { format: 'default', custom: '%Y-%m-%d' }, style: { fg: tok('peach') } }),
    fields: [
      { k: 'select', key: 'format', label: 'Format', options: optionsOf(DATE_FORMATS) },
      { k: 'text', key: 'custom', label: 'strftime format', mono: true, when: (o) => o.format === 'custom' },
    ],
    build(_el, o) {
      const key = String(o.format ?? 'default');
      if (key === 'default') return { ops: [{ t: 'esc', e: 'date' }] };
      const f = DATE_FORMATS[key] ?? DATE_FORMATS.iso;
      return { ops: [{ t: 'esc', e: 'strftime', fmt: f.fmt ?? String(o.custom ?? '%Y-%m-%d') }] };
    },
  },

  // status
  {
    type: 'exit-code',
    name: 'Exit status',
    description: 'How the last command ended: ✓, or ✗ with its code or signal.',
    category: 'status',
    icon: 'CircleCheck',
    keywords: ['$?', 'return code', 'error', 'status', 'signal'],
    defaults: () => ({
      options: { mode: 'error', format: 'code', errorSymbol: '✗', successSymbol: '✓' },
      style: { fg: tok('green') },
      errorStyle: { fg: tok('red') },
    }),
    fields: [
      {
        k: 'select',
        key: 'mode',
        label: 'Show',
        options: [
          { value: 'error', label: 'Only after a failure' },
          { value: 'always', label: 'Always' },
        ],
      },
      {
        k: 'select',
        key: 'format',
        label: 'Error detail',
        options: [
          { value: 'code', label: 'Exit code  ✗127' },
          { value: 'name', label: 'Signal name  ✗INT, ✗NOTFOUND' },
          { value: 'none', label: 'Symbol only  ✗' },
        ],
      },
      { k: 'glyph', key: 'errorSymbol', label: 'Error symbol', placeholder: 'none' },
      { k: 'glyph', key: 'successSymbol', label: 'Success symbol', when: (o) => o.mode === 'always' },
    ],
    build(_el, o, ctx) {
      const v = ctx.use(rcProvider);
      const fmt = String(o.format ?? 'code');
      const err: Op[] = [...textOps(String(o.errorSymbol ?? '✗'))];
      if (fmt === 'code') err.push({ t: 'var', v: v('code') });
      else if (fmt === 'name') err.push({ t: 'var', v: v('name') });
      if (o.mode === 'always') {
        return { ops: [{ t: 'if', c: { k: 'err' }, then: err, else: textOps(String(o.successSymbol ?? '✓')) }] };
      }
      return { ops: err, cond: { k: 'err' } };
    },
  },
  {
    type: 'duration',
    name: 'Command duration',
    description: 'How long the last command took, when it was slow.',
    category: 'status',
    icon: 'Timer',
    keywords: ['took', 'elapsed', 'time', 'cmd_duration', 'stopwatch'],
    defaults: () => ({ options: { threshold: 2000, format: 'human' }, prefix: 'took ', style: { fg: tok('yellow') } }),
    fields: [
      { k: 'number', key: 'threshold', label: 'Show after', min: 0, max: 600000, step: 100, unit: 'ms' },
      {
        k: 'select',
        key: 'format',
        label: 'Format',
        options: [
          { value: 'human', label: 'Human  4.8s · 1m12s' },
          { value: 'seconds', label: 'Seconds  4s' },
          { value: 'ms', label: 'Milliseconds  4870ms' },
        ],
      },
    ],
    build(_el, o, ctx) {
      const v = ctx.use(
        durationProvider({ threshold: Number(o.threshold ?? 2000), format: (o.format as 'human') ?? 'human' }),
      );
      return { ops: [{ t: 'var', v: v('text') }], cond: set(v('text')) };
    },
  },
  {
    type: 'jobs',
    name: 'Background jobs',
    description: 'How many jobs are suspended or running in the background.',
    category: 'status',
    icon: 'ListTodo',
    keywords: ['\\j', 'bg', 'fg', 'suspended'],
    defaults: () => ({ options: { symbol: '✦', count: true, min: 1 }, style: { fg: tok('yellow') } }),
    fields: [
      { k: 'glyph', key: 'symbol', label: 'Symbol' },
      { k: 'toggle', key: 'count', label: 'Show the count' },
      { k: 'number', key: 'min', label: 'Show from', min: 0, max: 9, help: '0 = always' },
    ],
    build(_el, o, ctx) {
      const v = ctx.use(jobsProvider);
      const ops: Op[] = [...textOps(String(o.symbol ?? ''))];
      if (o.count !== false) ops.push({ t: 'var', v: v('n') });
      const min = Number(o.min ?? 1);
      return { ops, cond: min > 0 ? gt(v('n'), min - 1) : undefined };
    },
  },
  {
    type: 'history',
    name: 'History number',
    description: 'Position of this command in history (\\!) — handy with !N.',
    category: 'status',
    icon: 'History',
    keywords: ['\\!', 'history'],
    defaults: () => ({ prefix: '!', style: { fg: tok('overlay1') } }),
    fields: [],
    build: () => ({ ops: [{ t: 'esc', e: 'history' }] }),
  },
  {
    type: 'cmd-number',
    name: 'Command number',
    description: 'Commands run in this shell so far (\\#).',
    category: 'status',
    icon: 'Hash',
    keywords: ['\\#', 'count'],
    defaults: () => ({ prefix: '#', style: { fg: tok('overlay1') } }),
    fields: [],
    build: () => ({ ops: [{ t: 'esc', e: 'cmdno' }] }),
  },

  // git
  {
    type: 'git-branch',
    name: 'Git branch',
    description: 'Current branch, detached commit and rebase/merge state. Read from .git — no fork.',
    category: 'git',
    icon: 'GitBranch',
    keywords: ['git', 'branch', 'vcs', 'rebase', 'merge', 'HEAD'],
    defaults: () => ({ options: { icon: GIT_BRANCH_GLYPH + ' ', showOp: true, detached: '@' }, style: { fg: tok('pink') } }),
    fields: [
      { k: 'glyph', key: 'icon', label: 'Icon', placeholder: 'none' },
      { k: 'glyph', key: 'detached', label: 'Detached HEAD prefix' },
      { k: 'toggle', key: 'showOp', label: 'Show REBASE / MERGE / BISECT…' },
    ],
    build(_el, o, ctx) {
      const v = ctx.use(gitProvider({ status: false, untracked: false, timeout: 2 }));
      const ops: Op[] = [...textOps(String(o.icon ?? ''))];
      const det = String(o.detached ?? '@');
      if (det) ops.push({ t: 'if', c: set(v('detached')), then: [lit(det)] });
      ops.push({ t: 'var', v: v('branch') });
      if (o.showOp !== false) ops.push({ t: 'if', c: set(v('op')), then: [lit('|'), { t: 'var', v: v('op') }] });
      return { ops, cond: set(v('branch')) };
    },
  },
  {
    type: 'git-status',
    name: 'Git status',
    description: 'Staged, modified, untracked, conflicts, ahead/behind and stash — one bounded git status.',
    category: 'git',
    icon: 'GitCompareArrows',
    keywords: ['git', 'dirty', 'changes', 'ahead', 'behind', 'stash', 'untracked'],
    defaults: () => ({
      options: { style: 'counts', colorize: true, untracked: true, stash: true, aheadBehind: true, clean: true },
      style: { fg: tok('peach') },
    }),
    fields: [
      { k: 'select', key: 'style', label: 'Style', options: optionsOf(GIT_STATUS_STYLES) },
      { k: 'glyph', key: 'dirty', label: 'Dirty symbol', when: (o) => o.style === 'arrows', placeholder: '*' },
      { k: 'toggle', key: 'colorize', label: 'Color each indicator' },
      { k: 'toggle', key: 'untracked', label: 'Count untracked files', help: 'Off is faster in huge repos (git status -uno).' },
      { k: 'toggle', key: 'aheadBehind', label: 'Ahead / behind upstream' },
      { k: 'toggle', key: 'stash', label: 'Stash count' },
      { k: 'toggle', key: 'clean', label: 'Mark clean trees' },
    ],
    build(_el, o, ctx) {
      const styleKey = (String(o.style) in GIT_STATUS_STYLES ? o.style : 'counts') as GitStatusStyle;
      const S = GIT_STATUS_STYLES[styleKey];
      const v = ctx.use(gitProvider({ status: true, untracked: o.untracked !== false, timeout: 2 }));
      const colorize = o.colorize !== false;
      const color = (k: keyof typeof GIT_PART_COLORS): Op[] => (colorize ? [rsty({ fg: GIT_PART_COLORS[k] })] : []);
      const parts = GIT_PARTS.filter((p) => {
        if (p === 'untracked') return o.untracked !== false;
        if (p === 'stash') return o.stash !== false && S.stash !== '';
        if (p === 'ahead' || p === 'behind') return o.aheadBehind !== false;
        return true;
      });
      const dirty: Cond = { k: 'or', c: parts.map((p) => gt(v(p))) };
      let body: Op[];
      if (styleKey === 'arrows') {
        // Pure: one * for any local change, then ⇡⇣
        const local = (['staged', 'modified', 'untracked', 'conflicts'] as const).filter((p) => parts.includes(p));
        const items = [
          { c: { k: 'or', c: local.map((p) => gt(v(p))) } as Cond, ops: [...color('modified'), lit(String(o.dirty || '*'))] },
          ...(['ahead', 'behind'] as const)
            .filter((p) => parts.includes(p))
            .map((p) => ({ c: gt(v(p)), ops: [...color(p), lit(S[p])] })),
        ];
        body = [{ t: 'join', sep: '', items }];
      } else {
        const items = parts.map((p) => ({
          c: gt(v(p)),
          ops: [...color(p), lit(S[p]), ...(S.counts ? [{ t: 'var', v: v(p) } as Op] : [])],
        }));
        body = [{ t: 'join', sep: S.sep, items }];
        if (S.wrap[0] || S.wrap[1]) body = [{ t: 'if', c: dirty, then: [rsty(null), lit(S.wrap[0]), ...body, rsty(null), lit(S.wrap[1])] }];
      }
      const ops: Op[] = [...body];
      if (o.clean !== false && S.clean) {
        ops.push({
          t: 'if',
          c: { k: 'and', c: [set(v('known')), { k: 'not', c: dirty }] },
          then: [...color('clean'), lit(S.clean)],
        });
        return { ops, cond: set(v('known')) };
      }
      return { ops, cond: { k: 'and', c: [set(v('known')), dirty] } };
    },
  },

  // dev context
  {
    type: 'venv',
    name: 'Python env',
    description: 'Active virtualenv or conda environment.',
    category: 'dev',
    icon: 'si:python',
    keywords: ['python', 'virtualenv', 'venv', 'conda', 'pyenv', 'poetry'],
    defaults: () => ({ options: { genericParent: true }, prefix: '(', suffix: ')', style: { fg: tok('mauve') } }),
    fields: [
      {
        k: 'toggle',
        key: 'genericParent',
        label: 'Name .venv after its project',
        help: 'A venv called .venv or venv shows its parent folder instead.',
      },
    ],
    build(_el, o, ctx) {
      const v = ctx.use(venvProvider(o.genericParent !== false));
      return { ops: [{ t: 'var', v: v('name') }], cond: set(v('name')) };
    },
  },
  {
    type: 'node',
    name: 'Node.js',
    description: 'Node version, in directories with a package.json.',
    category: 'dev',
    icon: 'si:nodedotjs',
    keywords: ['node', 'npm', 'javascript', 'nvm'],
    defaults: () => ({ prefix: '⬢ ', style: { fg: tok('green') } }),
    fields: [],
    build(_el, _o, ctx) {
      const v = ctx.use(nodeProvider);
      return { ops: [{ t: 'var', v: v('ver') }], cond: set(v('ver')) };
    },
  },
  {
    type: 'k8s',
    name: 'Kubernetes',
    description: 'Current kube context, read from your kubeconfig — no kubectl fork.',
    category: 'dev',
    icon: 'si:kubernetes',
    keywords: ['kubectl', 'context', 'cluster', 'k8s'],
    defaults: () => ({ prefix: '☸ ', style: { fg: tok('blue') } }),
    fields: [],
    build(_el, _o, ctx) {
      const v = ctx.use(k8sProvider);
      return { ops: [{ t: 'var', v: v('ctx') }], cond: set(v('ctx')) };
    },
  },
  {
    type: 'aws',
    name: 'AWS profile',
    description: '$AWS_PROFILE / aws-vault, optionally with the region.',
    category: 'dev',
    icon: 'Cloud',
    keywords: ['amazon', 'cloud', 'profile', 'region', 'aws-vault'],
    defaults: () => ({ options: { region: false }, prefix: '☁ ', style: { fg: tok('peach') } }),
    fields: [{ k: 'toggle', key: 'region', label: 'Show region' }],
    build(_el, o, ctx) {
      const v = ctx.use(awsProvider);
      const ops: Op[] = [{ t: 'var', v: v('profile') }];
      if (yes(o, 'region')) ops.push({ t: 'if', c: set(v('region')), then: [lit('@'), { t: 'var', v: v('region') }] });
      return { ops, cond: set(v('profile')) };
    },
  },
  {
    type: 'docker',
    name: 'Docker context',
    description: 'Non-default Docker context.',
    category: 'dev',
    icon: 'si:docker',
    keywords: ['docker', 'context', 'colima', 'container'],
    defaults: () => ({ prefix: 'docker:', style: { fg: tok('sapphire') } }),
    fields: [],
    build(_el, _o, ctx) {
      const v = ctx.use(dockerProvider);
      return { ops: [{ t: 'var', v: v('ctx') }], cond: set(v('ctx')) };
    },
  },
  {
    type: 'terraform',
    name: 'Terraform workspace',
    description: 'Workspace of the Terraform project in this directory.',
    category: 'dev',
    icon: 'si:terraform',
    keywords: ['terraform', 'tofu', 'workspace', 'iac'],
    defaults: () => ({ prefix: 'tf:', style: { fg: tok('mauve') } }),
    fields: [],
    build(_el, _o, ctx) {
      const v = ctx.use(terraformProvider);
      return { ops: [{ t: 'var', v: v('ws') }], cond: set(v('ws')) };
    },
  },
  {
    type: 'nix',
    name: 'Nix shell',
    description: 'Shown inside nix-shell / nix develop.',
    category: 'dev',
    icon: 'si:nixos',
    keywords: ['nix', 'flake', 'devshell'],
    defaults: () => ({ prefix: '❄ ', style: { fg: tok('sapphire') } }),
    fields: [],
    build(_el, _o, ctx) {
      const v = ctx.use(nixProvider);
      return { ops: [{ t: 'var', v: v('shell') }], cond: set(v('shell')) };
    },
  },
  {
    type: 'tmux',
    name: 'tmux session',
    description: 'Session name when running inside tmux.',
    category: 'dev',
    icon: 'si:tmux',
    keywords: ['tmux', 'multiplexer', 'session'],
    defaults: () => ({ prefix: 'tmux:', style: { fg: tok('sky') } }),
    fields: [],
    build(_el, _o, ctx) {
      const v = ctx.use(tmuxProvider);
      return { ops: [{ t: 'var', v: v('session') }], cond: set(v('session')) };
    },
  },

  // system
  {
    type: 'load',
    name: 'Load average',
    description: '1-minute load average.',
    category: 'system',
    icon: 'Gauge',
    keywords: ['cpu', 'load', 'uptime'],
    defaults: () => ({ prefix: 'load ', style: { fg: tok('peach') } }),
    fields: [],
    build(_el, _o, ctx) {
      const v = ctx.use(loadProvider);
      return { ops: [{ t: 'var', v: v('l1') }], cond: set(v('l1')) };
    },
  },
  {
    type: 'ip',
    name: 'IP address',
    description: 'Primary IPv4 address.',
    category: 'system',
    icon: 'Wifi',
    keywords: ['network', 'address', 'ipv4', 'lan'],
    defaults: () => ({ options: { everyPrompt: false }, style: { fg: tok('sky') } }),
    fields: [{ k: 'toggle', key: 'everyPrompt', label: 'Refresh on every prompt', help: 'Off looks it up once per shell.' }],
    build(_el, o, ctx) {
      const v = ctx.use(ipProvider(yes(o, 'everyPrompt')));
      return { ops: [{ t: 'var', v: v('addr') }], cond: set(v('addr')) };
    },
  },

  // advanced
  {
    type: 'env',
    name: 'Environment variable',
    description: 'Any variable, hidden while it is empty.',
    category: 'advanced',
    icon: 'Variable',
    keywords: ['$', 'variable', 'export', 'env'],
    defaults: () => ({ options: { name: 'STAGE', sample: 'staging' }, prefix: '[', suffix: ']', style: { fg: tok('lavender') } }),
    fields: [
      { k: 'text', key: 'name', label: 'Variable', mono: true, placeholder: 'AWS_PROFILE' },
      { k: 'text', key: 'sample', label: 'Preview value' },
    ],
    build(_el, o, ctx) {
      const v = ctx.use(envProvider(String(o.name ?? ''), String(o.sample ?? '')));
      return { ops: [{ t: 'var', v: v('value') }], cond: set(v('value')) };
    },
  },
  {
    type: 'command',
    name: 'Command output',
    description: 'First line of a command, run on every prompt.',
    category: 'advanced',
    icon: 'SquareTerminal',
    keywords: ['$(…)', 'subshell', 'custom', 'script'],
    defaults: () => ({ options: { cmd: 'date +%s', sample: '1791306148' }, style: { fg: tok('lavender') } }),
    fields: [
      { k: 'text', key: 'cmd', label: 'Command', mono: true, help: 'Runs in a subshell before every prompt — keep it fast.' },
      { k: 'text', key: 'sample', label: 'Preview output' },
    ],
    build(_el, o, ctx) {
      const v = ctx.use(commandProvider(String(o.cmd ?? ''), String(o.sample ?? '')));
      return { ops: [{ t: 'var', v: v('out') }], cond: set(v('out')) };
    },
  },
  {
    type: 'title',
    name: 'Window title',
    description: 'Sets the terminal tab/window title. Draws nothing in the prompt.',
    category: 'advanced',
    icon: 'AppWindow',
    keywords: ['title', 'tab', 'OSC', 'xterm'],
    defaults: () => ({ options: { format: 'user-host-cwd', text: '' } }),
    fields: [
      {
        k: 'select',
        key: 'format',
        label: 'Title',
        options: [
          { value: 'user-host-cwd', label: 'user@host: ~/path' },
          { value: 'cwd', label: '~/path' },
          { value: 'host', label: 'host' },
          { value: 'text', label: 'Custom text' },
        ],
      },
      { k: 'text', key: 'text', label: 'Text', when: (o) => o.format === 'text' },
    ],
    build(_el, o) {
      const f = String(o.format ?? 'user-host-cwd');
      let body: Op[];
      if (f === 'cwd') body = [{ t: 'esc', e: 'cwd' }];
      else if (f === 'host') body = [{ t: 'esc', e: 'host' }];
      else if (f === 'text') body = [lit(String(o.text ?? '').replace(/[\x00-\x1f\x7f]/g, ''))];
      else body = [{ t: 'esc', e: 'user' }, lit('@'), { t: 'esc', e: 'host' }, lit(': '), { t: 'esc', e: 'cwd' }];
      return { ops: [{ t: 'title', body }] };
    },
    invisible: true,
  },
];

export const ELEMENTS: Record<ElementType, ElementDef> = Object.fromEntries(DEFS.map((d) => [d.type, d])) as Record<
  ElementType,
  ElementDef
>;

export const ELEMENT_LIST = DEFS;

export function getDef(type: ElementType): ElementDef {
  return ELEMENTS[type] ?? ELEMENTS.text;
}

/** Options merged over the element's defaults. */
export function optionsWithDefaults(el: PromptElement): Record<string, any> {
  return { ...(getDef(el.type).defaults().options ?? {}), ...(el.options ?? {}) };
}
