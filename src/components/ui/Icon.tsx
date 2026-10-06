/**
 * Named icons: Lucide for UI and element types, Simple Icons for brand marks.
 */
import {
  AppWindow,
  Box,
  Brackets,
  Calendar,
  ChevronRight,
  CircleCheck,
  Clock,
  Cloud,
  CornerDownLeft,
  FolderOpen,
  Gauge,
  GitBranch,
  GitCompareArrows,
  Hash,
  History,
  Layers,
  ListTodo,
  MoveHorizontal,
  Network,
  Server,
  Sparkles,
  SquareTerminal,
  Timer,
  Type,
  User,
  Variable,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { siDocker, siGithub, siGnubash, siKubernetes, siLinux, siNixos, siNodedotjs, siPython, siTerraform, siTmux } from 'simple-icons';

const LUCIDE: Record<string, LucideIcon> = {
  AppWindow,
  Box,
  Brackets,
  Calendar,
  ChevronRight,
  CircleCheck,
  Clock,
  Cloud,
  CornerDownLeft,
  FolderOpen,
  Gauge,
  GitBranch,
  GitCompareArrows,
  Hash,
  History,
  Layers,
  ListTodo,
  MoveHorizontal,
  Network,
  Server,
  Sparkles,
  SquareTerminal,
  TerminalSquare: SquareTerminal,
  Timer,
  Type,
  User,
  Variable,
  Wifi,
};

const BRANDS: Record<string, { path: string; title: string }> = {
  docker: siDocker,
  github: siGithub,
  gnubash: siGnubash,
  kubernetes: siKubernetes,
  linux: siLinux,
  nixos: siNixos,
  nodedotjs: siNodedotjs,
  python: siPython,
  terraform: siTerraform,
  tmux: siTmux,
};

export function Icon({ name, className = 'size-4', title }: { name: string; className?: string; title?: string }) {
  if (name.startsWith('si:')) {
    const b = BRANDS[name.slice(3)];
    if (!b) return null;
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
        {title && <title>{title}</title>}
        <path d={b.path} />
      </svg>
    );
  }
  const L = LUCIDE[name] ?? Sparkles;
  return <L className={className} aria-hidden={title ? undefined : true} aria-label={title} strokeWidth={1.9} />;
}

export function GithubMark({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={siGithub.path} />
    </svg>
  );
}
