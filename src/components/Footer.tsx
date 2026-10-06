import { Logo, REPO_URL } from './Header';
import { GithubMark } from './ui/Icon';

export function Footer() {
  return (
    <footer className="border-t border-surface0/70 bg-mantle/40">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-4 px-4 py-8 text-sm text-overlay1 sm:flex-row sm:items-center sm:justify-between xl:px-6">
        <div className="flex items-center gap-3">
          <Logo className="size-7" />
          <div>
            <div className="font-semibold text-subtext1">Bashin</div>
            <div className="text-xs">Prompt styles inspired by NovaShell · themed with Catppuccin · icons from Nerd Fonts</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span>Everything runs in your browser. Nothing is uploaded.</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-subtext0 hover:text-text">
            <GithubMark className="size-3.5" /> cardondev/bashin
          </a>
        </div>
      </div>
    </footer>
  );
}
