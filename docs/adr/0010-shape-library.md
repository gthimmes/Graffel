# ADR-0010: Shape library — pack-based registry

**Status:** Accepted
**Date:** 2026-05-22
**Decision owner:** Architect

## Context

v1 shipped with eight hard-coded shape types and a palette that rendered each as a text label next to a colored swatch. To be credible as an "architecture-first" tool we need:

- Dozens (eventually hundreds) of shapes.
- Visual previews in the palette, not text-and-swatch.
- Categories: Basic, Architecture Core, AWS, GCP, Azure, Kubernetes, Flowchart, UML, etc.
- A user-controllable way to hide categories that don't apply.

This decision sets the architecture so adding the eighth pack is the same shape of work as adding the first.

## Decision

### Pack-based registry

A shape is a `ShapeDef`. A pack is a named array of `ShapeDef`s. Packs are registered at module load.

```ts
interface ShapeDef {
  id: string                    // 'basic:rectangle', 'aws:ec2', 'k8s:pod'
  packId: string                // 'basic', 'aws', 'k8s'
  label: string                 // shown in tooltip + library manager
  keywords?: string[]           // boosts palette-search matches
  defaultSize: { w: number; h: number }
  defaultStyle?: NodeStyle      // per-shape style overrides
  render: ShapeRenderer         // function: (props) => ReactNode
}

interface Pack {
  id: string                    // 'basic'
  label: string                 // 'Basic'
  shapes: ShapeDef[]
  defaultEnabled: boolean       // user can toggle in Library Manager
}
```

All shapes flow through a single React Flow node type (`shape`). The custom `ShapeNode` looks up the `ShapeDef` by id and renders via its `render` function. The node's `data` carries `{ shapeId, label, style? }` — the body content is the shape's visual; the user's text label is overlaid.

### Why pack-based and not "type literal"

The v1 model — `NodeType` as a TS string-literal union — was fine for 8 shapes. It does not scale to 200. Pack-based registry means:
- Adding a pack is one file; no changes to the canvas, store, or file format.
- File format already supports any string for `node.type` (per ADR-0002, `data.style` is open) — we just start using `shapeId` strings like `'aws:ec2'`.
- Library Manager can flip pack visibility without touching the data.

### Backward compatibility with v1 shape ids

v1 nodes used type strings like `'rectangle'`, `'service'`, etc. Loading an old `.graffel` file must still work. Two paths:

1. The Basic pack registers shapes with `'basic:rectangle'` AND aliases `'rectangle'` to the same definition.
2. On load, the file-format module rewrites legacy ids to their pack-qualified form (`migrate v1 -> v2 of the file format`).

Path 1 (alias map) is simpler for v3.0 — no schema bump. The legacy ids continue to be valid `shapeId` strings; new files use the pack-qualified form. v3.x can collapse the alias once we're confident no users have stale `.graffel` files.

### Icon policy: vendor-neutral concepts, not vendor-specific brands

v3.1–v3.4 (now reverted) shipped per-vendor stylized icons (AWS, GCP, Azure, K8s). v3.5 reverses that stance after user feedback: vendor-specific stylized icons looked awkward, repeated the same shapes across packs (Lambda, Cloud Functions, Azure Functions all used the same λ glyph), and gave the false impression of being the official sets.

**v3.5 policy:**
- One **Cloud** pack with concepts that are standard across the industry, not bound to any one vendor: Virtual Machine, Container, Container Cluster, Object Storage, Block Storage, Data Warehouse, Serverless Function, Event Bus, Identity Provider, Secrets Vault, Monitoring, VPN, Firewall, Region, Availability Zone, Internet.
- **Kubernetes** pack stays — CNCF is an open standard, not a single-company brand.
- **No duplicated icons across packs.** Each visual lives in exactly one pack. If the same concept exists at multiple abstraction levels (e.g., generic Function in Arch Core vs. Serverless Function in Cloud), the icons are visually distinct.

**Off-ramp:** If a customer ever asks for the actual vendor icon sets, we add a separate "Official Vendor Icons" plugin pack. The `Pack` interface doesn't change.

