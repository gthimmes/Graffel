import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchMe, signOut } from './authClient'

describe('authClient', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  describe('fetchMe', () => {
    it('returns the user object on 200', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'u1', email: 'a@x.com', name: 'A', picture: null }),
      } as unknown as Response)
      const me = await fetchMe()
      expect(me).toEqual({ id: 'u1', email: 'a@x.com', name: 'A', picture: null })
    })

    it('returns null on 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response)
      expect(await fetchMe()).toBeNull()
    })

    it('throws on unexpected status', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response)
      await expect(fetchMe()).rejects.toThrow()
    })
  })

  describe('signOut', () => {
    it('POSTs to /api/auth/signout with same-origin credentials', async () => {
      const f = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response)
      globalThis.fetch = f
      await signOut()
      expect(f).toHaveBeenCalledWith('/api/auth/signout', expect.objectContaining({ method: 'POST' }))
    })
  })
})
