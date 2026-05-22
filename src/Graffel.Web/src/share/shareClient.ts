export interface CreateShareResponse {
  token: string
  url: string
  createdAt: string
}

export interface ResolveShareResponse {
  title: string
  body: string
  createdAt: string
}

export async function createShare(opts: { driveFileId?: string; body?: string; title?: string }): Promise<CreateShareResponse> {
  const res = await fetch('/api/share', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  })
  if (!res.ok) throw new Error(`Share create failed: ${res.status}`)
  return (await res.json()) as CreateShareResponse
}

export async function resolveShare(token: string): Promise<ResolveShareResponse | null> {
  const res = await fetch(`/api/share/${encodeURIComponent(token)}`, { credentials: 'same-origin' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Share resolve failed: ${res.status}`)
  return (await res.json()) as ResolveShareResponse
}
