import { useEffect, useState } from 'react'
import { useSaveStatusStore } from './saveStatusStore'
import { timeAgo } from './timeAgo'

/** Toolbar "did my work save?" indicator: Saving… / ✓ Saved · 2s ago. */
export function SaveStatus() {
  const status = useSaveStatusStore((s) => s.status)
  const lastSavedAt = useSaveStatusStore((s) => s.lastSavedAt)

  // Re-render periodically so the relative time stays fresh while idle.
  const [, tick] = useState(0)
  useEffect(() => {
    if (status !== 'saved') return
    const id = window.setInterval(() => tick((n) => n + 1), 15_000)
    return () => window.clearInterval(id)
  }, [status])

  if (status === 'idle') return null

  return (
    <span
      className={`graffel-save-status is-${status}`}
      data-testid="save-status"
      title={lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleString()}` : undefined}
      aria-live="polite"
    >
      {status === 'saving'
        ? 'Saving…'
        : `✓ Saved${lastSavedAt ? ` · ${timeAgo(lastSavedAt)}` : ''}`}
    </span>
  )
}
