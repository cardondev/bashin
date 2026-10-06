/**
 * The persisted prompt document: what the editor edits, what share links and
 * saved prompts store, and what the compiler turns into shell code.
 */
import type { TokenName } from '../data/palette-types';

export type ColorRef =
  | { t: 'token'; v: TokenName }
  /** Terminal ANSI color 0–15 — follows the user's terminal theme. */
  | { t: 'ansi'; v: number }
  /** xterm-256 index 16–255. */
  | { t: 'x256'; v: number }
  | { t: 'hex'; v: string };

export interface Style {
  fg?: ColorRef | null;
  bg?: ColorRef | null;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  blink?: boolean;
  reverse?: boolean;
  strike?: boolean;
  overline?: boolean;
}

export const ATTRS = ['bold', 'dim', 'italic', 'underline', 'blink', 'reverse', 'strike', 'overline'] as const;
export type Attr = (typeof ATTRS)[number];

/** When an element is shown. */
export type Visibility = 'always' | 'error' | 'success' | 'root' | 'user' | 'ssh' | 'local';

export type ElementType =
  | 'text'
  | 'symbol'
  | 'newline'
  | 'fill'
  | 'prompt-char'
  | 'user'
  | 'host'
  | 'ssh'
  | 'os'
  | 'container'
  | 'shlvl'
  | 'tty'
  | 'shell'
  | 'cwd'
  | 'time'
  | 'date'
  | 'exit-code'
  | 'duration'
  | 'jobs'
  | 'history'
  | 'cmd-number'
  | 'git-branch'
  | 'git-status'
  | 'venv'
  | 'node'
  | 'k8s'
  | 'aws'
  | 'docker'
  | 'terraform'
  | 'nix'
  | 'tmux'
  | 'load'
  | 'ip'
  | 'env'
  | 'command'
  | 'title'
  | 'group'
  | 'group-end';

export interface PromptElement {
  id: string;
  type: ElementType;
  options?: Record<string, unknown>;
  style?: Style;
  /** Overrides applied when the shell runs as root (EUID 0). */
  rootStyle?: Style;
  /** Overrides applied when the last command failed. */
  errorStyle?: Style;
  prefix?: string;
  suffix?: string;
  show?: Visibility;
  /** Kept in the document but not rendered. */
  disabled?: boolean;
}

export type SeparatorStyle =
  | 'none'
  | 'powerline'
  | 'capsule'
  | 'round'
  | 'slant'
  | 'backslant'
  | 'flame'
  | 'pixel'
  | 'ice'
  | 'blocks';

export type ColorDepth = 'truecolor' | '256' | '16' | 'auto';

export interface PromptSettings {
  /** Palette used to resolve color tokens (and to theme the preview). */
  palette: string;
  depth: ColorDepth;
  /** How elements with a background color are joined. */
  separator: SeparatorStyle;
  /** Spaces inside each powerline segment. */
  padding: number;
  /** Blank line between a command's output and the next prompt. */
  newlineBefore: boolean;
  /** Continuation prompt (PS2). */
  ps2: string;
  ps2Color?: ColorRef | null;
}

export interface PromptDoc {
  v: 1;
  name: string;
  elements: PromptElement[];
  settings: PromptSettings;
}

export const DEFAULT_SETTINGS: PromptSettings = {
  palette: 'catppuccin-mocha',
  depth: 'truecolor',
  separator: 'powerline',
  padding: 1,
  newlineBefore: false,
  ps2: '… ',
  ps2Color: { t: 'token', v: 'overlay1' },
};

export const tok = (v: TokenName): ColorRef => ({ t: 'token', v });

let counter = 0;
export function newId(): string {
  counter = (counter + 1) % 1e6;
  return `e${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
