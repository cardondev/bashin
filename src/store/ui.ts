/**
 * Everything about the editor that is not the prompt itself.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccentToken } from '../data/palette-types';
import type { Shell } from '../lib/gen/shell';
import { DEFAULT_SCENARIO, type Scenario } from '../lib/scenario';
import { storage } from './storage';

export type Flavor = 'mocha' | 'macchiato' | 'frappe' | 'latte';
export type DarkFlavor = Exclude<Flavor, 'latte'>;
export type View = 'builder' | 'gallery' | 'learn';

interface UIState {
  flavor: Flavor;
  darkFlavor: DarkFlavor;
  accent: AccentToken;
  view: View;
  selectedId: string | null;
  hoverId: string | null;
  shell: Shell;
  scenario: Scenario;
  liveClock: boolean;
  showHistory: boolean;
  fontSize: number;
  demo: boolean;
  installer: boolean;
  paletteOpen: boolean;
  importOpen: boolean;
  setFlavor(f: Flavor): void;
  toggleDark(): void;
  setAccent(a: AccentToken): void;
  setView(v: View): void;
  select(id: string | null): void;
  hover(id: string | null): void;
  setShell(s: Shell): void;
  patchScenario(p: Partial<Scenario>): void;
  setScenario(s: Scenario): void;
  set<K extends keyof UIState>(key: K, value: UIState[K]): void;
}

export function applyTheme(flavor: Flavor, accent: AccentToken) {
  const d = document.documentElement;
  d.dataset.theme = flavor;
  d.dataset.accent = accent;
  const meta = document.querySelector('meta[name="theme-color"]');
  const bg = getComputedStyle(d).getPropertyValue('--ctp-base').trim();
  if (meta && bg) meta.setAttribute('content', bg);
}

function viewFromHash(): View {
  const h = typeof location === 'undefined' ? '' : location.hash.replace(/^#\/?/, '');
  return h === 'gallery' || h === 'learn' ? h : 'builder';
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      flavor: 'mocha',
      darkFlavor: 'mocha',
      accent: 'mauve',
      view: viewFromHash(),
      selectedId: null,
      hoverId: null,
      shell: 'bash',
      scenario: DEFAULT_SCENARIO,
      liveClock: true,
      showHistory: true,
      fontSize: 14,
      demo: false,
      installer: false,
      paletteOpen: false,
      importOpen: false,
      setFlavor: (flavor) => {
        set({ flavor, ...(flavor !== 'latte' ? { darkFlavor: flavor } : {}) });
        applyTheme(flavor, get().accent);
      },
      toggleDark: () => get().setFlavor(get().flavor === 'latte' ? get().darkFlavor : 'latte'),
      setAccent: (accent) => {
        set({ accent });
        applyTheme(get().flavor, accent);
      },
      setView: (view) => {
        set({ view });
        const hash = view === 'builder' ? '' : `#${view}`;
        if (location.hash !== hash) history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      },
      select: (selectedId) => set({ selectedId }),
      hover: (hoverId) => set({ hoverId }),
      setShell: (shell) => set({ shell }),
      patchScenario: (p) => set({ scenario: { ...get().scenario, ...p } }),
      setScenario: (scenario) => set({ scenario }),
      set: (key, value) => set({ [key]: value } as Partial<UIState>),
    }),
    {
      name: 'bashin:ui',
      version: 1,
      storage,
      partialize: (s) => ({
        flavor: s.flavor,
        darkFlavor: s.darkFlavor,
        accent: s.accent,
        shell: s.shell,
        liveClock: s.liveClock,
        showHistory: s.showHistory,
        fontSize: s.fontSize,
        installer: s.installer,
        scenario: s.scenario,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UIState>;
        return {
          ...current,
          ...p,
          scenario: { ...DEFAULT_SCENARIO, ...(p.scenario ?? {}) },
          view: current.view,
        };
      },
    },
  ),
);

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => useUI.setState({ view: viewFromHash() }));
}
