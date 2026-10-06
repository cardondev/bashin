/**
 * Prompt IR — the compiled form of a prompt document.
 *
 * The compiler turns elements into a list of lines of ops. The preview
 * evaluates the ops in JavaScript against a scenario; the bash and zsh
 * generators translate the same ops into shell code. Keeping one IR for both
 * is what keeps the preview honest.
 */
import type { SeparatorStyle, Style } from './model';
import type { Provider } from './providers';

export type Color = { k: 'rgb'; r: number; g: number; b: number } | { k: 'idx'; i: number };

export interface SGR {
  fg?: Color;
  bg?: Color;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  blink?: boolean;
  reverse?: boolean;
  strike?: boolean;
  overline?: boolean;
}

/**
 * A style that may change at runtime: `b` base, `r` when root, `e` when the
 * last command failed, `re` both. Missing variants fall back towards `b`.
 */
export interface StyleChoice {
  b: SGR;
  r?: SGR;
  e?: SGR;
  re?: SGR;
}

/** Native prompt escapes (bash backslash escapes / zsh percent escapes). */
export type Esc =
  | 'user'
  | 'host'
  | 'hostFull'
  | 'cwd'
  | 'cwdBase'
  | 'time24'
  | 'time12'
  | 'timeAmPm'
  | 'time24short'
  | 'date'
  | 'strftime'
  | 'jobs'
  | 'history'
  | 'cmdno'
  | 'dollar'
  | 'shell'
  | 'version'
  | 'release'
  | 'tty';

/** A runtime value produced by a provider. */
export interface VarRef {
  /** Provider key. */
  p: string;
  /** Logical variable name within the provider. */
  n: string;
}

export type Cond =
  | { k: 'true' }
  | { k: 'err' }
  | { k: 'ok' }
  | { k: 'root' }
  | { k: 'user' }
  | { k: 'ssh' }
  | { k: 'local' }
  /** Variable is non-empty. */
  | { k: 'set'; v: VarRef }
  /** Variable (an integer) is greater than n. */
  | { k: 'gt'; v: VarRef; n: number }
  | { k: 'not'; c: Cond }
  | { k: 'and'; c: Cond[] }
  | { k: 'or'; c: Cond[] };

export type Dir = 'r' | 'l';

export type Op =
  /** Visible literal text. */
  | { t: 'lit'; s: string }
  | { t: 'esc'; e: Esc; fmt?: string }
  | { t: 'var'; v: VarRef }
  /** Set the full style (always resets first). */
  | { t: 'sty'; s: StyleChoice }
  /** Pre-resolution only: style relative to the current element's style. */
  | { t: 'rsty'; o: Style | null }
  | { t: 'if'; c: Cond; then: Op[]; else?: Op[] }
  /** Emit the items whose condition holds, separated by `sep`. */
  | { t: 'join'; sep: string; items: { c: Cond; ops: Op[] }[] }
  /** Open a powerline segment (emits the separator from the previous one). */
  | { t: 'seg'; bg: StyleChoice; text: StyleChoice; dir: Dir }
  /** Close the open segment, if any (emits the end cap). */
  | { t: 'segEnd'; dir: Dir }
  /** Stretch to fill the line. Only valid at the top level of a line. */
  | { t: 'fill'; ch: string; s: StyleChoice }
  /** Set the terminal window title. */
  | { t: 'title'; body: Op[] }
  /** Preview-only marker: the following cells belong to this element. */
  | { t: 'tag'; id: string | null };

export interface Line {
  ops: Op[];
  /** Number of fill ops at the top level. */
  fills: number;
}

export interface Program {
  lines: Line[];
  providers: Map<string, Provider>;
  separator: SeparatorStyle;
  newlineBefore: boolean;
  ps2: { text: string; s: StyleChoice } | null;
  /** Element types that contributed, for compatibility notes. */
  types: Set<string>;
}

export const RESET: StyleChoice = { b: {} };
