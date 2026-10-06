import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** localStorage that never throws (private windows, blocked storage, previews). */
const safe: StateStorage = {
  getItem(name) {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* storage unavailable — keep working in memory */
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const storage = createJSONStorage(() => safe);
