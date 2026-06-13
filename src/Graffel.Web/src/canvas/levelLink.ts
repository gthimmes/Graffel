// v3.17 — level deep-links. The current drill-down level is encoded in the URL
// hash (`#l=<containerId>`) so a link can open straight into a container. Hash
// keeps it client-side only — no server routes or share-format changes.

const PREFIX = 'l='

/** `#l=<id>` for a container, or '' for the root level. */
export function levelHash(id: string | null): string {
  return id ? `#${PREFIX}${encodeURIComponent(id)}` : ''
}

/** Extract the container id from a location hash, or null if absent/unrelated. */
export function parseLevelHash(hash: string): string | null {
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  if (!h.startsWith(PREFIX)) return null
  const raw = h.slice(PREFIX.length)
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
