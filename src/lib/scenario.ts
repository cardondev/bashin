/**
 * The simulated shell environment the preview renders a prompt in: who you
 * are, where you are, what the last command did, and what tooling context is
 * active. Every context element reads from here when previewing.
 */

export type GitOp = '' | 'REBASE' | 'MERGE' | 'CHERRY-PICK' | 'REVERT' | 'BISECT';

export interface GitScenario {
  branch: string;
  /** Detached HEAD: the prompt shows the short commit instead of a branch. */
  detached: boolean;
  sha: string;
  op: GitOp;
  staged: number;
  modified: number;
  untracked: number;
  conflicts: number;
  ahead: number;
  behind: number;
  stash: number;
  /** Absolute path of the repository's top-level directory. */
  top: string;
}

export interface OsInfo {
  /** os-release ID, or 'macos'. */
  id: string;
  name: string;
  version: string;
  pretty: string;
}

export interface Scenario {
  user: string;
  host: string;
  /** Domain part of the FQDN (for \H). */
  domain: string;
  home: string;
  cwd: string;
  writable: boolean;
  root: boolean;
  ssh: boolean;
  exitCode: number;
  /** Last command's run time; 0 = none. */
  durationMs: number;
  jobs: number;
  history: number;
  command: number;
  /** Epoch ms. */
  time: number;
  git: GitScenario | null;
  /** $VIRTUAL_ENV (path) or a conda env name; '' = none. */
  venv: string;
  k8s: string;
  aws: string;
  awsRegion: string;
  docker: string;
  terraform: string;
  nix: '' | 'pure' | 'impure';
  node: string;
  tmux: string;
  container: string;
  shlvl: number;
  tty: string;
  shell: string;
  bashVersion: string;
  os: OsInfo;
  ip: string;
  load: string;
  env: Record<string, string>;
  cols: number;
}

export const OS_PRESETS: OsInfo[] = [
  { id: 'rocky', name: 'Rocky Linux', version: '9.6', pretty: 'Rocky Linux 9.6 (Blue Onyx)' },
  { id: 'rhel', name: 'Red Hat Enterprise Linux', version: '9.6', pretty: 'Red Hat Enterprise Linux 9.6 (Plow)' },
  { id: 'almalinux', name: 'AlmaLinux', version: '9.6', pretty: 'AlmaLinux 9.6 (Sage Margay)' },
  { id: 'fedora', name: 'Fedora Linux', version: '43', pretty: 'Fedora Linux 43 (Workstation Edition)' },
  { id: 'ubuntu', name: 'Ubuntu', version: '24.04', pretty: 'Ubuntu 24.04.3 LTS' },
  { id: 'debian', name: 'Debian GNU/Linux', version: '13', pretty: 'Debian GNU/Linux 13 (trixie)' },
  { id: 'arch', name: 'Arch Linux', version: '', pretty: 'Arch Linux' },
  { id: 'alpine', name: 'Alpine Linux', version: '3.22', pretty: 'Alpine Linux v3.22' },
  { id: 'macos', name: 'macOS', version: '26.0', pretty: 'macOS 26.0' },
];

export const BASE_TIME = new Date(2026, 9, 6, 13, 2, 28).getTime();

export const DEFAULT_SCENARIO: Scenario = {
  user: 'nova',
  host: 'zeus',
  domain: 'lab.local',
  home: '/home/nova',
  cwd: '/home/nova/projects/bashin',
  writable: true,
  root: false,
  ssh: false,
  exitCode: 0,
  durationMs: 0,
  jobs: 0,
  history: 1042,
  command: 7,
  time: BASE_TIME,
  git: {
    branch: 'main',
    detached: false,
    sha: '3f9c2ab',
    op: '',
    staged: 1,
    modified: 2,
    untracked: 1,
    conflicts: 0,
    ahead: 1,
    behind: 0,
    stash: 0,
    top: '/home/nova/projects/bashin',
  },
  venv: '',
  k8s: '',
  aws: '',
  awsRegion: 'us-east-1',
  docker: '',
  terraform: '',
  nix: '',
  node: '22.20.0',
  tmux: '',
  container: '',
  shlvl: 1,
  tty: 'pts/0',
  shell: 'bash',
  bashVersion: '5.3.3',
  os: OS_PRESETS[0],
  ip: '10.0.4.12',
  load: '0.42',
  env: {},
  cols: 96,
};

/** Root changes the user and home; everything else stays put. */
export function effectiveScenario(s: Scenario): Scenario {
  if (!s.root) return s;
  return { ...s, user: 'root', home: '/root' };
}

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  patch: Partial<Scenario>;
}

