import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFile, getFile, listFiles, updateFile } from './driveClient'

function mockFetch(impl: (url: string, init?: RequestInit) => { status: number; body?: unknown; text?: string }) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const { status, body, text } = impl(url, init)
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => text ?? '',
    } as Response
  })
}

afterEach(() => { vi.restoreAllMocks() })

describe('driveClient', () => {
  it('listFiles GETs the collection', async () => {
    const fetchMock = mockFetch(() => ({ status: 200, body: [{ id: '1', name: 'a', modifiedTime: 't' }] }))
    vi.stubGlobal('fetch', fetchMock)
    const files = await listFiles()
    expect(files).toHaveLength(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/drive/files')
  })

  it('getFile encodes the id in the path', async () => {
    const fetchMock = mockFetch(() => ({ status: 200, body: { id: 'a/b', name: 'x', modifiedTime: 't', body: '{}' } }))
    vi.stubGlobal('fetch', fetchMock)
    await getFile('a/b')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/drive/files/a%2Fb')
  })

  it('createFile POSTs name + body', async () => {
    const fetchMock = mockFetch(() => ({ status: 200, body: { id: '1', name: 'Doc', modifiedTime: 't' } }))
    vi.stubGlobal('fetch', fetchMock)
    await createFile('Doc', '{"a":1}')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/drive/files')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init!.body as string)).toEqual({ name: 'Doc', body: '{"a":1}' })
  })

  it('updateFile PUTs to the encoded id with name + body', async () => {
    const fetchMock = mockFetch(() => ({ status: 200, body: { id: 'x y', name: 'Doc', modifiedTime: 't' } }))
    vi.stubGlobal('fetch', fetchMock)
    await updateFile('x y', 'Doc', 'body')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/drive/files/x%20y')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init!.body as string)).toEqual({ name: 'Doc', body: 'body' })
  })

  it('surfaces a failed response as an error carrying the status and server text', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ status: 403, text: 'forbidden' })))
    await expect(listFiles()).rejects.toThrow(/403.*forbidden/)
  })
})