**Off-ramp taken (v3.21): opt-in AWS pack.** Architects coming from draw.io expect AWS icons, so we add an **AWS** pack as the off-ramp above — but as an *opt-in* pack that ships **disabled** (`defaultEnabled: false`). This keeps the v3.5 policy intact for the default experience (the out-of-the-box palette stays vendor-neutral; no vendor brand is implied) while letting users who want AWS turn it on in the Library Manager. The icons remain self-authored stylized approximations in AWS's category-color tile idiom (not the official marks), consistent with the license stance below. The concept overlap the v3.5 policy warned about (EC2≈VM, S3≈Object Storage) is accepted *because the pack is opt-in and visually distinct* (filled category tiles vs. the Cloud pack's outline glyphs); the "no duplicated icons" rule still governs the default-enabled packs.

This also made `Pack.defaultEnabled` load-bearing for the first time: library prefs now resolve a pack's visibility as `explicit user override ?? pack.defaultEnabled` (was previously "enabled unless in a disabled list", which ignored `defaultEnabled`). Legacy `{ disabledPacks: [...] }` prefs migrate to the new `{ overrides: {...} }` shape on load.

**v3.22 — GCP + Azure packs** follow the same opt-in off-ramp. To keep the v3.5 "looked the same across packs" failure from recurring, each vendor uses a *visually distinct tile idiom*: AWS = filled per-category color tiles with white glyphs; GCP = white tiles with thin borders and brand-colored line glyphs; Azure = filled Azure-blue tiles with white glyphs. A user typically enables one vendor, and the three never share a look, so the concept overlap stays acceptable for opt-in packs.

### Palette UX

- Top: search input that filters across all enabled packs (matches `label` + `keywords`).
- Below: collapsible categories (default open: Basic + Architecture Core; rest collapsed).
- Each shape rendered as a ~32×32 mini SVG preview; tooltip on hover with the label.
- Bottom: "Manage libraries" button opens a modal toggling which packs appear.

### Connector geometry context menu

Orthogonal to (no pun intended) the shape library, v3.0 also adds a right-click menu on connectors:

- **Make right-angle** — clears waypoints, sets `edge.type = 'orthogonal'`. React Flow's `smoothstep` then auto-routes axis-aligned.
- **Make straight** — clears waypoints, sets `edge.type = 'straight'`.
- **Make curved** — clears waypoints, sets `edge.type = 'bezier'`.
- **Clear corners** — wipes waypoints only; keeps the current type.

Reasoning: ADR-0004 gave users explicit waypoints. ADR-0010 adds the inverse: one click to *abandon* explicit routing and let the auto-router take over. The two together cover the "I want full control" and "I want it to just look square" cases.

### Library state persistence

User's pack-enabled/disabled choices live in localStorage under key `graffel.libraryPrefs.v1`. Format: `{ disabledPacks: string[] }`. Persisted across sessions. Not saved with `.graffel` files — library preference is per-user, not per-diagram.

## Consequences

**Positive:**
- Adding a 9th pack is a single file (~30-60 lines of SVG paths).
- Visual previews scale to hundreds of shapes via collapsible categories + search.
- File format stays stable; legacy `.graffel` files keep loading.
- Right-click menu closes the loop on connector geometry: explicit waypoints (v1.2) + auto-routing (v3.0) coexist.

**Negative:**
- Stylized icons aren't pixel-perfect to the official vendor sets. Real architects coming from draw.io will notice. Acceptable for v3 — swap-in is an additive pack later.
- Each shape is a React render function. Rendering 200 shapes in the palette = 200 small SVGs in the DOM. Mitigated by virtualizing the category list if it becomes a perf issue (current scale: maybe 100 shapes total across enabled packs; well under any threshold).

## Implementation notes

- Shape renderers live in `src/shapes/packs/*.ts` (one file per pack). Each file `export const PACK: Pack = { ... }`.
- The palette imports a manifest of all packs from `src/shapes/registry.ts`.
- A single `ShapeNode` component picks up `data.shapeId`, looks up the def, and renders.
- Library Manager state lives in a small Zustand store (`useLibraryPrefs`), hydrated from localStorage.
- Right-click context menu: a small absolutely-positioned `<div>` rendered when an edge dispatches `oncontextmenu`. Closes on outside-click or Escape.
