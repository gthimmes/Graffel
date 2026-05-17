// Token-substring matcher with prefix bonus. See ADR-0006.

export interface Rankable {
  id: string
  label: string
  keywords?: string[]
}

const PREFIX_BONUS = 5
const CONTAINS_BONUS = 2

export function scoreMatch(query: string, haystack: string): number | null {
  if (query.length === 0) return 0
  if (haystack.length === 0) return null
  const q = query.toLowerCase()
  const h = haystack.toLowerCase()

  // All query chars must appear in order in haystack.
  let hi = 0
  let chars = 0
  for (const c of q) {
    const next = h.indexOf(c, hi)
    if (next === -1) return null
    hi = next + 1
    chars++
  }

  // Prefix / token bonuses.
  let bonus = 0
  const queryTokens = q.split(/\s+/).filter(Boolean)
  const haystackTokens = h.split(/\s+/).filter(Boolean)
  for (const qt of queryTokens) {
    for (const ht of haystackTokens) {
      if (ht.startsWith(qt)) { bonus += PREFIX_BONUS; break }
      if (ht.includes(qt))   { bonus += CONTAINS_BONUS; break }
    }
  }

  return chars + bonus
}

export function rankCommands<T extends Rankable>(commands: T[], query: string): T[] {
  if (query.trim().length === 0) return commands.slice()
  const scored: Array<{ cmd: T; score: number }> = []
  for (const cmd of commands) {
    const hay = `${cmd.label} ${cmd.keywords?.join(' ') ?? ''}`.trim()
    const s = scoreMatch(query, hay)
    if (s === null) continue
    scored.push({ cmd, score: s })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.map((x) => x.cmd)
}
