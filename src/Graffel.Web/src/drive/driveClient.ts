// Thin client over the /api/drive/* endpoints.

export interface DriveFileSummary {
  id: string
  name: string
  modifiedTime: string
}

export interface DriveFileContent extends DriveFileSummary {
  body: string
}

async function ok<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`)
  return (await res.json()) as T
}

export async function listFiles(): Promise<DriveFileSummary[]> {
  const res = await fetch('/api/drive/files', { credentials: 'same-origin' })
  return ok<DriveFileSummary[]>(res)
}

export async function getFile(id: string): Promise<DriveFileContent> {
  const res = await fetch(`/api/drive/files/${encodeURIComponent(id)}`, { credentials: 'same-origin' })
  return ok<DriveFileContent>(res)
}

export async function createFile(name: string, body: string): Promise<DriveFileSummary> {
  const res = await fetch('/api/drive/files', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, body }),
  })
  return ok<DriveFileSummary>(res)
}

export async function updateFile(id: string, name: string, body: string): Promise<DriveFileSummary> {
  const res = await fetch(`/api/drive/files/${encodeURIComponent(id)}`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, body }),
  })
  return ok<DriveFileSummary>(res)
}
