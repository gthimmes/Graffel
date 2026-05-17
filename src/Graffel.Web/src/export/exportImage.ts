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
