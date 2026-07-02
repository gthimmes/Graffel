import { create } from 'zustand'

// v3.26 — the autosave "did my work save?" signal. The debounced autosave effect
// flips this to 'saving' when a change lands and 'saved' once it's persisted.

interface SaveStatusState {
  status: 'idle' | 'saving' | 'saved'
  lastSavedAt: number | null
  markSaving: () => void
  markSaved: (at?: number) => void
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: 'idle',
  lastSavedAt: null,
  markSaving: () => set({ status: 'saving' }),
  markSaved: (at = Date.now()) => set({ status: 'saved', lastSavedAt: at }),
}))
