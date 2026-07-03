import { create } from 'zustand'

// v3.27 — controls the "From docker-compose" import dialog (living diagrams).
// open === true shows the paste/drop dialog; null/false = closed.

interface ComposeUiState {
  open: boolean
  openImport: () => void
  close: () => void
}

export const useComposeStore = create<ComposeUiState>((set) => ({
  open: false,
  openImport: () => set({ open: true }),
  close: () => set({ open: false }),
}))
