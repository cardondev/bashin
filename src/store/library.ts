/**
 * Prompts saved in this browser.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { validateDoc } from '../lib/doc';
import type { PromptDoc } from '../lib/model';
import { newId } from '../lib/model';
import { storage } from './storage';

export interface SavedPrompt {
  id: string;
  name: string;
  doc: PromptDoc;
  savedAt: number;
}

interface LibraryState {
  saved: SavedPrompt[];
  save(doc: PromptDoc): SavedPrompt;
  remove(id: string): void;
  rename(id: string, name: string): void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      saved: [],
      save(doc) {
        const existing = get().saved.find((s) => s.name === doc.name);
        const entry: SavedPrompt = {
          id: existing?.id ?? newId(),
          name: doc.name,
          doc: structuredClone(doc),
          savedAt: Date.now(),
        };
        set({ saved: [entry, ...get().saved.filter((s) => s.id !== entry.id)].slice(0, 60) });
        return entry;
      },
      remove: (id) => set({ saved: get().saved.filter((s) => s.id !== id) }),
      rename: (id, name) =>
        set({ saved: get().saved.map((s) => (s.id === id ? { ...s, name, doc: { ...s.doc, name } } : s)) }),
    }),
    {
      name: 'bashin:library',
      version: 1,
      storage,
      merge: (persisted, current) => {
        const list = ((persisted as { saved?: SavedPrompt[] } | undefined)?.saved ?? []).flatMap((s) => {
          const doc = validateDoc(s?.doc);
          return doc ? [{ ...s, doc }] : [];
        });
        return { ...current, saved: list };
      },
    },
  ),
);
