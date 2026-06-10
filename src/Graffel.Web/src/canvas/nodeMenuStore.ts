import { create } from 'zustand'

interface NodeMenuState {
  open: { x: number; y: number } | null
  openAt: (x: number, y: number) => void
  close: () => void
}

export const useNodeMenuStore = create<NodeMenuState>((set) => ({
  open: null,
  openAt: (x, y) => set({ open: { x, y } }),
  close: () => set({ open: null }),
}))
