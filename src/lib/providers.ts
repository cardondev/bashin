/**
 * Providers compute the runtime values prompt elements display: git state,
 * the formatted working directory, virtualenv, kube context and so on.
 *
 * Each provider has three implementations that must agree:
 *   js    — evaluates against a Scenario for the live preview
 *   bash  — shell code for the generated bash prompt
 *   zsh   — shell code for the generated zsh prompt
 * Values are plain text; colors never live inside them (the prompt string adds
 * them), so a branch called `$(rm -rf ~)` is displayed, never executed.
 */
import type { Esc } from './ir';
import { bashEsc, evalEsc, zshEsc } from './escapes';
import type { Scenario } from './scenario';
import { effectiveScenario } from './scenario';

export interface ShellCode {
  /** Top-level code, run once when the prompt file is sourced. */
  init?: string;
  /** Code run at the start of every prompt. */
  pre?: string;
  /** Named top-level helpers, emitted once even if several providers need them. */
  helpers?: Record<string, string>;
}

export interface Cost {
  /** Worst-case processes forked per prompt. */
  forks: number;
  note: string;
}

export interface Provider {
  key: string;
  /** Short name used to build shell variable names. */
  slug: string;
  vars: readonly string[];
  js(s: Scenario): Record<string, string>;
  bash(v: Record<string, string>): ShellCode;
  zsh(v: Record<string, string>): ShellCode;
  cost?: Cost;
  /** Minimum bash version for full behavior. */
  bashMin?: string;
  /** Combine with another provider of the same key. */
  merge?(other: Provider): Provider;
  /** Lower runs earlier in the prompt function (timing-sensitive providers first). */
  order?: number;
}

