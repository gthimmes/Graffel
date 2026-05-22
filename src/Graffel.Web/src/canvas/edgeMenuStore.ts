import { create } from 'zustand'

interface EdgeMenuState {
  open: { edgeId: string; x: number; y: number } | null
  openAt: (edgeId: string, x: number, y: number) => void
  close: () => void
}

export const useEdgeMenuStore = create<EdgeMenuState>((set) => ({
  open: null,
  openAt: (edgeId, x, y) => set({ open: { edgeId, x, y } }),
  close: () => set({ open: null }),
}))
