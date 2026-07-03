import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createShare, resolveShare } from './shareClient'

// A tiny fetch stub so the client's status-handling logic is tested without a server.
function mockFetch(impl: (url: string, init?: RequestInit) => { status: number; body?: unknown }) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const { status, body } = impl(url, init)
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response
  })
}

describe('createShare', () => {
  beforeEach(() => { vi.restoreAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('POSTs to /api/share and returns the parsed response', async () => {
    const fetchMock = mockFetch(() => ({ status: 200, body: { token: 'abc', url: '/v/abc', createdAt: 't' } }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await createShare({ title: 'Doc', body: '{}' })
    expect(res).toEqual({ token: 'abc', url: '/v/abc', createdAt: 't' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/share')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init!.body as string)).toEqual({ title: 'Doc', body: '{}' })
  })

  it('throws on a non-ok status', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ status: 500 })))
    await expect(createShare({})).rejects.toThrow(/500/)
  })
})

describe('resolveShare', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('returns the parsed body on success and encodes the token in the URL', async () => {
    const fetchMock = mockFetch(() => ({ status: 200, body: { title: 'T', body: '{}', createdAt: 't' } }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await resolveShare('a b/c')
    expect(res).toEqual({ title: 'T', body: '{}', createdAt: 't' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/share/a%20b%2Fc')
  })

  it('returns null for a 404 (unknown token)', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ status: 404 })))
    expect(await resolveShare('gone')).toBeNull()
  })

  it('throws on other error statuses', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ status: 500 })))
    await expect(resolveShare('x')).rejects.toThrow(/500/)
  })
})
