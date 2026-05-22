// Thin client over the /api/auth/* + /api/me endpoints. No state; the React layer (useAuth)
// holds the cached user; this module only does network.

export interface GraffelUser {
  id: string
  email: string
  name: string
  picture?: string | null
}

export async function fetchMe(): Promise<GraffelUser | null> {
  const res = await fetch('/api/me', { credentials: 'same-origin' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`/api/me returned ${res.status}`)
  return (await res.json()) as GraffelUser
}

/**
 * Send the user to Google. The server issues the challenge; we just navigate.
 * Returns the URL we navigated to (so callers can intercept in tests).
 */
export function signInWithGoogle(returnUrl: string = window.location.pathname): string {
  const url = `/api/auth/google/start?returnUrl=${encodeURIComponent(returnUrl)}`
  window.location.assign(url)
  return url
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/signout', { method: 'POST', credentials: 'same-origin' })
}
