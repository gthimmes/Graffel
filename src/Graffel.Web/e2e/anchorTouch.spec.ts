import { expect, test } from '@playwright/test'

// v3.10 goal: EVERY shape must connect on all four sides with the line meeting
// the drawn silhouette. This is the gold-standard check: for each shape it
// creates a real edge off each side, reads the rendered edge path's start point,
// and measures its distance to the nearest painted pixel of the shape. A gap
// between the shape edge and where the line starts shows up as a large distance.
// (We measure the actual SVG path, not the handle position — React Flow offsets
// the attachment from the handle, so only the path tells the truth.)

const TOL = 4 // px — line start this close to the silhouette reads as "touching"
const SIZE_MODES = ['default', 'wide', 'tall'] as const

test('every shape: the connector line meets the silhouette on all 4 sides (all sizes)', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  const failures = await page.evaluate(async ({ sizeModes, tol }) => {
    const w = window as unknown as { __graffel: { useDiagramStore: any; allShapeIds: () => string[] } }
    const store = w.__graffel.useDiagramStore
    const ids: string[] = w.__graffel.allShapeIds()
    const SIDES = [
      { side: 'right',  dx: 600, dy: 0,    th: 'left' },
      { side: 'left',   dx: -600, dy: 0,   th: 'right' },
      { side: 'top',    dx: 0,   dy: -500, th: 'bottom' },
      { side: 'bottom', dx: 0,   dy: 500,  th: 'top' },
    ] as const

    async function drawnPixels(svgEl: SVGElement, bw: number, bh: number) {
      const clone = svgEl.cloneNode(true) as SVGElement
      clone.setAttribute('width', String(bw)); clone.setAttribute('height', String(bh))
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone))
      const img = new Image()
      await new Promise((res, rej) => { img.onload = res as () => void; img.onerror = rej; img.src = url })
      const cw = Math.max(1, Math.round(bw)), ch = Math.max(1, Math.round(bh))
      const c = document.createElement('canvas'); c.width = cw; c.height = ch
      const ctx = c.getContext('2d')!; ctx.clearRect(0, 0, cw, ch); ctx.drawImage(img, 0, 0, cw, ch)
      const d = ctx.getImageData(0, 0, cw, ch).data
      const pts: number[][] = []
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 10) pts.push([x, y])
      return pts
    }
    function minDist(pts: number[][], hx: number, hy: number) {
      let best = Infinity
      for (const [x, y] of pts) { const dd = (x - hx) ** 2 + (y - hy) ** 2; if (dd < best) best = dd }
      return Math.sqrt(best)
    }

    const fails: string[] = []
    for (const id of ids) {
      for (const mode of sizeModes) {
        store.setState({ nodes: [], edges: [], selectedNodeIds: [], selectedEdgeIds: [] })
        const srcPos = { x: 700, y: 500 }
        const nid: string = store.getState().addNode(id, srcPos)
        const def = store.getState().nodes.find((n: any) => n.id === nid)
        const size = mode === 'wide' ? { w: 220, h: 90 } : mode === 'tall' ? { w: 90, h: 200 } : def.size
        if (mode !== 'default') store.getState().updateNodeSize(nid, size)

        // One target + one edge per side.
        const edgeBySide: Record<string, string> = {}
        for (const sd of SIDES) {
          const tid = store.getState().addNode('basic:rectangle', { x: srcPos.x + sd.dx, y: srcPos.y + sd.dy })
          const eid = store.getState().addEdge(nid, tid, { sourceHandle: sd.side, targetHandle: sd.th, type: 'straight' })
          if (eid) edgeBySide[sd.side] = eid
        }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

        const host = document.querySelector(`.react-flow__node[data-id="${nid}"] [data-shape-id]`)
        const svg = host?.querySelector('.graffel-shape-body svg') as SVGElement | null
        if (!host || !svg) { fails.push(`${id} [${mode}] no host/svg`); continue }
        const pts = await drawnPixels(svg, size.w, size.h)
        if (pts.length === 0) continue // label-only shapes (basic:text)
        const hr = host.getBoundingClientRect()
        const zx = hr.width / size.w, zy = hr.height / size.h

        for (const sd of SIDES) {
          const eid = edgeBySide[sd.side]
          const path = document.querySelector(`.react-flow__edge[data-id="${eid}"] .react-flow__edge-path`) as SVGPathElement | null
          if (!path) { fails.push(`${id} [${mode}] no ${sd.side} edge`); continue }
          const ctm = path.getScreenCTM()!
          const p0 = path.getPointAtLength(0)
          const sx = p0.x * ctm.a + p0.y * ctm.c + ctm.e
          const sy = p0.x * ctm.b + p0.y * ctm.d + ctm.f
          const bx = (sx - hr.left) / zx
          const by = (sy - hr.top) / zy
          const dist = minDist(pts, bx, by)
          if (dist > tol) fails.push(`${id} [${mode}] ${sd.side}=${dist.toFixed(1)}px`)
        }
      }
    }
    return fails
  }, { sizeModes: SIZE_MODES, tol: TOL })

  expect(failures, `connector line starts off the silhouette (>${TOL}px):\n${failures.join('\n')}`).toEqual([])
})
