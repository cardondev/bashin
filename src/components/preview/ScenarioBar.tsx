/**
 * The situation the preview renders: exit status, git state, root, SSH,
 * tooling context — one click each, plus full control in "More".
 */
import { Cloud, Container, GitBranch, Hash, Server, ShieldAlert, SlidersHorizontal, Timer, User } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { DEFAULT_SCENARIO, OS_PRESETS, SCENARIO_PRESETS, type GitScenario, type Scenario } from '../../lib/scenario';
import { useUI } from '../../store/ui';
import { Field, Input, Popover, Select, Switch } from '../ui/primitives';
import { cn } from '../../lib/cn';

const GIT_STATES: Record<string, { label: string; git: (top: string) => GitScenario | null }> = {
  none: { label: 'No repo', git: () => null },
  clean: { label: 'Clean', git: (top) => ({ ...base(top) }) },
  dirty: { label: 'Dirty', git: (top) => ({ ...base(top), staged: 1, modified: 2, untracked: 1, ahead: 1 }) },
  diverged: { label: 'Ahead & behind', git: (top) => ({ ...base(top), ahead: 2, behind: 3, stash: 1 }) },
  conflict: { label: 'Merge conflict', git: (top) => ({ ...base(top), op: 'MERGE', conflicts: 2, staged: 1 }) },
  rebase: { label: 'Rebasing (detached)', git: (top) => ({ ...base(top), detached: true, op: 'REBASE', conflicts: 1 }) },
};

function base(top: string): GitScenario {
  return { branch: 'main', detached: false, sha: '3f9c2ab', op: '', staged: 0, modified: 0, untracked: 0, conflicts: 0, ahead: 0, behind: 0, stash: 0, top };
}

function gitState(g: GitScenario | null): string {
  if (!g) return 'none';
  if (g.op === 'REBASE') return 'rebase';
  if (g.conflicts) return 'conflict';
  if (g.behind) return 'diverged';
  if (g.staged || g.modified || g.untracked || g.ahead) return 'dirty';
  return 'clean';
}

