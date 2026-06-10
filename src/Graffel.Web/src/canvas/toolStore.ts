import { create } from 'zustand'

/** Canvas pointer tool. 'select' rubber-bands a selection on left-drag; 'pan'
 *  grabs the canvas on left-drag. (Spacebar-hold temporarily forces panning.) */
export type Tool = 'select' | 'pan'

interface ToolState {
  tool: Tool
  setTool: (t: Tool) => void
}

export const useToolStore = create<ToolState>((set) => ({
  tool: 'select',
  setTool: (tool) => set({ tool }),
}))
