import { lazy, Suspense, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { Builder } from './components/builder/Builder';
import { CommandPalette } from './components/CommandPalette';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImportDialog } from './components/ImportDialog';
import { TooltipProvider } from './components/ui/primitives';
import { decodeDoc } from './lib/doc';
import { redo, undo, usePrompt } from './store/prompt';
import { applyTheme, useUI } from './store/ui';

const Gallery = lazy(() => import('./components/gallery/Gallery').then((m) => ({ default: m.Gallery })));
const Learn = lazy(() => import('./components/learn/Learn').then((m) => ({ default: m.Learn })));

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

export default function App() {
  const view = useUI((s) => s.view);
  const flavor = useUI((s) => s.flavor);
  const accent = useUI((s) => s.accent);

  useEffect(() => applyTheme(flavor, accent), [flavor, accent]);

  // Open a shared prompt (?p=…) once, then drop it from the address bar.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('p');
    if (!p) return;
    const doc = decodeDoc(p);
    params.delete('p');
    const qs = params.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
    if (doc) {
      usePrompt.getState().setDoc(doc);
      toast.success(`Opened the shared prompt “${doc.name}”`, { action: { label: 'Undo', onClick: () => undo() } });
    } else toast.error('That share link is damaged or from a newer version.');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUI.getState().set('paletteOpen', !useUI.getState().paletteOpen);
        return;
      }
      if (isTyping(e)) return;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') useUI.getState().select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <div className="flex-1">
          {view === 'builder' && (
            <>
              <Hero />
              <Builder />
            </>
          )}
          <Suspense fallback={<div className="py-24 text-center text-overlay1">Loading…</div>}>
            {view === 'gallery' && <Gallery />}
            {view === 'learn' && <Learn />}
          </Suspense>
        </div>
        <Footer />
      </div>
      <CommandPalette />
      <ImportDialog />
      <Toaster
        position="bottom-right"
        theme={flavor === 'latte' ? 'light' : 'dark'}
        toastOptions={{
          style: {
            background: 'var(--ctp-mantle)',
            color: 'var(--ctp-text)',
            border: '1px solid var(--ctp-surface1)',
            borderRadius: '0.875rem',
          },
        }}
      />
    </TooltipProvider>
  );
}