/** Single-quote a string for the shell. */
export function sq(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

const BASH44 = '(( BASH_VERSINFO[0] > 4 || (BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] >= 4) ))';

// ── git ──────────────────────────────────────────────────────────────────────

export interface GitOpts {
  status: boolean;
  untracked: boolean;
  timeout: number;
}

const GIT_VARS = [
  'branch', 'detached', 'op', 'top', 'staged', 'modified', 'untracked', 'conflicts', 'ahead', 'behind', 'stash', 'known',
] as const;

function gitShell(v: Record<string, string>, o: GitOpts): ShellCode {
  const args = `status --porcelain -b --ignore-submodules=dirty${o.untracked ? '' : ' -uno'}`;
  const t = Math.max(1, Math.min(10, Math.round(o.timeout || 2)));
  const status = o.status
    ? `
  [[ $__bashin_git_slow == *":${'$'}${v.top}:"* ]] && return 0
  local out
  out=$(__bashin_git_status)
  case $? in
    0) ;;
    124|137) __bashin_git_slow+="${'$'}${v.top}:"; return 0 ;;   # timed out: branch only from now on
    *) return 0 ;;
  esac
  ${v.known}=1
  while [[ -n $out ]]; do
    line=\${out%%$'\\n'*}
    if [[ $out == *$'\\n'* ]]; then out=\${out#*$'\\n'}; else out=''; fi
    case $line in
      '## '*)
        if [[ $line == *'ahead '* ]]; then n=\${line#*ahead }; ${v.ahead}=\${n%%[!0-9]*}; fi
        if [[ $line == *'behind '* ]]; then n=\${line#*behind }; ${v.behind}=\${n%%[!0-9]*}; fi ;;
      '??'*) ${v.untracked}=$((${v.untracked} + 1)) ;;
      DD*|AU*|UD*|UA*|DU*|AA*|UU*) ${v.conflicts}=$((${v.conflicts} + 1)) ;;
      *)
        [[ \${line:0:1} == ' ' ]] || ${v.staged}=$((${v.staged} + 1))
        [[ \${line:1:1} == ' ' ]] || ${v.modified}=$((${v.modified} + 1)) ;;
    esac
  done`
    : '';
  const fn = `# Git state, read straight from .git: no forks outside a repository; inside
# one at most a single \`git status\`, bounded by a ${t}s timeout (a repository
# that times out shows its branch only from then on). After NovaShell's maxgit.
__bashin_git() {
  ${v.branch}='' ${v.detached}='' ${v.op}='' ${v.top}='' ${v.known}=''
  ${v.staged}=0 ${v.modified}=0 ${v.untracked}=0 ${v.conflicts}=0 ${v.ahead}=0 ${v.behind}=0 ${v.stash}=0
  local d=$PWD g head line common n=0
  while [[ ! -e $d/.git ]]; do
    [[ -z $d ]] && return 0
    d=\${d%/*}
  done
  g=$d/.git
  if [[ -f $g ]]; then                       # linked worktree or submodule
    read -r line < "$g"
    line=\${line#gitdir: }
    [[ $line == /* ]] || line=$d/$line
    g=$line
  fi
  [[ -r $g/HEAD ]] || return 0
  ${v.top}=\${d:-/}
  read -r head < "$g/HEAD"
  if [[ $head == 'ref: refs/heads/'* ]]; then
    ${v.branch}=\${head#ref: refs/heads/}
  else
    ${v.branch}=\${head:0:7} ${v.detached}=1
  fi
  if [[ -d $g/rebase-merge || -d $g/rebase-apply ]]; then ${v.op}=REBASE
  elif [[ -f $g/MERGE_HEAD ]]; then ${v.op}=MERGE
  elif [[ -f $g/CHERRY_PICK_HEAD ]]; then ${v.op}=CHERRY-PICK
  elif [[ -f $g/REVERT_HEAD ]]; then ${v.op}=REVERT
  elif [[ -f $g/BISECT_LOG ]]; then ${v.op}=BISECT
  fi
  common=$g
  if [[ -r $g/commondir ]]; then
    read -r common < "$g/commondir"
    [[ $common == /* ]] || common=$g/$common
  fi
  if [[ -r $common/logs/refs/stash ]]; then
    while read -r line; do n=$((n + 1)); done < "$common/logs/refs/stash"
  fi
  ${v.stash}=$n${status}
}`;
  const helpers: Record<string, string> = { __bashin_git: fn };
  if (o.status)
    helpers.__bashin_git_status = `__bashin_git_slow=:
if command -v timeout >/dev/null 2>&1; then
  __bashin_git_status() { GIT_OPTIONAL_LOCKS=0 LC_ALL=C timeout ${t} git ${args} 2>/dev/null; }
else
  __bashin_git_status() { GIT_OPTIONAL_LOCKS=0 LC_ALL=C git ${args} 2>/dev/null; }
fi`;
  return { pre: '__bashin_git', helpers };
}

export function gitProvider(o: GitOpts): Provider {
  return {
    key: 'git',
    slug: 'git',
    vars: GIT_VARS,
    js(s) {
      const g = s.git;
      const out: Record<string, string> = Object.fromEntries(GIT_VARS.map((k) => [k, '']));
      if (!g) {
        for (const k of ['staged', 'modified', 'untracked', 'conflicts', 'ahead', 'behind', 'stash']) out[k] = '0';
        return out;
      }
      out.branch = g.detached ? g.sha.slice(0, 7) : g.branch;
      out.detached = g.detached ? '1' : '';
      out.op = g.op;
      out.top = g.top;
      out.stash = String(g.stash);
      const st = o.status;
      out.known = st ? '1' : '';
      out.staged = String(st ? g.staged : 0);
      out.modified = String(st ? g.modified : 0);
      out.untracked = String(st && o.untracked ? g.untracked : 0);
      out.conflicts = String(st ? g.conflicts : 0);
      out.ahead = String(st ? g.ahead : 0);
      out.behind = String(st ? g.behind : 0);
      return out;
    },
    bash: (v) => gitShell(v, o),
    zsh: (v) => gitShell(v, o),
    cost: o.status
      ? { forks: 1, note: 'one bounded `git status` inside repositories; none elsewhere' }
      : { forks: 0, note: 'branch read from .git/HEAD' },
    merge(other) {
      const p = other as Provider & { opts?: GitOpts };
      const b = p.opts ?? o;
      return gitProvider({ status: o.status || b.status, untracked: o.untracked || b.untracked, timeout: Math.max(o.timeout, b.timeout) });
    },
    opts: o,
  } as Provider & { opts: GitOpts };
}

// ── working directory ───────────────────────────────────────────────────────

export interface CwdOpts {
  mode: 'full' | 'base' | 'trim' | 'repo';
  depth: number;
  ellipsis: string;
  keepHome: boolean;
  fish: boolean;
  fishLen: number;
  home: string;
  sep: string;
}

/** The canonical path formatter; the shell versions below mirror it. */
export function formatPath(cwd: string, home: string, gitTop: string, o: CwdOpts): string {
  let anchor: '~' | '/' | 'repo' | '' = '/';
  let p: string;
  if (o.mode === 'repo' && gitTop && (cwd === gitTop || cwd.startsWith(gitTop + '/'))) {
    anchor = 'repo';
    p = gitTop.slice(gitTop.lastIndexOf('/') + 1) + cwd.slice(gitTop.length);
  } else if (home && cwd === home) {
    anchor = '~';
    p = '';
  } else if (home && cwd.startsWith(home + '/')) {
    anchor = '~';
    p = cwd.slice(home.length + 1);
  } else {
    p = cwd.replace(/^\//, '');
  }
  if (o.mode === 'trim' && p) {
    const parts = p.split('/');
    const n = Math.max(1, o.depth | 0);
    if (parts.length > n) {
      p = `${o.ellipsis}/${parts.slice(-n).join('/')}`;
      if (!(anchor === '~' && o.keepHome)) anchor = '';
    }
  }
  if (o.fish && o.mode !== 'base') {
    const parts = p.split('/');
    const L = Math.max(1, o.fishLen | 0);
    p = parts
      .map((part, i) => {
        if (i === parts.length - 1 || part === o.ellipsis) return part;
        const chars = [...part];
        return chars.slice(0, part.startsWith('.') ? L + 1 : L).join('');
      })
      .join('/');
  }
  if (o.mode === 'base' && p) {
    p = p.slice(p.lastIndexOf('/') + 1);
    anchor = '';
  }
  if (o.sep !== '/') p = p.split('/').join(o.sep);
  if (anchor === '~') return o.home + (p ? o.sep + p : '');
  if (anchor === '/') return '/' + p;
  return p;
}

/** Whether the options are exactly what \w or \W already produce. */
export function nativeCwd(o: CwdOpts): 'cwd' | 'cwdBase' | null {
  if (o.home !== '~' || o.sep !== '/' || o.fish) return null;
  if (o.mode === 'full') return 'cwd';
  if (o.mode === 'base') return 'cwdBase';
  return null;
}

function cwdShell(fn: string, out: string, gitTop: string | null, o: CwdOpts): ShellCode {
  const lines: string[] = [];
  lines.push(`${fn}() {`);
  lines.push(`  local p=$PWD a=/ n s t part acc i`);
  const repo =
    o.mode === 'repo' && gitTop
      ? `  if [[ -n $${gitTop} && ( $PWD == "$${gitTop}" || $PWD == "$${gitTop}"/* ) ]]; then
    a=repo p=\${${gitTop}##*/}\${PWD#"$${gitTop}"}
  el`
      : '  ';
  lines.push(`${repo}if [[ $p == "$HOME" ]]; then a='~' p=''
  elif [[ $p == "$HOME"/* ]]; then a='~' p=\${p#"$HOME"/}
  else p=\${p#/}
  fi`);
  if (o.mode === 'trim') {
    const n = Math.max(1, o.depth | 0);
    lines.push(`  if [[ -n $p ]]; then
    s=\${p//[!\\/]/}; n=$(( \${#s} + 1 ))
    if (( n > ${n} )); then
      t=$p
      for (( i = ${n}; i < n; i++ )); do t=\${t#*/}; done
      p=${sq(o.ellipsis)}/$t
      ${o.keepHome ? `[[ $a == '~' ]] || a=''` : `a=''`}
    fi
  fi`);
  }
  if (o.fish && o.mode !== 'base') {
    const L = Math.max(1, o.fishLen | 0);
    lines.push(`  acc=''
  while [[ $p == */* ]]; do
    part=\${p%%/*} p=\${p#*/}
    if [[ $part == ${sq(o.ellipsis)} ]]; then acc+=$part/
    elif [[ $part == .* ]]; then acc+=\${part:0:${L + 1}}/
    else acc+=\${part:0:${L}}/
    fi
  done
  p=$acc$p`);
  }
  if (o.mode === 'base') lines.push(`  [[ -n $p ]] && { p=\${p##*/}; a=''; }`);
  if (o.sep !== '/') lines.push(`  local sep=${sq(o.sep)}\n  p=\${p//\\//"$sep"}`);
  lines.push(`  case $a in
    '~') ${out}=${sq(o.home)}\${p:+${sq(o.sep)}$p} ;;
    /) ${out}=/$p ;;
    *) ${out}=$p ;;
  esac
}`);
  return { pre: fn, helpers: { [fn]: lines.join('\n') } };
}

export function cwdProvider(o: CwdOpts, git: Provider | null): Provider {
  const key = `cwd:${JSON.stringify(o)}`;
  return {
    key,
    slug: 'cwd',
    vars: ['path'],
    js(scn) {
      const s = effectiveScenario(scn);
      return { path: formatPath(s.cwd, s.home, s.git?.top ?? '', o) };
    },
    bash: (v) => cwdShell(`__bashin_${v.path.replace(/^__bashin_/, '').replace(/_path$/, '')}`, v.path, git ? '__bashin_git_top' : null, o),
    zsh: (v) => cwdShell(`__bashin_${v.path.replace(/^__bashin_/, '').replace(/_path$/, '')}`, v.path, git ? '__bashin_git_top' : null, o),
  };
}

export const writableProvider: Provider = {
  key: 'writable',
  slug: 'ro',
  vars: ['ro'],
  js: (s) => ({ ro: s.writable ? '' : '1' }),
  bash: (v) => ({ pre: `[[ -w $PWD ]] && ${v.ro}='' || ${v.ro}=1` }),
  zsh: (v) => ({ pre: `[[ -w $PWD ]] && ${v.ro}='' || ${v.ro}=1` }),
};

// ── language / tooling context ──────────────────────────────────────────────

const GENERIC_VENV = ['.venv', 'venv', 'env', '.env', 'virtualenv'];

export function venvProvider(genericParent: boolean): Provider {
  const shell = (v: Record<string, string>): ShellCode => ({
    init: 'export VIRTUAL_ENV_DISABLE_PROMPT=1   # the prompt shows the venv itself',
    pre: `${v.name}=''
  if [[ -n \${VIRTUAL_ENV:-} ]]; then
    ${v.name}=\${VIRTUAL_ENV##*/}${
      genericParent
        ? `
    case $${v.name} in ${GENERIC_VENV.join('|')}) ${v.name}=\${VIRTUAL_ENV%/*}; ${v.name}=\${${v.name}##*/} ;; esac`
        : ''
    }
  elif [[ -n \${CONDA_DEFAULT_ENV:-} ]]; then
    ${v.name}=$CONDA_DEFAULT_ENV
  fi`,
  });
  return {
    key: `venv:${genericParent}`,
    slug: 'venv',
    vars: ['name'],
    js(s) {
      if (!s.venv) return { name: '' };
      if (!s.venv.includes('/')) return { name: s.venv };
      const parts = s.venv.split('/').filter(Boolean);
      let name = parts[parts.length - 1] ?? '';
      if (genericParent && GENERIC_VENV.includes(name)) name = parts[parts.length - 2] ?? name;
      return { name };
    },
    bash: shell,
    zsh: shell,
  };
}

export const k8sProvider: Provider = {
  key: 'k8s',
  slug: 'k8s',
  vars: ['ctx'],
  js: (s) => ({ ctx: s.k8s }),
  bash: (v) => ({
    pre: `${v.ctx}=''
  local kf=\${KUBECONFIG:-$HOME/.kube/config} kk kv
  kf=\${kf%%:*}
  if [[ -r $kf ]]; then                      # current-context, no kubectl fork
    while read -r kk kv; do
      if [[ $kk == current-context: ]]; then kv=\${kv//\\"/}; ${v.ctx}=\${kv//\\'/}; break; fi
    done < "$kf"
  fi`,
  }),
  zsh: (v) => ({
    pre: `${v.ctx}=''
  local kf=\${KUBECONFIG:-$HOME/.kube/config} kk kv
  kf=\${kf%%:*}
  if [[ -r $kf ]]; then
    while read -r kk kv; do
      if [[ $kk == current-context: ]]; then kv=\${kv//\\"/}; ${v.ctx}=\${kv//\\'/}; break; fi
    done < "$kf"
  fi`,
  }),
};

export const awsProvider: Provider = {
  key: 'aws',
  slug: 'aws',
  vars: ['profile', 'region'],
  js: (s) => ({ profile: s.aws, region: s.aws ? s.awsRegion : '' }),
  bash: (v) => ({
    pre: `${v.profile}=\${AWS_VAULT:-\${AWS_PROFILE:-\${AWS_DEFAULT_PROFILE:-}}}
  ${v.region}=''; [[ -n $${v.profile} ]] && ${v.region}=\${AWS_REGION:-\${AWS_DEFAULT_REGION:-}}`,
  }),
  zsh: (v) => ({
    pre: `${v.profile}=\${AWS_VAULT:-\${AWS_PROFILE:-\${AWS_DEFAULT_PROFILE:-}}}
  ${v.region}=''; [[ -n $${v.profile} ]] && ${v.region}=\${AWS_REGION:-\${AWS_DEFAULT_REGION:-}}`,
  }),
};

const dockerShell = (v: Record<string, string>): ShellCode => ({
  pre: `${v.ctx}=\${DOCKER_CONTEXT:-}
  if [[ -z $${v.ctx} && -r $HOME/.docker/config.json ]]; then
    local dl
    while IFS= read -r dl || [[ -n $dl ]]; do
      if [[ $dl == *'"currentContext"'* ]]; then
        dl=\${dl#*\\"currentContext\\"}; dl=\${dl#*\\"}; ${v.ctx}=\${dl%%\\"*}; break
      fi
    done < "$HOME/.docker/config.json"
  fi
  [[ $${v.ctx} == default ]] && ${v.ctx}=''`,
});

export const dockerProvider: Provider = {
  key: 'docker',
  slug: 'docker',
  vars: ['ctx'],
  js: (s) => ({ ctx: s.docker === 'default' ? '' : s.docker }),
  bash: dockerShell,
  zsh: dockerShell,
};

const tfShell = (v: Record<string, string>): ShellCode => ({
  pre: `${v.ws}=''
  if [[ -d .terraform ]]; then
    if [[ -r .terraform/environment ]]; then read -r ${v.ws} < .terraform/environment; else ${v.ws}=default; fi
  fi`,
});

export const terraformProvider: Provider = {
  key: 'terraform',
  slug: 'tf',
  vars: ['ws'],
  js: (s) => ({ ws: s.terraform }),
  bash: tfShell,
  zsh: tfShell,
};

export const nixProvider: Provider = {
  key: 'nix',
  slug: 'nix',
  vars: ['shell'],
  js: (s) => ({ shell: s.nix }),
  bash: (v) => ({ pre: `${v.shell}=\${IN_NIX_SHELL:-}` }),
  zsh: (v) => ({ pre: `${v.shell}=\${IN_NIX_SHELL:-}` }),
};

export const nodeProvider: Provider = {
  key: 'node',
  slug: 'node',
  vars: ['ver'],
  js: (s) => ({ ver: s.node }),
  bash: (v) => ({
    pre: `${v.ver}=''
  if [[ -f package.json ]] && command -v node >/dev/null 2>&1; then ${v.ver}=$(node -v 2>/dev/null); ${v.ver}=\${${v.ver}#v}; fi`,
  }),
  zsh: (v) => ({
    pre: `${v.ver}=''
  if [[ -f package.json ]] && (( $+commands[node] )); then ${v.ver}=$(node -v 2>/dev/null); ${v.ver}=\${${v.ver}#v}; fi`,
  }),
  cost: { forks: 1, note: '`node -v` in directories with a package.json' },
};

// ── session ──────────────────────────────────────────────────────────────────

export const tmuxProvider: Provider = {
  key: 'tmux',
  slug: 'tmux',
  vars: ['session'],
  js: (s) => ({ session: s.tmux }),
  bash: (v) => ({
    init: `${v.session}=''`,
    pre: `if [[ -n \${TMUX:-} ]]; then
    [[ -n $${v.session} ]] || ${v.session}=$(tmux display-message -p '#S' 2>/dev/null)   # once per shell
  else
    ${v.session}=''
  fi`,
  }),
  zsh: (v) => ({
    init: `${v.session}=''`,
    pre: `if [[ -n \${TMUX:-} ]]; then
    [[ -n $${v.session} ]] || ${v.session}=$(tmux display-message -p '#S' 2>/dev/null)
  else
    ${v.session}=''
  fi`,
  }),
};

const containerInit = (v: Record<string, string>) => `${v.kind}=''
if [[ -n \${container:-} ]]; then ${v.kind}=$container
elif [[ -f /run/.containerenv ]]; then ${v.kind}=podman
elif [[ -f /.dockerenv ]]; then ${v.kind}=docker
fi`;

export const containerProvider: Provider = {
  key: 'container',
  slug: 'container',
  vars: ['kind'],
  js: (s) => ({ kind: s.container }),
  bash: (v) => ({ init: containerInit(v) }),
  zsh: (v) => ({ init: containerInit(v) }),
};

export const shlvlProvider: Provider = {
  key: 'shlvl',
  slug: 'shlvl',
  vars: ['n'],
  js: (s) => ({ n: String(s.shlvl) }),
  bash: (v) => ({ pre: `${v.n}=\${SHLVL:-1}` }),
  zsh: (v) => ({ pre: `${v.n}=\${SHLVL:-1}` }),
};

export function osProvider(icons: Record<string, string>, withIcons = true): Provider {
  const init = (v: Record<string, string>) => {
    const cases = Object.entries(icons)
      .filter(([id]) => id !== 'linux')
      .map(([id, g]) => `  ${id}) ${v.icon}=${sq(g)} ;;`)
      .join('\n');
    const iconCase = withIcons
      ? `
case $${v.id} in
${cases}
  *) ${v.icon}=${sq(icons.linux ?? '')} ;;
esac`
      : '';
    return `${v.id}='' ${v.name}='' ${v.version}='' ${v.pretty}=''
if [[ -r /etc/os-release ]]; then
  while IFS='=' read -r __bashin_k __bashin_v || [[ -n $__bashin_k ]]; do
    __bashin_v=\${__bashin_v#\\"}; __bashin_v=\${__bashin_v%\\"}
    case $__bashin_k in
      ID) ${v.id}=$__bashin_v ;;
      NAME) ${v.name}=$__bashin_v ;;
      VERSION_ID) ${v.version}=$__bashin_v ;;
      PRETTY_NAME) ${v.pretty}=$__bashin_v ;;
    esac
  done < /etc/os-release
  unset __bashin_k __bashin_v
elif [[ $OSTYPE == darwin* ]]; then
  ${v.id}=macos ${v.name}=macOS ${v.version}=$(sw_vers -productVersion 2>/dev/null)
  ${v.pretty}="macOS $${v.version}"
fi
${v.label}=$${v.name}\${${v.version}:+ $${v.version}}${iconCase}`;
  };
  return {
    key: 'os',
    slug: 'os',
    merge: (other) => osProvider(icons, withIcons || (other as Provider & { withIcons?: boolean }).withIcons === true),
    withIcons,
    vars: ['id', 'name', 'version', 'pretty', 'label', 'icon'],
    js(s) {
      const o = s.os;
      return {
        id: o.id,
        name: o.name,
        version: o.version,
        pretty: o.pretty,
        label: o.version ? `${o.name} ${o.version}` : o.name,
        icon: icons[o.id] ?? icons.linux ?? '',
      };
    },
    bash: (v) => ({ init: init(v) }),
    zsh: (v) => ({ init: init(v) }),
  } as Provider & { withIcons: boolean };
}

// ── status ───────────────────────────────────────────────────────────────────

/** Linux signal names, for the preview (the shell asks `kill -l` itself). */
const SIGNALS: Record<number, string> = {
  1: 'HUP', 2: 'INT', 3: 'QUIT', 4: 'ILL', 5: 'TRAP', 6: 'ABRT', 7: 'BUS', 8: 'FPE', 9: 'KILL', 10: 'USR1',
  11: 'SEGV', 12: 'USR2', 13: 'PIPE', 14: 'ALRM', 15: 'TERM', 17: 'CHLD', 18: 'CONT', 19: 'STOP', 20: 'TSTP',
};

export function exitName(rc: number): string {
  if (rc === 126) return 'NOPERM';
  if (rc === 127) return 'NOTFOUND';
  if (rc > 128 && rc < 160) return SIGNALS[rc - 128] ?? String(rc);
  return String(rc);
}

export const rcProvider: Provider = {
  key: 'rc',
  slug: 'rc',
  vars: ['code', 'name'],
  js: (s) => ({ code: String(s.exitCode), name: exitName(s.exitCode) }),
  bash: (v) => ({
    pre: `${v.code}=$rc ${v.name}=$rc
  case $rc in
    126) ${v.name}=NOPERM ;;
    127) ${v.name}=NOTFOUND ;;
    129|1[3-5][0-9]) ${v.name}=$(kill -l $((rc - 128)) 2>/dev/null) || ${v.name}=$rc ;;
  esac`,
  }),
  zsh: (v) => ({
    pre: `${v.code}=$rc ${v.name}=$rc
  case $rc in
    126) ${v.name}=NOPERM ;;
    127) ${v.name}=NOTFOUND ;;
    129|1[3-5][0-9]) ${v.name}=\${signals[rc - 127]:-$rc} ;;
  esac`,
  }),
};

export interface DurationOpts {
  /** Show only when the command ran at least this long (ms). */
  threshold: number;
  format: 'human' | 'seconds' | 'ms';
}

export function formatDuration(ms: number, format: DurationOpts['format']): string {
  ms = Math.floor(ms);
  if (format === 'ms') return `${ms}ms`;
  if (format === 'seconds') return `${Math.floor(ms / 1000)}s`;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 10000) return `${Math.floor(ms / 1000)}.${Math.floor((ms % 1000) / 100)}s`;
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h${Math.floor((ms % 3600000) / 60000)}m${Math.floor((ms % 60000) / 1000)}s`;
}

function durFormatShell(out: string, format: DurationOpts['format']): string {
  if (format === 'ms') return `${out}=\${ms}ms`;
  if (format === 'seconds') return `${out}=$(( ms / 1000 ))s`;
  return `if (( ms < 1000 )); then ${out}=\${ms}ms
    elif (( ms < 10000 )); then ${out}=$(( ms / 1000 )).$(( ms % 1000 / 100 ))s
    elif (( ms < 60000 )); then ${out}=$(( ms / 1000 ))s
    elif (( ms < 3600000 )); then ${out}=$(( ms / 60000 ))m$(( ms % 60000 / 1000 ))s
    else ${out}=$(( ms / 3600000 ))h$(( ms % 3600000 / 60000 ))m$(( ms % 60000 / 1000 ))s
    fi`;
}

export function durationProvider(o: DurationOpts): Provider {
  const th = Math.max(0, Math.round(o.threshold));
  return {
    key: `duration:${th}:${o.format}`,
    slug: 'dur',
    vars: ['text'],
    js: (s) => ({ text: s.durationMs > 0 && s.durationMs >= th ? formatDuration(s.durationMs, o.format) : '' }),
    bash: (v) => ({
      helpers: {
        __bashin_ps0: `# Command start time, recorded when PS0 is expanded (bash 4.4+; microseconds on 5.0+).
if [[ \${PS0:-} == *__bashin_t0* ]]; then
  :
elif [[ -n \${EPOCHREALTIME:-} ]]; then
  PS0=\${PS0:-}'\${PS1:$((__bashin_t0=\${EPOCHREALTIME//[!0-9]/})):0}'
else
  PS0=\${PS0:-}'\${PS1:$((__bashin_t0=SECONDS*1000000)):0}'
fi`,
      },
      pre: `${v.text}=''
  if [[ -n \${__bashin_t0:-} ]]; then
    local now ms
    if [[ -n \${EPOCHREALTIME:-} ]]; then now=\${EPOCHREALTIME//[!0-9]/}; else now=$((SECONDS * 1000000)); fi
    ms=$(( (now - __bashin_t0) / 1000 ))
    unset __bashin_t0
    if (( ms >= ${th} )); then
    ${durFormatShell(v.text, o.format)}
    fi
  fi`,
    }),
    zsh: (v) => ({
      helpers: {
        __bashin_preexec: `zmodload zsh/datetime 2>/dev/null
__bashin_preexec() { __bashin_t0=$EPOCHREALTIME; }
add-zsh-hook preexec __bashin_preexec`,
      },
      pre: `${v.text}=''
  if [[ -n \${__bashin_t0:-} ]]; then
    local ms
    (( ms = (EPOCHREALTIME - __bashin_t0) * 1000 ))
    ms=\${ms%%.*}
    unset __bashin_t0
    if (( ms >= ${th} )); then
    ${durFormatShell(v.text, o.format)}
    fi
  fi`,
    }),
    bashMin: '4.4',
    order: -10, // measure before anything else in the prompt function can take time
  };
}

export const jobsProvider: Provider = {
  key: 'jobs',
  slug: 'jobs',
  vars: ['n'],
  js: (s) => ({ n: String(s.jobs) }),
  bash: (v) => ({
    helpers: {
      __bashin_jobs: `if ${BASH44}; then
  __bashin_jobs() { local j='\\j'; ${v.n}=\${j@P}; }
else
  __bashin_jobs() { local j; j=$(jobs -p 2>/dev/null | wc -l); ${v.n}=\${j//[!0-9]/}; }
fi`,
    },
    pre: '__bashin_jobs',
  }),
  zsh: (v) => ({ pre: `${v.n}=\${(%):-%j}` }),
  cost: { forks: 0, note: 'no forks on bash 4.4+' },
};

// ── system ───────────────────────────────────────────────────────────────────

export const loadProvider: Provider = {
  key: 'load',
  slug: 'load',
  vars: ['l1'],
  js: (s) => ({ l1: s.load }),
  bash: (v) => ({
    pre: `${v.l1}=''
  if [[ -r /proc/loadavg ]]; then read -r ${v.l1} _ < /proc/loadavg
  elif [[ $OSTYPE == darwin* ]]; then ${v.l1}=$(sysctl -n vm.loadavg 2>/dev/null); ${v.l1}=\${${v.l1}#\\{ }; ${v.l1}=\${${v.l1}%% *}
  fi`,
  }),
  zsh: (v) => ({
    pre: `${v.l1}=''
  if [[ -r /proc/loadavg ]]; then read -r ${v.l1} _ < /proc/loadavg
  elif [[ $OSTYPE == darwin* ]]; then ${v.l1}=$(sysctl -n vm.loadavg 2>/dev/null); ${v.l1}=\${${v.l1}#\\{ }; ${v.l1}=\${${v.l1}%% *}
  fi`,
  }),
  cost: { forks: 1, note: '`sysctl` on macOS; none on Linux' },
};

export function ipProvider(everyPrompt: boolean): Provider {
  const code = (v: Record<string, string>) => `${v.addr}=''
if command -v ip >/dev/null 2>&1; then
  ${v.addr}=$(ip -4 route get 1.1.1.1 2>/dev/null)
  if [[ $${v.addr} == *' src '* ]]; then ${v.addr}=\${${v.addr}#* src }; ${v.addr}=\${${v.addr}%% *}; else ${v.addr}=''; fi
elif [[ $OSTYPE == darwin* ]]; then
  ${v.addr}=$(ipconfig getifaddr en0 2>/dev/null)
fi`;
  const sc = (v: Record<string, string>): ShellCode =>
    everyPrompt ? { pre: code(v).replace(/\n/g, '\n  ') } : { init: code(v) };
  return {
    key: `ip:${everyPrompt}`,
    slug: 'ip',
    vars: ['addr'],
    js: (s) => ({ addr: s.ip }),
    bash: sc,
    zsh: sc,
    cost: everyPrompt ? { forks: 1, note: 'looks the address up on every prompt' } : undefined,
  };
}

// ── user-defined ─────────────────────────────────────────────────────────────

export function isEnvName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export function envProvider(name: string, sample: string): Provider {
  const ok = isEnvName(name);
  return {
    key: `env:${name}`,
    slug: 'env',
    vars: ['value'],
    js: (s) => ({ value: ok ? (s.env[name] ?? sample) : '' }),
    bash: (v) => ({ pre: ok ? `${v.value}=\${${name}:-}` : `${v.value}=''` }),
    zsh: (v) => ({ pre: ok ? `${v.value}=\${${name}:-}` : `${v.value}=''` }),
  };
}

export function commandProvider(cmd: string, sample: string): Provider {
  const c = cmd.trim() || 'true';
  return {
    key: `cmd:${c}`,
    slug: 'cmd',
    vars: ['out'],
    js: () => ({ out: sample }),
    bash: (v) => ({ pre: `${v.out}=$(${c} 2>/dev/null); ${v.out}=\${${v.out}%%$'\\n'*}` }),
    zsh: (v) => ({ pre: `${v.out}=$(${c} 2>/dev/null); ${v.out}=\${${v.out}%%$'\\n'*}` }),
    cost: { forks: 1, note: `runs \`${c}\` on every prompt` },
  };
}

// ── escape widths (lines with a fill) ───────────────────────────────────────

/**
 * The expanded value of a native escape, used only to measure lines that
 * contain a fill. bash 4.4+ asks the shell itself (`${s@P}`); older bash
 * approximates.
 */
export function escWidthProvider(e: Esc, fmt?: string): Provider {
  const b = bashEsc(e, fmt);
  const z = zshEsc(e, fmt);
  return {
    key: `escw:${e}:${fmt ?? ''}`,
    slug: 'w',
    vars: ['v'],
    js: (s) => ({ v: evalEsc(e, fmt, s) }),
    bash: (v) => ({
      helpers: { __bashin_expand: EXPAND_HELPER },
      pre: `__bashin_expand ${v.v} ${sq(b)}`,
    }),
    zsh: (v) => ({
      pre: z.startsWith('${') ? `${v.v}=${z}` : `${v.v}=${sq(z)}; ${v.v}=\${(%)${v.v}}`,
    }),
  };
}

const EXPAND_HELPER = `# __bashin_expand VAR ESCAPES — VAR = ESCAPES expanded the way PS1 is
# (only used to measure lines that stretch to the terminal width).
if ${BASH44}; then
  __bashin_expand() { local s=$2; printf -v "$1" '%s' "\${s@P}"; }
else
  __bashin_expand() {
    local x
    case $2 in
      '\\u') x=\${USER:-$(id -un 2>/dev/null)} ;;
      '\\h') x=\${HOSTNAME%%.*} ;;
      '\\H') x=$HOSTNAME ;;
      '\\w') case $PWD in "$HOME") x='~' ;; "$HOME"/*) x="~\${PWD#"$HOME"}" ;; *) x=$PWD ;; esac ;;
      '\\W') case $PWD in "$HOME") x='~' ;; /) x=/ ;; *) x=\${PWD##*/} ;; esac ;;
      '\\$') if (( EUID == 0 )); then x='#'; else x='$'; fi ;;
      '\\t') x=$(date +%H:%M:%S) ;;
      '\\T') x=$(date +%I:%M:%S) ;;
      '\\@') x=$(date '+%I:%M %p') ;;
      '\\A') x=$(date +%H:%M) ;;
      '\\d') x=$(date '+%a %b %d') ;;
      '\\D{'*) x=\${2#???}; x=$(date "+\${x%?}") ;;
      '\\j') x=$(jobs -p | wc -l); x=\${x//[!0-9]/} ;;
      '\\!') x=$HISTCMD ;;
      '\\s') x=\${0##*/}; x=\${x#-} ;;
      '\\v') x=\${BASH_VERSINFO[0]}.\${BASH_VERSINFO[1]} ;;
      '\\V') x=\${BASH_VERSINFO[0]}.\${BASH_VERSINFO[1]}.\${BASH_VERSINFO[2]} ;;
      *) x=$2 ;;
    esac
    printf -v "$1" '%s' "$x"
  }
fi`;
