import { useEffect } from 'react'
import { create } from 'zustand'

// Light/dark theme (v3.20). The whole UI is driven by CSS variables, so a theme
// is just which variable block applies — toggled via a `data-theme` attribute on
// <html>. Shape fills/text are authored colors (not themed), so diagrams keep
// their look on a dark canvas.

export type ThemePref = 'light' | 'dark' | 'system'
const KEY = 'graffel.theme.v1'

function load(): ThemePref {
  if (typeof localStorage === 'undefined') return 'system'
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

/** Resolve a preference to a concrete theme, consulting the OS for 'system'. */
export function resolvePref(pref: ThemePref): 'light' | 'dark' {
  if (pref !== 'system') return pref
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

interface ThemeState {
  pref: ThemePref
  setPref: (p: ThemePref) => void
  /** Flip between light and dark (resolving 'system' first). */
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  pref: load(),
  setPref: (pref) => {
    try { localStorage.setItem(KEY, pref) } catch { /* private mode */ }
    set({ pref })
  },
  toggle: () => {
    const next = resolvePref(get().pref) === 'dark' ? 'light' : 'dark'
    get().setPref(next)
  },
}))

/** Reflect the current theme onto <html data-theme> and track OS changes. */
export function useApplyTheme(): void {
  const pref = useThemeStore((s) => s.pref)
  useEffect(() => {
    const apply = () => { document.documentElement.dataset.theme = resolvePref(pref) }
    apply()
    if (pref === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [pref])
}
