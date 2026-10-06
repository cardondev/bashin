/**
 * The generated code: bash or zsh, plain snippet or self-installing script,
 * with a cost meter and copy / download / share.
 */
import { BookmarkPlus, Check, ClipboardCopy, Cpu, Download, FileCode2, Link2, PackageCheck, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { useState } from 'react';
import { useGenerated } from '../../hooks';
import { copyText } from '../../lib/clipboard';
import { installer, slug } from '../../lib/install';
import { toast } from 'sonner';
import { shareUrl } from '../../lib/doc';
import type { Program } from '../../lib/ir';
import { useLibrary } from '../../store/library';
import { usePrompt } from '../../store/prompt';
import { useUI } from '../../store/ui';
import { Badge, Button, Segmented, Tip } from '../ui/primitives';
import { cn } from '../../lib/cn';
import { Code } from './Code';

export function OutputPanel({ prog }: { prog: Program }) {
  const doc = usePrompt((s) => s.doc);
  const { shell, setShell, installer: inst, flavor, selectedId } = useUI();
  const setUI = useUI((s) => s.set);
  const gen = useGenerated(prog, doc, shell);
  const code = inst ? installer(gen.code, shell) : gen.code;
  const offset = inst ? 4 : 0;
  const range = selectedId && gen.ranges[selectedId] ? ([gen.ranges[selectedId][0] + offset, gen.ranges[selectedId][1] + offset] as [number, number]) : null;
  const [copied, setCopied] = useState(false);
  const s = gen.stats;

  const copy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success(inst ? 'Installer copied — paste it into your terminal.' : `Copied — paste into ${shell === 'zsh' ? '~/.zshrc' : '~/.bashrc'}.`);
    } else toast.error('Could not reach the clipboard. Select the code and copy it by hand.');
  };
  const download = () => {
    const blob = new Blob([gen.code], { type: 'text/x-shellscript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bashin-${slug(doc.name)}.${shell}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const share = async () => {
    const url = shareUrl(doc);
    if (await copyText(url)) toast.success('Share link copied. Anyone with it opens this exact prompt.');
  };

  return (
    <section className="panel overflow-hidden" aria-label="Generated code">
      <div className="flex flex-wrap items-center gap-2 border-b border-surface0/80 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="size-4 text-accent" />
          <h2 className="text-sm font-semibold tracking-tight">Your prompt</h2>
        </div>
        <Segmented
          size="sm"
          value={shell}
          onChange={setShell}
          options={[
            { value: 'bash', label: 'bash' },
            { value: 'zsh', label: 'zsh' },
          ]}
        />
        <Segmented
          size="sm"
          value={inst ? 'installer' : 'snippet'}
          onChange={(v) => setUI('installer', v === 'installer')}
          options={[
            { value: 'snippet', label: 'Snippet', title: `Code to paste into ${shell === 'zsh' ? '~/.zshrc' : '~/.bashrc'}` },
            { value: 'installer', label: 'Installer', title: 'A one-shot script that saves the prompt and wires it into your rc file' },
          ]}
        />
        <div className="ml-auto flex items-center gap-1">
          <Tip label="Save to this browser (see Gallery)">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Save to this browser"
              onClick={() => {
                useLibrary.getState().save(doc);
                toast.success(`Saved “${doc.name}” — find it in the Gallery.`);
              }}
            >
              <BookmarkPlus className="size-3.5" />
            </Button>
          </Tip>
          <Tip label="Copy a link to this prompt">
            <Button size="sm" variant="ghost" onClick={share}>
              <Link2 className="size-3.5" /> Share
            </Button>
          </Tip>
          <Tip label={`Download bashin-${slug(doc.name)}.${shell}`}>
            <Button size="icon-sm" variant="ghost" onClick={download} aria-label="Download">
              <Download className="size-3.5" />
            </Button>
          </Tip>
          <Button size="sm" variant="primary" onClick={copy}>
            {copied ? <Check className="size-3.5" /> : <ClipboardCopy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-surface0/60 bg-crust/30 px-3 py-2 sm:px-4">
        <Tip label={s.mode === 'static' ? 'A single PS1 assignment — nothing runs between prompts.' : 'A prompt function rebuilds PS1 before every prompt.'}>
          <span>
            <Badge tone="accent">
              <Terminal className="size-3" /> {s.mode === 'static' ? 'static PS1' : 'prompt function'}
            </Badge>
          </span>
        </Tip>
        <Tip label={s.forkNotes.length ? s.forkNotes.join(' · ') : 'Everything is computed inside the shell.'}>
          <span>
            <Badge tone={s.forks === 0 ? 'green' : s.forks === 1 ? 'yellow' : 'red'}>
              <Cpu className="size-3" /> {s.forks === 0 ? 'no forks per prompt' : `≤${s.forks} fork${s.forks > 1 ? 's' : ''} per prompt`}
            </Badge>
          </span>
        </Tip>
        {shell === 'bash' && (
          <Tip label={s.bashMin === '3.2' ? 'Runs on macOS’s bash 3.2 and every bash since.' : `Some features need bash ${s.bashMin}; older versions skip them quietly.`}>
            <span>
              <Badge tone="blue">
                <PackageCheck className="size-3" /> bash {s.bashMin}+
              </Badge>
            </span>
          </Tip>
        )}
        {s.nerd && (
          <Tip label="Uses Nerd Font icons — install one in your terminal (nerdfonts.com).">
            <span>
              <Badge tone="yellow">
                <Sparkles className="size-3" /> Nerd Font
              </Badge>
            </span>
          </Tip>
        )}
        <Tip label="Branch names, paths and variables are displayed, never executed.">
          <span>
            <Badge tone="green">
              <ShieldCheck className="size-3" /> injection-safe
            </Badge>
          </span>
        </Tip>
        <span className="ml-auto font-mono text-[0.6875rem] text-overlay0">{code.split('\n').length - 1} lines</span>
      </div>

      <div className={cn('max-h-[34rem] overflow-auto bg-crust/40')}>
        <Code code={code} flavor={flavor} highlight={range} />
      </div>
    </section>
  );
}
