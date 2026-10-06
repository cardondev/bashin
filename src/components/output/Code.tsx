/**
 * Syntax-highlighted shell code (Shiki, Catppuccin themes, JS regex engine —
 * no WebAssembly), with a highlighted line range.
 */
import { useEffect, useRef, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';
import type { Flavor } from '../../store/ui';

let highlighter: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ]);
    return createHighlighterCore({
      themes: [
        import('@shikijs/themes/catppuccin-mocha'),
        import('@shikijs/themes/catppuccin-macchiato'),
        import('@shikijs/themes/catppuccin-frappe'),
        import('@shikijs/themes/catppuccin-latte'),
      ],
      langs: [import('@shikijs/langs/shellscript')],
      engine: createJavaScriptRegexEngine(),
    });
  })();
  return highlighter;
}

export function Code({ code, flavor, highlight }: { code: string; flavor: Flavor; highlight?: [number, number] | null }) {
  const [html, setHtml] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      getHighlighter()
        .then((h) => {
          if (!alive) return;
          const out = h.codeToHtml(code, {
            lang: 'shellscript',
            theme: `catppuccin-${flavor}`,
            transformers: [
              {
                line(node, line) {
                  if (highlight && line >= highlight[0] && line <= highlight[1]) this.addClassToHast(node, 'hl');
                },
              },
            ],
          });
          setHtml(out);
        })
        .catch(() => alive && setHtml(null));
    }, 40);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [code, flavor, highlight]);

  // Bring the highlighted lines into view inside the scrolling code box (never the page).
  useEffect(() => {
    const root = ref.current;
    const box = root?.parentElement;
    const el = root?.querySelector<HTMLElement>('.line.hl');
    if (!highlight || !box || !el) return;
    const top = el.offsetTop - root!.offsetTop;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 40)
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: 'smooth' });
  }, [html, highlight]);

  if (!html)
    return (
      <div className="code-view" ref={ref}>
        <pre>
          <code>
            {code.split('\n').map((l, i) => (
              <span key={i} className={`line${highlight && i + 1 >= highlight[0] && i + 1 <= highlight[1] ? ' hl' : ''}`}>
                {l}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      </div>
    );
  return <div className="code-view" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
