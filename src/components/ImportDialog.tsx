/**
 * Paste an existing prompt and turn it into editable elements.
 */
import { AlertTriangle, Import } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getPalette } from '../data/palettes';
import { compile } from '../lib/compile';
import { importPrompt } from '../lib/import';
import { renderSession } from '../lib/render';
import { undo, usePrompt } from '../store/prompt';
import { useUI } from '../store/ui';
import { TerminalView } from './terminal/TerminalView';
import { Button, Dialog, Segmented } from './ui/primitives';

const EXAMPLES = {
  ubuntu: '\\[\\e]0;\\u@\\h: \\w\\a\\]${debian_chroot:+($debian_chroot)}\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ ',
  git: '\\[\\e[1;35m\\]\\u\\[\\e[0m\\] in \\[\\e[1;36m\\]\\w\\[\\e[0m\\]\\[\\e[33m\\]$(__git_ps1 " on %s")\\[\\e[0m\\]\\n\\[\\e[32m\\]❯\\[\\e[0m\\] ',
  zsh: '%F{green}%n%f@%F{cyan}%m%f %B%F{blue}%~%f%b %(!.#.$) ',
};

export function ImportDialog() {
  const open = useUI((s) => s.importOpen);
  const set = useUI((s) => s.set);
  const scenario = useUI((s) => s.scenario);
  const paletteId = usePrompt((s) => s.doc.settings.palette);
  const [src, setSrc] = useState('');
  const [rprompt, setRprompt] = useState('');
  const [mode, setMode] = useState<'paste' | 'help'>('paste');
  const palette = getPalette(paletteId);

  const result = useMemo(() => (src.trim() ? importPrompt(src, palette, rprompt) : null), [src, rprompt, palette]);
  const session = useMemo(() => {
    if (!result) return null;
    return renderSession(compile(result.doc), { palette, depth: 'truecolor', history: [], current: { ...scenario, cols: 76 } });
  }, [result, palette, scenario]);

  const apply = () => {
    if (!result) return;
    usePrompt.getState().setDoc(result.doc);
    useUI.getState().select(null);
    useUI.getState().setView('builder');
    set('importOpen', false);
    toast.success(`Imported ${result.doc.elements.length} elements from your ${result.shell} prompt`, { action: { label: 'Undo', onClick: () => undo() } });
    setSrc('');
    setRprompt('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => set('importOpen', o)}
      title="Import a prompt"
      description="Paste your current prompt and keep editing it here. Colors, escapes and git helpers are recognized."
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-4">
        <Segmented
          size="sm"
          className="self-start"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'paste', label: 'Paste' },
            { value: 'help', label: 'Where do I find it?' },
          ]}
        />
        {mode === 'help' ? (
          <div className="grid gap-3 text-sm text-subtext0 sm:grid-cols-2">
            <div className="rounded-xl bg-crust/60 p-3">
              <div className="mb-1 font-medium text-text">bash</div>
              <code className="block font-mono text-[0.8125rem] text-accent">echo "$PS1"</code>
              <p className="mt-1 text-xs">or paste the whole PS1='…' line from your ~/.bashrc.</p>
            </div>
            <div className="rounded-xl bg-crust/60 p-3">
              <div className="mb-1 font-medium text-text">zsh</div>
              <code className="block font-mono text-[0.8125rem] text-accent">print -r -- "$PROMPT"</code>
              <code className="mt-1 block font-mono text-[0.8125rem] text-accent">print -r -- "$RPROMPT"</code>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              spellCheck={false}
              rows={4}
              placeholder={'\\[\\e[01;32m\\]\\u@\\h\\[\\e[00m\\]:\\[\\e[01;34m\\]\\w\\[\\e[00m\\]\\$ '}
              className="w-full resize-y rounded-xl border border-surface1 bg-base p-3 font-mono text-[0.8125rem] text-text placeholder:text-overlay0 focus:border-accent focus:outline-none"
              aria-label="Prompt to import"
            />
            <input
              value={rprompt}
              onChange={(e) => setRprompt(e.target.value)}
              spellCheck={false}
              placeholder="zsh RPROMPT (optional)"
              className="h-9 w-full rounded-xl border border-surface1 bg-base px-3 font-mono text-[0.8125rem] text-text placeholder:text-overlay0 focus:border-accent focus:outline-none"
              aria-label="RPROMPT to import"
            />
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-overlay1">
              Try:
              {Object.entries(EXAMPLES).map(([k, v]) => (
                <button key={k} type="button" className="rounded-full bg-surface0 px-2.5 py-1 text-subtext0 hover:text-text" onClick={() => setSrc(v)}>
                  {k === 'ubuntu' ? 'Ubuntu default' : k === 'git' ? 'with __git_ps1' : 'zsh'}
                </button>
              ))}
            </div>
          </>
        )}
        {session && result && (
          <div className="flex flex-col gap-2">
            <div className="eyebrow">Preview · detected {result.shell} · {result.doc.elements.length} elements</div>
            <TerminalView term={session.term} palette={palette} fontSize={13} chrome={false} className="rounded-xl" />
            {result.warnings.length > 0 && (
              <ul className="flex flex-col gap-1 rounded-xl bg-yellow/10 p-3 text-xs text-yellow">
                {result.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => set('importOpen', false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!result?.doc.elements.length} onClick={apply}>
            <Import className="size-4" /> Import
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
