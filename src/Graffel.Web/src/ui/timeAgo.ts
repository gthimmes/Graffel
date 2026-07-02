// Compact relative-time formatting for the save indicator + version history.
// Pure and unit-tested; pass `now` for determinism (defaults to Date.now()).

export function timeAgo(when: number | string, now: number = Date.now()): string {
  const then = typeof when === 'string' ? new Date(when).getTime() : when
  const secs = Math.max(0, Math.round((now - then) / 1000))
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
