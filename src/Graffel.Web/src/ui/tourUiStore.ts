import { create } from 'zustand'

// v3.23 — ephemeral UI state for the walkthrough authoring panel. The tour
// content itself lives in the diagram store (and the document); this only tracks
// whether the editor-side panel is open.
interface TourUiState {
  panelOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

export const useTourUiStore = create<TourUiState>((set) => ({
  panelOpen: false,
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}))
