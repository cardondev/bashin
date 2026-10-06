import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { getPalette } from './data/palettes';
import { compile } from './lib/compile';
import type { Program } from './lib/ir';
import { generate, type GenResult, type Shell } from './lib/gen/shell';
import type { PromptDoc } from './lib/model';
import { historyFor, renderSession, type SessionStep } from './lib/render';
import { DEMO_SCRIPT, DEFAULT_SCENARIO, effectiveScenario, type Scenario } from './lib/scenario';
import type { Depth } from './lib/sgr';

export function useCompiled(doc: PromptDoc): Program {
  return useMemo(() => compile(doc), [doc]);
}

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** Wall clock that ticks every second while enabled. */
export function useNow(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(Date.now());
      t = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    return () => clearTimeout(t);
  }, [enabled]);
  return now;
}

/** How many terminal columns fit in an element at a font size. */
export function useFitCols(ref: RefObject<HTMLElement | null>, fontSize: number, padding = 32): number | null {
  const [cols, setCols] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const probe = document.createElement('span');
    probe.className = 'term';
    probe.style.cssText = `position:absolute;visibility:hidden;font-size:${fontSize}px;white-space:pre`;
    probe.textContent = '0'.repeat(50);
    document.body.appendChild(probe);
    const measure = () => {
      const cw = probe.getBoundingClientRect().width / 50 || fontSize * 0.6;
      const w = el.getBoundingClientRect().width - padding;
      setCols(Math.max(30, Math.min(200, Math.floor(w / cw))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      probe.remove();
    };
  }, [ref, fontSize, padding]);
  return cols;
}

/** A font size that fits `cols` terminal columns into an element. */
export function useFitFont(ref: RefObject<HTMLElement | null>, cols: number, padding = 28, max = 13): number {
  const [size, setSize] = useState(11);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width - padding;
      // JetBrains Mono advances 0.6em per cell
      setSize(Math.max(6, Math.min(max, Math.floor((w / (cols * 0.6)) * 10) / 10)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, cols, padding, max]);
  return size;
}

export interface DemoState {
  history: SessionStep[];
  typed: string;
  scenario: Scenario;
}

/** Plays the scripted demo session: types each command, shows its output, updates the state. */
export function useDemo(active: boolean, base: Scenario): DemoState | null {
  const [state, setState] = useState<DemoState | null>(null);
  const baseRef = useRef(base);
  useEffect(() => {
    baseRef.current = base;
  }, [base]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((res) => timers.push(setTimeout(res, ms)));
    const run = async () => {
      while (!cancelled) {
        let scn: Scenario = {
          ...baseRef.current,
          root: false,
          ssh: false,
          host: DEFAULT_SCENARIO.host,
          cwd: DEFAULT_SCENARIO.home,
          home: DEFAULT_SCENARIO.home,
          git: null,
          venv: '',
          exitCode: 0,
          durationMs: 0,
          jobs: 0,
          time: Date.now(),
        };
        let history: SessionStep[] = [];
        setState({ history, typed: '', scenario: scn });
        await wait(900);
        for (const step of DEMO_SCRIPT) {
          for (let i = 1; i <= step.cmd.length && !cancelled; i++) {
            setState({ history, typed: step.cmd.slice(0, i), scenario: scn });
            await wait(38 + Math.random() * 55);
          }
          if (cancelled) return;
          await wait(420);
          history = [...history, { scenario: scn, cmd: step.cmd, out: step.out ?? [] }].slice(-5);
          scn = { ...scn, ...step.after, time: Date.now() };
          setState({ history, typed: '', scenario: scn });
          await wait(step.pause ?? 950);
        }
        await wait(2600);
      }
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      setState(null);
    };
  }, [active]);

  return active ? state : null;
}

export interface PreviewInput {
  prog: Program;
  doc: PromptDoc;
  scenario: Scenario;
  cols: number;
  depth: Depth;
  showHistory: boolean;
  demo: DemoState | null;
  now: number | null;
  typed?: string;
}

export function useSession(i: PreviewInput) {
  return useMemo(() => {
    const palette = getPalette(i.doc.settings.palette);
    const time = i.now ?? i.scenario.time;
    if (i.demo) {
      return renderSession(i.prog, {
        palette,
        depth: i.depth,
        tags: true,
        history: i.demo.history.map((h) => ({ ...h, scenario: { ...h.scenario, cols: i.cols } })),
        current: { ...i.demo.scenario, cols: i.cols, time },
        typed: i.demo.typed,
      });
    }
    const current = { ...i.scenario, cols: i.cols, time };
    const prev = i.showHistory ? historyFor(effectiveScenario(current)) : null;
    return renderSession(i.prog, {
      palette,
      depth: i.depth,
      tags: true,
      history: prev ? [{ ...prev, scenario: { ...prev.scenario, time: time - 61_000 } }] : [],
      current,
      typed: i.typed,
    });
  }, [i.prog, i.doc.settings.palette, i.scenario, i.cols, i.depth, i.showHistory, i.demo, i.now, i.typed]);
}

export function useGenerated(prog: Program, doc: PromptDoc, shell: Shell): GenResult {
  return useMemo(
    () =>
      generate(prog, {
        shell,
        depth: doc.settings.depth,
        palette: getPalette(doc.settings.palette),
        name: doc.name,
      }),
    [prog, doc.settings.depth, doc.settings.palette, doc.name, shell],
  );
}
