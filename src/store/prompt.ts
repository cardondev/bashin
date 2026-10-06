/**
 * The prompt being edited, with undo/redo and local persistence.
 */
import { temporal } from 'zundo';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PRESET_ID, getPreset } from '../data/presets';
import { cloneDoc, groupEnd, makeElement, validateDoc } from '../lib/doc';
import type { ElementType, PromptDoc, PromptElement, PromptSettings, Style } from '../lib/model';
import { newId } from '../lib/model';
import { storage } from './storage';

export function defaultDoc(): PromptDoc {
  return cloneDoc(getPreset(DEFAULT_PRESET_ID)!.doc);
}

type StyleKey = 'style' | 'rootStyle' | 'errorStyle';

interface PromptState {
  doc: PromptDoc;
  setDoc(doc: PromptDoc): void;
  update(id: string, patch: Partial<PromptElement>): void;
  setOption(id: string, key: string, value: unknown): void;
  setStyle(id: string, which: StyleKey, patch: Partial<Style> | null): void;
  /** Insert a new element; returns its id. Groups bring their end marker along. */
  insert(type: ElementType, index?: number): string;
  remove(id: string): void;
  move(from: number, to: number): void;
  duplicate(id: string): string | null;
  setSettings(patch: Partial<PromptSettings>): void;
  setName(name: string): void;
}

function mapEl(doc: PromptDoc, id: string, fn: (e: PromptElement) => PromptElement): PromptDoc {
  return { ...doc, elements: doc.elements.map((e) => (e.id === id ? fn(e) : e)) };
}

export const usePrompt = create<PromptState>()(
  persist(
    temporal(
      (set, get) => ({
        doc: defaultDoc(),
        setDoc: (doc) => set({ doc }),
        update: (id, patch) => set({ doc: mapEl(get().doc, id, (e) => ({ ...e, ...patch })) }),
        setOption: (id, key, value) =>
          set({ doc: mapEl(get().doc, id, (e) => ({ ...e, options: { ...(e.options ?? {}), [key]: value } })) }),
        setStyle: (id, which, patch) =>
          set({
            doc: mapEl(get().doc, id, (e) => {
              if (patch === null) {
                const { [which]: _drop, ...rest } = e;
                return rest as PromptElement;
              }
              const next: Style = { ...(e[which] ?? {}), ...patch };
              for (const k of Object.keys(next) as (keyof Style)[]) if (next[k] === undefined || next[k] === false) delete next[k];
              return { ...e, [which]: next };
            }),
          }),
        insert: (type, index) => {
          const doc = get().doc;
          const els = [...doc.elements];
          const at = index === undefined ? els.length : Math.max(0, Math.min(els.length, index));
          const el = makeElement(type);
          if (type === 'group') els.splice(at, 0, el, makeElement('group-end'));
          else els.splice(at, 0, el);
          set({ doc: { ...doc, elements: els } });
          return el.id;
        },
        remove: (id) => {
          const doc = get().doc;
          const i = doc.elements.findIndex((e) => e.id === id);
          if (i < 0) return;
          const els = [...doc.elements];
          if (els[i].type === 'group') {
            const end = groupEnd(els, i);
            if (end > i) els.splice(end, 1);
          }
          els.splice(i, 1);
          set({ doc: { ...doc, elements: els } });
        },
        move: (from, to) => {
          const doc = get().doc;
          const els = [...doc.elements];
          if (from < 0 || from >= els.length) return;
          const [el] = els.splice(from, 1);
          els.splice(Math.max(0, Math.min(els.length, to)), 0, el);
          set({ doc: { ...doc, elements: els } });
        },
        duplicate: (id) => {
          const doc = get().doc;
          const i = doc.elements.findIndex((e) => e.id === id);
          if (i < 0) return null;
          const src = doc.elements[i];
          if (src.type === 'group-end') return null;
          const els = [...doc.elements];
          if (src.type === 'group') {
            const end = groupEnd(els, i);
            const block = (end > i ? els.slice(i, end + 1) : [src]).map((e) => ({ ...structuredClone(e), id: newId() }));
            els.splice((end > i ? end : i) + 1, 0, ...block);
            set({ doc: { ...doc, elements: els } });
            return block[0].id;
          }
          const copy = { ...structuredClone(src), id: newId() };
          els.splice(i + 1, 0, copy);
          set({ doc: { ...doc, elements: els } });
          return copy.id;
        },
        setSettings: (patch) => set({ doc: { ...get().doc, settings: { ...get().doc.settings, ...patch } } }),
        setName: (name) => set({ doc: { ...get().doc, name } }),
      }),
      {
        partialize: (s) => ({ doc: s.doc }),
        limit: 150,
        equality: (a, b) => a.doc === b.doc,
        // A burst of edits (typing in a field) becomes one undo step.
        handleSet: (handleSet) => {
          let timer: ReturnType<typeof setTimeout> | null = null;
          return (...args: Parameters<typeof handleSet>) => {
            if (!timer) handleSet(...args);
            else clearTimeout(timer);
            timer = setTimeout(() => (timer = null), 450);
          };
        },
      },
    ),
    {
      name: 'bashin:prompt',
      version: 1,
      storage,
      partialize: (s) => ({ doc: s.doc }),
      merge: (persisted, current) => {
        const doc = validateDoc((persisted as { doc?: unknown } | undefined)?.doc);
        return { ...current, ...(doc ? { doc } : {}) };
      },
    },
  ),
);

export const undo = () => usePrompt.temporal.getState().undo();
export const redo = () => usePrompt.temporal.getState().redo();
