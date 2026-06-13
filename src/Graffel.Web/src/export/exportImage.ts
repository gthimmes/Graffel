import { toPng, toSvg } from 'html-to-image'

function viewport(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.react-flow__viewport')
}

function rfRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.react-flow')
}

interface Bounds { width: number; height: number }

function getBounds(): Bounds {
  const root = rfRoot()
  if (!root) return { width: 1024, height: 768 }
  const rect = root.getBoundingClientRect()
  return { width: Math.max(rect.width, 100), height: Math.max(rect.height, 100) }
}

export async function exportPng(): Promise<string | null> {
  const target = viewport()
  if (!target) return null
  const { width, height } = getBounds()
  return toPng(target, {
    width,
    height,
    backgroundColor: '#ffffff',
    cacheBust: true,
    pixelRatio: 2,
  })
}

/**
 * Put the current view on the system clipboard as a PNG — the "paste a diagram
 * straight into Slack / a doc" move. Returns false when there's nothing to
 * capture or the clipboard is unavailable (permission denied, insecure context).
 */
export async function copyPngToClipboard(): Promise<boolean> {
  const dataUrl = await exportPng()
  if (!dataUrl) return false
  try {
    const blob = await (await fetch(dataUrl)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

export async function exportSvg(): Promise<string | null> {
  const target = viewport()
  if (!target) return null
  const { width, height } = getBounds()
  return toSvg(target, {
    width,
    height,
    backgroundColor: '#ffffff',
    cacheBust: true,
  })
}