function Toggle({ on, onClick, icon, children, title }: { on: boolean; onClick: () => void; icon: ReactNode; children: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors',
        on ? 'bg-accent/15 text-accent ring-1 ring-accent/40' : 'bg-surface0/70 text-subtext0 hover:bg-surface0 hover:text-text',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function MiniSelect({ value, onChange, children, label, icon }: { value: string; onChange: (v: string) => void; children: ReactNode; label: string; icon: ReactNode }) {
  return (
    <label className="relative inline-flex h-7 items-center gap-1.5 rounded-lg bg-surface0/70 pl-2.5 pr-1 text-xs font-medium text-subtext0 transition-colors hover:bg-surface0 hover:text-text">
      {icon}
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-7 cursor-pointer appearance-none bg-transparent pr-4 text-xs text-text focus:outline-none" aria-label={label}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-1.5 size-3 text-overlay1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}

export const ScenarioBar = memo(function ScenarioBar() {
  const s = useUI((st) => st.scenario);
  const patch = useUI((st) => st.patchScenario);
  const top = s.git?.top ?? `${s.home}/projects/bashin`;

  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)] [scrollbar-width:none]">
        {SCENARIO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.description}
            onClick={() => patch({ ...p.patch, time: s.time })}
            className="h-7 shrink-0 rounded-full border border-surface0 px-3 text-xs text-subtext0 transition-colors hover:border-accent/60 hover:text-text"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <MiniSelect label="Last exit status" value={String(s.exitCode)} onChange={(v) => patch({ exitCode: Number(v) })} icon={<Hash className="size-3.5" />}>
          <option value="0">exit 0 · success</option>
          <option value="1">exit 1 · failed</option>
          <option value="2">exit 2 · misuse</option>
          <option value="126">exit 126 · not executable</option>
          <option value="127">exit 127 · not found</option>
          <option value="130">exit 130 · Ctrl-C</option>
          <option value="137">exit 137 · killed</option>
        </MiniSelect>
        <MiniSelect label="Git" value={gitState(s.git)} onChange={(v) => patch({ git: GIT_STATES[v].git(top), cwd: v === 'none' ? s.cwd : s.cwd.startsWith(top) ? s.cwd : top })} icon={<GitBranch className="size-3.5" />}>
          {Object.entries(GIT_STATES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </MiniSelect>
        <MiniSelect label="Last command took" value={String(s.durationMs)} onChange={(v) => patch({ durationMs: Number(v) })} icon={<Timer className="size-3.5" />}>
          <option value="0">took —</option>
          <option value="640">took 640ms</option>
          <option value="4870">took 4.8s</option>
          <option value="72400">took 1m12s</option>
          <option value="3723000">took 1h2m3s</option>
        </MiniSelect>
        <Toggle on={s.root} onClick={() => patch({ root: !s.root })} icon={<ShieldAlert className="size-3.5" />} title="Run as root (EUID 0)">
          root
        </Toggle>
        <Toggle on={s.ssh} onClick={() => patch({ ssh: !s.ssh })} icon={<Server className="size-3.5" />} title="Inside an SSH session">
          ssh
        </Toggle>
        <Toggle
          on={!!s.venv}
          onClick={() => patch({ venv: s.venv ? '' : `${top}/.venv` })}
          icon={<span className="font-mono text-[0.7rem]">py</span>}
          title="Python virtualenv active"
        >
          venv
        </Toggle>
        <Toggle on={!!s.k8s} onClick={() => patch({ k8s: s.k8s ? '' : 'prod-eu-west-1' })} icon={<span className="text-[0.8rem]">☸</span>} title="Kubernetes context">
          k8s
        </Toggle>
        <Toggle on={!!s.aws} onClick={() => patch({ aws: s.aws ? '' : 'platform-admin' })} icon={<Cloud className="size-3.5" />} title="AWS profile">
          aws
        </Toggle>
        <Toggle on={s.jobs > 0} onClick={() => patch({ jobs: s.jobs ? 0 : 2 })} icon={<Container className="size-3.5" />} title="Background jobs">
          jobs
        </Toggle>
        <Popover
          align="end"
          className="w-[22rem]"
          trigger={
            <button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-subtext0 ring-1 ring-surface0 transition-colors hover:text-text hover:ring-surface2">
              <SlidersHorizontal className="size-3.5" /> More
            </button>
          }
        >
          <ScenarioDetails />
        </Popover>
      </div>
    </div>
  );
});

function ScenarioDetails() {
  const s = useUI((st) => st.scenario);
  const patch = useUI((st) => st.patchScenario);
  const setScenario = useUI((st) => st.setScenario);
  const text = (k: keyof Scenario, label: string, mono = true) => (
    <Field label={label}>
      <Input mono={mono} value={String(s[k] ?? '')} onChange={(e) => patch({ [k]: e.target.value } as Partial<Scenario>)} />
    </Field>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <User className="size-4 text-accent" /> Scenario
        </div>
        <button type="button" className="text-xs text-overlay1 hover:text-text" onClick={() => setScenario({ ...DEFAULT_SCENARIO })}>
          reset
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {text('user', 'User')}
        {text('host', 'Host')}
      </div>
      {text('cwd', 'Working directory')}
      <div className="grid grid-cols-2 gap-2">
        {text('home', 'Home')}
        {text('domain', 'Domain')}
      </div>
      <Field label="Operating system">
        <Select value={s.os.id} onChange={(e) => patch({ os: OS_PRESETS.find((o) => o.id === e.target.value) ?? s.os })}>
          {OS_PRESETS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.pretty}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        {text('venv', 'Virtualenv / conda')}
        {text('k8s', 'Kube context')}
        {text('aws', 'AWS profile')}
        {text('awsRegion', 'AWS region')}
        {text('docker', 'Docker context')}
        {text('terraform', 'Terraform workspace')}
        {text('node', 'Node version')}
        {text('tmux', 'tmux session')}
        {text('container', 'Container')}
        {text('ip', 'IP address')}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Jobs">
          <Input type="number" min={0} max={9} value={s.jobs} onChange={(e) => patch({ jobs: Math.max(0, Number(e.target.value) | 0) })} />
        </Field>
        <Field label="SHLVL">
          <Input type="number" min={1} max={9} value={s.shlvl} onChange={(e) => patch({ shlvl: Math.max(1, Number(e.target.value) | 0) })} />
        </Field>
        <Field label="History #">
          <Input type="number" min={1} value={s.history} onChange={(e) => patch({ history: Math.max(1, Number(e.target.value) | 0) })} />
        </Field>
      </div>
      <div className="flex items-center justify-between text-sm text-subtext1">
        <label htmlFor="sc-writable">Directory is writable</label>
        <Switch id="sc-writable" checked={s.writable} onChange={(v) => patch({ writable: v })} />
      </div>
      <div className="flex items-center justify-between text-sm text-subtext1">
        <label htmlFor="sc-nix">Inside nix-shell</label>
        <Switch id="sc-nix" checked={!!s.nix} onChange={(v) => patch({ nix: v ? 'impure' : '' })} />
      </div>
    </div>
  );
}
