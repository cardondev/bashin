/**
 * ⌘K: add elements, load presets, switch palettes, run actions.
 */
import { Command } from 'cmdk';
import { Dialog as RDialog } from 'radix-ui';
import { BookOpen, ClipboardCopy, Hammer, Import, LayoutGrid, Link2, Moon, Play, Redo2, Save, Terminal, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { getPalette, PALETTES } from '../data/palettes';
import { PRESETS } from '../data/presets';
import { compile } from '../lib/compile';
import { shareUrl } from '../lib/doc';
import { ELEMENT_LIST } from '../lib/elements';
import { generate } from '../lib/gen/shell';
import { useLibrary } from '../store/library';
import { redo, undo, usePrompt } from '../store/prompt';
import { useUI } from '../store/ui';
import { copyText } from '../lib/clipboard';
import { addElement, loadDoc } from '../store/actions';
import { Icon } from './ui/Icon';

function Item({ onSelect, children, keywords, value }: { onSelect: () => void; children: ReactNode; keywords?: string[]; value: string }) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-subtext1 data-[selected=true]:bg-surface0 data-[selected=true]:text-text"
    >
      {children}
    </Command.Item>
  );
}

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Every search word must appear; matches at the start of a word rank first. */
function filter(value: string, search: string, keywords?: string[]): number {
  const terms = fold(search).split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const hay = ` ${fold(value)} ${fold((keywords ?? []).join(' '))}`;
  if (!terms.every((t) => hay.includes(t))) return 0;
  return terms.every((t) => hay.includes(` ${t}`)) ? 1 : 0.6;
}

const group = 'px-1.5 py-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-overlay1';

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen);
  const set = useUI((s) => s.set);
  const close = () => set('paletteOpen', false);
  const run = (fn: () => void) => () => {
    close();
    fn();
  };
  const ui = useUI.getState;

  return (
    <RDialog.Root open={open} onOpenChange={(o) => set('paletteOpen', o)}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-crust/60 backdrop-blur-sm" />
        <RDialog.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-surface1 bg-mantle shadow-2xl shadow-black/50 outline-none">
          <RDialog.Title className="sr-only">Search and actions</RDialog.Title>
          <Command loop label="Search and actions" filter={filter}>
            <Command.Input
              autoFocus
              placeholder="Add an element, load a preset, change the palette…"
              className="h-14 w-full border-b border-surface0 bg-transparent px-4 text-[0.95rem] text-text placeholder:text-overlay0 focus:outline-none"
            />
            <Command.List className="max-h-[60vh] overflow-y-auto py-1">
              <Command.Empty className="px-4 py-8 text-center text-sm text-overlay1">Nothing found.</Command.Empty>
              <Command.Group heading="Actions" className={group}>
                <Item
                  value="copy code"
                  onSelect={run(async () => {
                    const { doc } = usePrompt.getState();
                    const code = generate(compile(doc), { shell: ui().shell, depth: doc.settings.depth, palette: getPalette(doc.settings.palette), name: doc.name }).code;
                    if (await copyText(code)) toast.success('Prompt code copied');
                  })}
                >
                  <ClipboardCopy className="size-4" /> Copy the {useUI.getState().shell} code
                </Item>
                <Item value="share link" onSelect={run(async () => (await copyText(shareUrl(usePrompt.getState().doc))) && toast.success('Share link copied'))}>
                  <Link2 className="size-4" /> Copy a share link
                </Item>
                <Item
                  value="save prompt library"
                  onSelect={run(() => {
                    const d = usePrompt.getState().doc;
                    useLibrary.getState().save(d);
                    toast.success(`Saved “${d.name}”`);
                  })}
                >
                  <Save className="size-4" /> Save to this browser
                </Item>
                <Item value="import ps1 prompt" onSelect={run(() => set('importOpen', true))}>
                  <Import className="size-4" /> Import an existing PS1 / PROMPT
                </Item>
                <Item value="switch shell bash zsh" onSelect={run(() => ui().setShell(ui().shell === 'bash' ? 'zsh' : 'bash'))}>
                  <Terminal className="size-4" /> Switch to {useUI.getState().shell === 'bash' ? 'zsh' : 'bash'} output
                </Item>
                <Item value="play demo session" onSelect={run(() => (ui().set('demo', !ui().demo), ui().setView('builder')))}>
                  <Play className="size-4" /> {useUI.getState().demo ? 'Stop' : 'Play'} the demo session
                </Item>
                <Item value="toggle dark light theme" onSelect={run(() => ui().toggleDark())}>
                  <Moon className="size-4" /> Toggle light / dark
                </Item>
                <Item value="undo" onSelect={run(undo)}>
                  <Undo2 className="size-4" /> Undo
                </Item>
                <Item value="redo" onSelect={run(redo)}>
                  <Redo2 className="size-4" /> Redo
                </Item>
              </Command.Group>
              <Command.Group heading="Go to" className={group}>
                <Item value="go builder" onSelect={run(() => ui().setView('builder'))}>
                  <Hammer className="size-4" /> Builder
                </Item>
                <Item value="go gallery presets" onSelect={run(() => ui().setView('gallery'))}>
                  <LayoutGrid className="size-4" /> Gallery
                </Item>
                <Item value="go learn docs" onSelect={run(() => ui().setView('learn'))}>
                  <BookOpen className="size-4" /> Learn
                </Item>
              </Command.Group>
              <Command.Group heading="Add element" className={group}>
                {ELEMENT_LIST.filter((d) => !d.hidden).map((d) => (
                  <Item key={d.type} value={`add ${d.name}`} keywords={d.keywords} onSelect={run(() => (ui().setView('builder'), addElement(d.type)))}>
                    <Icon name={d.icon} className="size-4" /> {d.name}
                    <span className="ml-auto truncate pl-3 text-xs text-overlay1">{d.description}</span>
                  </Item>
                ))}
              </Command.Group>
              <Command.Group heading="Presets" className={group}>
                {PRESETS.map((p) => (
                  <Item key={p.id} value={`preset ${p.name}`} keywords={p.tags} onSelect={run(() => loadDoc(p.doc, p.name))}>
                    <LayoutGrid className="size-4" /> {p.name}
                    <span className="ml-auto truncate pl-3 text-xs text-overlay1">{p.origin}</span>
                  </Item>
                ))}
              </Command.Group>
              <Command.Group heading="Palette" className={group}>
                {PALETTES.map((p) => (
                  <Item key={p.id} value={`palette ${p.name}`} keywords={[p.family]} onSelect={run(() => usePrompt.getState().setSettings({ palette: p.id }))}>
                    <span className="flex h-4 w-8 overflow-hidden rounded ring-1 ring-black/20" style={{ backgroundColor: p.terminal.background }}>
                      {(['red', 'green', 'blue', 'mauve'] as const).map((t) => (
                        <span key={t} className="mt-auto h-1.5 flex-1" style={{ backgroundColor: p.tokens[t] }} />
                      ))}
                    </span>
                    {p.name}
                  </Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
