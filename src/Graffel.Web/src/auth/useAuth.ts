import { useEffect } from 'react'
import { create } from 'zustand'
import { fetchMe, signOut as apiSignOut, type GraffelUser } from './authClient'

export type AuthStatus = 'loading' | 'anonymous' | 'signed-in'

interface AuthStoreState {
  status: AuthStatus
  user: GraffelUser | null
  hydrated: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'loading',
  user: null,
  hydrated: false,

  async refresh() {
    try {
      const me = await fetchMe()
      set({ user: me, status: me ? 'signed-in' : 'anonymous', hydrated: true })
    } catch {
      set({ user: null, status: 'anonymous', hydrated: true })
    }
  },

  async signOut() {
    await apiSignOut()
    set({ user: null, status: 'anonymous' })
  },
}))

interface AuthState {
  status: AuthStatus
  user: GraffelUser | null
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAuth(): AuthState {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)
  const refresh = useAuthStore((s) => s.refresh)
  const signOut = useAuthStore((s) => s.signOut)

  useEffect(() => {
    if (!hydrated) void refresh()
  }, [hydrated, refresh])

  return { status, user, signOut, refresh }
}