const clean = (top: string): GitScenario => ({
  branch: 'main',
  detached: false,
  sha: '3f9c2ab',
  op: '',
  staged: 0,
  modified: 0,
  untracked: 0,
  conflicts: 0,
  ahead: 0,
  behind: 0,
  stash: 0,
  top,
});

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'dirty',
    label: 'Dirty repo',
    description: 'Inside a git repo with staged, modified and untracked files',
    patch: {
      cwd: '/home/nova/projects/bashin',
      exitCode: 0,
      root: false,
      ssh: false,
      git: { ...clean('/home/nova/projects/bashin'), staged: 1, modified: 2, untracked: 1, ahead: 1 },
    },
  },
  {
    id: 'clean',
    label: 'Clean repo',
    description: 'Up to date with origin, nothing to commit',
    patch: { cwd: '/home/nova/projects/bashin', exitCode: 0, root: false, git: clean('/home/nova/projects/bashin') },
  },
  {
    id: 'home',
    label: 'Home',
    description: 'Sitting in ~, no repo, no context',
    patch: { cwd: '/home/nova', git: null, venv: '', k8s: '', exitCode: 0, root: false, ssh: false, jobs: 0 },
  },
  {
    id: 'failed',
    label: 'Command failed',
    description: 'Last command exited 127 after 4.2 s',
    patch: { exitCode: 127, durationMs: 4200 },
  },
  {
    id: 'deep',
    label: 'Deep path',
    description: 'Five levels down a monorepo',
    patch: {
      cwd: '/home/nova/projects/bashin/packages/web/src/components/preview',
      git: { ...clean('/home/nova/projects/bashin'), branch: 'feature/live-preview', modified: 3 },
    },
  },
  {
    id: 'devops',
    label: 'Cloud context',
    description: 'Python venv, kube context, AWS profile and 2 background jobs',
    patch: {
      venv: '/home/nova/projects/infra/.venv',
      k8s: 'prod-eu-west-1',
      aws: 'platform-admin',
      jobs: 2,
      cwd: '/home/nova/projects/infra',
      git: { ...clean('/home/nova/projects/infra'), branch: 'ops/rotate-certs', modified: 1, behind: 3 },
    },
  },
  {
    id: 'rebase',
    label: 'Mid-rebase',
    description: 'Detached HEAD with a conflict during an interactive rebase',
    patch: {
      cwd: '/home/nova/projects/bashin',
      git: { ...clean('/home/nova/projects/bashin'), detached: true, op: 'REBASE', conflicts: 1, staged: 2 },
      exitCode: 1,
    },
  },
  {
    id: 'root-ssh',
    label: 'Root over SSH',
    description: 'Root shell on a remote RHEL box',
    patch: {
      root: true,
      ssh: true,
      host: 'prod-db-01',
      cwd: '/etc/nginx/conf.d',
      writable: true,
      git: null,
      venv: '',
      os: OS_PRESETS[1],
    },
  },
  {
    id: 'readonly',
    label: 'Read-only dir',
    description: 'Browsing /usr/share as a regular user',
    patch: { cwd: '/usr/share/doc', writable: false, git: null, root: false },
  },
];

/** A scripted session for the animated demo. */
export interface DemoStep {
  cmd: string;
  out?: string[];
  /** Scenario changes that take effect for the prompt after this command. */
  after?: Partial<Scenario>;
  /** Pause after the output, ms. */
  pause?: number;
}

export const DEMO_SCRIPT: DemoStep[] = [
  {
    cmd: 'cd ~/projects/bashin',
    after: {
      cwd: '/home/nova/projects/bashin',
      git: clean('/home/nova/projects/bashin'),
      exitCode: 0,
      durationMs: 0,
    },
  },
  {
    cmd: 'git switch -c feature/rprompt',
    out: ["Switched to a new branch 'feature/rprompt'"],
    after: { git: { ...clean('/home/nova/projects/bashin'), branch: 'feature/rprompt' } },
  },
  {
    cmd: 'vim src/prompt.ts',
    after: { git: { ...clean('/home/nova/projects/bashin'), branch: 'feature/rprompt', modified: 1, untracked: 1 } },
  },
  {
    cmd: 'npm test',
    out: [
      '\x1b[31m FAIL \x1b[0m tests/prompt.test.ts',
      '  \x1b[31m✗\x1b[0m right prompt aligns to the last column',
      '',
      '\x1b[2m Tests \x1b[0m \x1b[31m1 failed\x1b[0m | \x1b[32m41 passed\x1b[0m (42)',
    ],
    after: { exitCode: 1, durationMs: 4870 },
  },
  {
    cmd: 'source .venv/bin/activate',
    after: { exitCode: 0, durationMs: 0, venv: '/home/nova/projects/bashin/.venv' },
  },
  {
    cmd: 'git add -A && git commit -qm "fix: align rprompt"',
    after: { git: { ...clean('/home/nova/projects/bashin'), branch: 'feature/rprompt', ahead: 1 } },
  },
  {
    cmd: 'sudo -i',
    after: { root: true, cwd: '/root', git: null, venv: '' },
  },
  {
    cmd: 'exit',
    out: ['logout'],
    after: {
      root: false,
      cwd: '/home/nova/projects/bashin',
      git: { ...clean('/home/nova/projects/bashin'), branch: 'feature/rprompt', ahead: 1 },
      venv: '/home/nova/projects/bashin/.venv',
    },
  },
  {
    cmd: 'ssh prod-01',
    out: ['Last login: Tue Oct  6 09:12:44 2026 from 10.0.4.12'],
    after: { ssh: true, host: 'prod-01', cwd: '/home/nova', git: null, venv: '', os: OS_PRESETS[0] },
  },
];
