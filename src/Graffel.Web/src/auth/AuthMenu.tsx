import { useAuth } from './useAuth'
import { signInWithGoogle } from './authClient'

export function AuthMenu() {
  const { status, user, signOut } = useAuth()

  if (status === 'loading') {
    return <span className="auth-loading" data-testid="auth-loading">…</span>
  }

  if (status === 'anonymous') {
    return (
      <button
        type="button"
        className="auth-signin-btn"
        onClick={() => signInWithGoogle()}
        data-testid="auth-signin"
      >
        Sign in with Google
      </button>
    )
  }

  return (
    <div className="auth-user-chip" data-testid="auth-user-chip">
      {user!.picture ? (
        <img className="auth-avatar" src={user!.picture} alt="" />
      ) : (
        <span className="auth-avatar auth-avatar-fallback">{initials(user!.name)}</span>
      )}
      <span className="auth-name" data-testid="auth-user-name">{user!.name}</span>
      <button
        type="button"
        className="auth-signout-btn"
        onClick={() => void signOut()}
        data-testid="auth-signout"
        title="Sign out"
      >
        Sign out
      </button>
    </div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}
