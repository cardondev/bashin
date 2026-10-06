/**
 * Native prompt escapes: how each is spelled in bash and zsh, and what it
 * expands to in a scenario (for the preview).
 */
import type { Esc } from './ir';
import type { Scenario } from './scenario';
import { effectiveScenario } from './scenario';
import { strftime } from './strftime';

export const ESC_INFO: Record<Esc, { bash: string; zsh: string; label: string }> = {
  user: { bash: '\\u', zsh: '%n', label: 'username' },
  host: { bash: '\\h', zsh: '%m', label: 'hostname up to the first dot' },
  hostFull: { bash: '\\H', zsh: '%M', label: 'full hostname' },
  cwd: { bash: '\\w', zsh: '%~', label: 'working directory, $HOME as ~' },
  cwdBase: { bash: '\\W', zsh: '%1~', label: 'basename of the working directory' },
  time24: { bash: '\\t', zsh: '%D{%H:%M:%S}', label: 'time, 24-hour HH:MM:SS' },
  time12: { bash: '\\T', zsh: '%D{%I:%M:%S}', label: 'time, 12-hour HH:MM:SS' },
  timeAmPm: { bash: '\\@', zsh: '%D{%I:%M %p}', label: 'time, 12-hour am/pm' },
  time24short: { bash: '\\A', zsh: '%D{%H:%M}', label: 'time, 24-hour HH:MM' },
  date: { bash: '\\d', zsh: '%D{%a %b %d}', label: 'date, "Tue May 26"' },
  strftime: { bash: '\\D{…}', zsh: '%D{…}', label: 'strftime(3) format' },
  jobs: { bash: '\\j', zsh: '%j', label: 'number of jobs' },
  history: { bash: '\\!', zsh: '%!', label: 'history number' },
  cmdno: { bash: '\\#', zsh: '%!', label: 'command number' },
  dollar: { bash: '\\$', zsh: '%(!.#.$)', label: '# when root, otherwise $' },
  shell: { bash: '\\s', zsh: 'zsh', label: 'shell name' },
  version: { bash: '\\v', zsh: '${ZSH_VERSION}', label: 'shell version' },
  release: { bash: '\\V', zsh: '${ZSH_VERSION}', label: 'shell release' },
  tty: { bash: '\\l', zsh: '%l', label: 'terminal device basename' },
};

/** Safe strftime format for \D{…}: no braces, backslashes or shell metacharacters. */
export function cleanFmt(fmt: string | undefined): string {
  return (fmt ?? '').replace(/[{}\\$`'"]/g, '');
}

export function bashEsc(e: Esc, fmt?: string): string {
  if (e === 'strftime') return `\\D{${cleanFmt(fmt)}}`;
  return ESC_INFO[e].bash;
}

export function zshEsc(e: Esc, fmt?: string): string {
  if (e === 'strftime') return `%D{${cleanFmt(fmt)}}`;
  return ESC_INFO[e].zsh;
}

/** `$PWD` with `$HOME` abbreviated to `~`, as bash's \w does. */
export function tildePath(cwd: string, home: string): string {
  if (home && home !== '/' && cwd === home) return '~';
  if (home && home !== '/' && cwd.startsWith(home + '/')) return '~' + cwd.slice(home.length);
  return cwd;
}

export function basePath(cwd: string, home: string): string {
  if (home && cwd === home) return '~';
  if (cwd === '/') return '/';
  return cwd.slice(cwd.lastIndexOf('/') + 1);
}

/** What a native escape expands to in the scenario. */
export function evalEsc(e: Esc, fmt: string | undefined, scenario: Scenario): string {
  const s = effectiveScenario(scenario);
  switch (e) {
    case 'user':
      return s.user;
    case 'host':
      return s.host.split('.')[0];
    case 'hostFull':
      return s.domain ? `${s.host}.${s.domain}` : s.host;
    case 'cwd':
      return tildePath(s.cwd, s.home);
    case 'cwdBase':
      return basePath(s.cwd, s.home);
    case 'time24':
      return strftime('%H:%M:%S', s.time);
    case 'time12':
      return strftime('%I:%M:%S', s.time);
    case 'timeAmPm':
      return strftime('%I:%M %p', s.time);
    case 'time24short':
      return strftime('%H:%M', s.time);
    case 'date':
      return strftime('%a %b %d', s.time);
    case 'strftime':
      return strftime(cleanFmt(fmt) || '%X', s.time);
    case 'jobs':
      return String(s.jobs);
    case 'history':
      return String(s.history);
    case 'cmdno':
      return String(s.command);
    case 'dollar':
      return s.root ? '#' : '$';
    case 'shell':
      return s.shell;
    case 'version':
      return s.bashVersion.split('.').slice(0, 2).join('.');
    case 'release':
      return s.bashVersion;
    case 'tty':
      return s.tty.slice(s.tty.lastIndexOf('/') + 1);
  }
}
