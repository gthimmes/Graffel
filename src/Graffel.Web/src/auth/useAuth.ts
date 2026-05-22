import { useCallback, useEffect, useState } from 'react'
import { fetchMe, signOut as apiSignOut, type GraffelUser } from './authClient'

export type AuthStatus = 'loading' | 'anonymous' | 'signed-in'

interface AuthState {
  status: AuthStatus
  user: GraffelUser | null
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAuth(): AuthState {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<GraffelUser | null>(null)

  const refresh = useCallback(async () => {
    try {
      const me = await fetchMe()
      setUser(me)
      setStatus(me ? 'signed-in' : 'anonymous')
    } catch {
      // Network blip — treat as anonymous; user can retry.
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const signOut = useCallback(async () => {
    await apiSignOut()
    setUser(null)
    setStatus('anonymous')
  }, [])

  return { status, user, signOut, refresh }
}
