import { create } from 'zustand'

// v3.24 — controls the Mermaid interop dialog. One dialog, two modes: paste-to-
// import or read-the-export. Null = closed.

interface MermaidUiState {
  mode: 'import' | 'export' | null
  openImport: () => void
  openExport: () => void
  close: () => void
}

export const useMermaidStore = create<MermaidUiState>((set) => ({
  mode: null,
  openImport: () => set({ mode: 'import' }),
  openExport: () => set({ mode: 'export' }),
  close: () => set({ mode: null }),
}))
