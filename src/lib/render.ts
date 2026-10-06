/**
 * Render a little terminal session: a few earlier prompts with their
 * commands and output, then the live prompt with whatever is being typed.
 */
import type { Palette } from '../data/palette-types';
import { evaluate } from './evaluate';
import type { Program } from './ir';
import type { Scenario } from './scenario';
import type { Depth } from './sgr';
import { Terminal } from './term';

export interface SessionStep {
  scenario: Scenario;
  cmd: string;
  out: string[];
}

export interface Session {
  term: Terminal;
  /** Elements that drew something in the live prompt. */
  visible: Set<string>;
  title: string | null;
  /** Row where the live prompt starts. */
  promptRow: number;
}

export interface SessionOptions {
  palette: Palette;
  depth: Depth;
  history: SessionStep[];
  current: Scenario;
  typed?: string;
  tags?: boolean;
}

export function renderSession(prog: Program, o: SessionOptions): Session {
  const term = new Terminal(o.current.cols);
  let title: string | null = null;
  o.history.forEach((step, i) => {
    const ev = evaluate(prog, {
      scenario: { ...step.scenario, cols: o.current.cols },
      palette: o.palette,
      depth: o.depth,
      tags: o.tags,
      first: i === 0,
    });
    if (ev.title !== null) title = ev.title;
    term.write(ev.ansi);
    term.write('\x1b]9999;\x07');
    term.write(step.cmd + '\r\n');
    for (const line of step.out) term.write(line + '\x1b[0m\r\n');
  });
  const promptRow = term.r;
  const ev = evaluate(prog, {
    scenario: o.current,
    palette: o.palette,
    depth: o.depth,
    tags: o.tags,
    first: o.history.length === 0,
  });
  if (ev.title !== null) title = ev.title;
  term.write(ev.ansi);
  term.write('\x1b]9999;\x07');
  if (o.typed) term.write(o.typed);
  return { term, visible: ev.visible, title, promptRow };
}

/** A believable command that would leave the shell in this scenario's state. */
export function historyFor(s: Scenario): SessionStep | null {
  const prev: Scenario = { ...s, exitCode: 0, durationMs: 0 };
  const rc = s.exitCode;
  if (rc === 127) return { scenario: prev, cmd: 'gti status', out: ['bash: gti: command not found'] };
  if (rc === 130) return { scenario: prev, cmd: 'tail -f /var/log/messages', out: ['Oct  6 13:02:11 zeus systemd[1]: Started session-4.scope.', '^C'] };
  if (rc === 126) return { scenario: prev, cmd: './deploy.sh', out: ['bash: ./deploy.sh: Permission denied'] };
  if (rc === 2) return { scenario: prev, cmd: 'ls missing/', out: ["ls: cannot access 'missing/': No such file or directory"] };
  if (rc !== 0)
    return {
      scenario: prev,
      cmd: 'npm test',
      out: [
        '\x1b[31m FAIL \x1b[0m tests/prompt.test.ts',
        '  \x1b[31m✗\x1b[0m right prompt aligns to the last column',
        '\x1b[2m Tests \x1b[0m \x1b[31m1 failed\x1b[0m | \x1b[32m41 passed\x1b[0m (42)',
      ],
    };
  if (s.durationMs >= 1000)
    return {
      scenario: prev,
      cmd: 'npm run build',
      out: ['\x1b[2mvite v8.3.3\x1b[0m building for production...', `\x1b[32m✓\x1b[0m built in ${(s.durationMs / 1000).toFixed(2)}s`],
    };
  if (s.git && (s.git.modified || s.git.staged || s.git.untracked))
    return { scenario: prev, cmd: 'vim src/prompt.ts', out: [] };
  return {
    scenario: prev,
    cmd: 'ls',
    out: ['\x1b[1;34mdocs\x1b[0m  \x1b[1;34msrc\x1b[0m  \x1b[1;34mtests\x1b[0m  package.json  README.md  vite.config.ts'],
  };
}
