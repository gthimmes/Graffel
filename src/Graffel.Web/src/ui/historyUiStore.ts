import { create } from 'zustand'

// v3.26 — controls the version-history panel. `version` bumps after any snapshot
// mutation so the panel re-reads localStorage without a subscription.

interface HistoryUiState {
  open: boolean
  version: number
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  bump: () => void
}

export const useHistoryUiStore = create<HistoryUiState>((set) => ({
  open: false,
  version: 0,
  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),
  togglePanel: () => set((s) => ({ open: !s.open })),
  bump: () => set((s) => ({ version: s.version + 1 })),
}))
