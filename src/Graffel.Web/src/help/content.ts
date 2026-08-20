import type { HelpContent } from 'help-navigator'

// The in-app help corpus: categories + markdown articles, rendered by the
// help-navigator widget mounted in App.tsx.
export const helpContent: HelpContent = {
  categories: [
    {
      id: 'getting-started',
      title: 'Getting started',
      icon: '🚀',
      description: 'Your first diagram, moving around the canvas, and where your work lives.',
    },
    {
      id: 'shapes',
      title: 'Shapes & structure',
      icon: '🧩',
      description: 'The shape library, styling, containers, drill-down, and tidy layouts.',
    },
    {
      id: 'connectors',
      title: 'Connectors',
      icon: '🔗',
      description: 'Drawing connectors, controlling their geometry, and styling them.',
    },
    {
      id: 'keyboard',
      title: 'Keyboard & speed',
      icon: '⌨️',
      description: 'Shortcuts, the command palette, and clipboard tricks for fast diagramming.',
    },
    {
      id: 'import-export',
      title: 'Import & export',
      icon: '⇄',
      description: 'PNG/SVG export, Mermaid interop, and living diagrams from docker-compose.',
    },
    {
      id: 'sharing',
      title: 'Account & sharing',
      icon: '☁️',
      description: 'Google sign-in, Drive save, view-only share links, and presenting.',
    },
  ],
  articles: [
    // ---------- Getting started ----------
    {
      id: 'first-diagram',
      title: 'Your first diagram in 60 seconds',
      category: 'getting-started',
      featured: true,
      tags: ['overview', 'tour', 'basics', 'starter', 'welcome'],
      body: `Graffel is built so a connected three-shape diagram takes under a minute:

1. **Drop a shape** — drag one from the left palette, or press **R** / **E** / **D** / **T** to insert a rectangle, ellipse, diamond, or text at the cursor
2. **Connect it** — hover a shape, then drag from one of the edge anchors that appear and drop on another shape. The connector routes itself
3. **Label it** — just start typing with a shape selected, or double-click a connector

## Starters

On an empty canvas, the welcome overlay offers three one-click starters — **Web service architecture**, **Flowchart**, and **Microservices**. The architecture starter nests services inside an enterable container, so you can try drill-down right away (double-click the container).

Everything you draw autosaves to your browser as you go — watch the **✓ Saved** indicator in the toolbar.

> Press **F1** anytime to open this help panel.`,
      related: ['drawing-connectors', 'keyboard-shortcuts', 'canvas-navigation'],
    },
    {
      id: 'canvas-navigation',
      title: 'Moving around: pan, zoom, tools, dark mode',
      category: 'getting-started',
      tags: ['pan', 'zoom', 'minimap', 'select', 'hand', 'dark mode', 'theme'],
      body: `The canvas is infinite — pan and zoom to work at any scale.

## Pointer tools

- **▣ Select (V)** — click to select; drag on empty canvas to rubber-band a multi-selection
- **✋ Hand (H)** — drag to pan
- **Hold Space** — temporary hand tool while the key is down; the **middle mouse button** also pans

## Finding your way

The **minimap** in the bottom corner of the canvas shows the whole diagram — it's pannable and zoomable itself. The zoom controls above it zoom in/out and fit the view. When you enter or leave a drill-down level, the view automatically re-frames to fit.

## Dark mode

The **🌙 / ☀️** toolbar button flips the whole UI between light and dark. Your preference is remembered and defaults to your OS setting. Shape fills keep their authored colors, so diagrams look the same on either canvas.`,
      related: ['first-diagram', 'drilldown', 'keyboard-shortcuts'],
    },
    {
      id: 'documents-library',
      title: 'Documents: New, switch, rename, .graffel files',
      category: 'getting-started',
      tags: ['documents', 'library', 'new', 'rename', 'delete', 'graffel', 'file', 'save'],
      body: `Graffel keeps a local **library of documents** in your browser — "New" is never destructive.

- **New** saves the current diagram to the library and opens a fresh one
- **Documents** lists everything with the most recent first; click to switch, or rename and delete from the row actions
- The **title box** in the toolbar names the current diagram

## .graffel files

**Download .graffel** saves the current diagram as a JSON file — your diagram in a portable, versioned format. **Open…** loads one back in (on any machine, no account needed). Waypoints, containers, styling, and walkthrough tours all survive the round-trip.

Everything in the library autosaves to browser storage. For a copy that outlives the browser — or moves between machines — download the file or save to Google Drive.`,
      related: ['version-history', 'google-drive', 'export-images'],
    },
    {
      id: 'version-history',
      title: 'Autosave and version history',
      category: 'getting-started',
      tags: ['autosave', 'history', 'snapshot', 'restore', 'checkpoint', 'undo'],
      body: `Two answers to "did my work save?" and "can I get back?":

## The save indicator

The toolbar shows **Saving… → ✓ Saved · 2s ago** as autosave runs. If it says saved, it's saved.

## The History panel

**🕘 History** opens a panel of restorable snapshots per document:

- **Auto-checkpoints** are dropped as you edit (roughly one per 90 seconds of activity)
- **Manual snapshots** — type a name and click Snapshot before a risky restructure

**Restore is non-destructive:** restoring first checkpoints your current state, so a restore is itself reversible. Manual snapshots are never dropped when old auto-checkpoints get pruned.

History is for getting a whole earlier document back; **Undo (Ctrl+Z)** is for stepping back individual changes in this session.`,
      related: ['documents-library', 'keyboard-shortcuts'],
    },

    // ---------- Shapes & structure ----------
    {
      id: 'shape-library',
      title: 'The shape library and packs',
      category: 'shapes',
      featured: true,
      tags: ['shapes', 'palette', 'packs', 'search', 'aws', 'gcp', 'azure', 'uml', 'kubernetes', 'flowchart'],
      body: `The left palette is organized into **packs** — search at the top finds any shape across all of them.

## What's installed

- **Basic** — rectangle, ellipse, diamond, text
- **Architecture · Core** — service, database, queue, boundary, load balancer, cache, API gateway, and more
- **Cloud** — 16 vendor-neutral concepts (virtual machine, container, object storage, serverless function, …)
- **UML** — 12 UML 2.x primitives
- **Flowchart & User Flow** — terminators, decisions, swimlanes, and friends
- **Kubernetes** — CNCF-standard k8s primitives

## Vendor packs (opt-in)

Stylized **AWS**, **GCP**, and **Azure** packs (20–24 common services each) ship disabled. Click **Libraries** at the bottom of the palette to toggle any pack on or off; your choice persists.

Drag a shape onto the canvas to place it, or use the command palette (\`/\`) to insert common architecture shapes by name.`,
      related: ['first-diagram', 'styling-inspector', 'command-palette'],
    },
    {
      id: 'styling-inspector',
      title: 'Styling shapes: the Inspector and quick-style bar',
      category: 'shapes',
      tags: ['inspector', 'style', 'fill', 'border', 'font', 'resize', 'label', 'color'],
      body: `Select something and the right-side **Inspector** becomes its full editor.

## For a shape

- **Label** and label position (top / bottom / left / right / center — labels sit above pictograms by default)
- **Text**: alignment, font family, size, weight, color
- **Fill** and **border** colors — preset swatches plus an arbitrary color picker
- **Resize** by dragging any of the 8 handles on the selected shape

## The floating quick-style bar

A small toolbar floats above your selection with the most-used controls — Fill / Border / Text for shapes, Stroke / Line / Arrows for connectors, plus Group/Ungroup. It follows the selection as you pan and zoom; the Inspector remains the full editor.

## Fastest of all

With one shape selected, **just type** — the label editor opens and replaces the text. **Enter** or **F2** edits the existing label.`,
      related: ['connector-styling', 'shape-library', 'containers-grouping'],
    },
    {
      id: 'containers-grouping',
      title: 'Containers and grouping',
      category: 'shapes',
      tags: ['group', 'ungroup', 'container', 'boundary', 'nesting', 'frame'],
      body: `Containers hold other shapes — use them for system boundaries, zones, and grouping.

## Grouping

Select two or more shapes and press **Ctrl+G** to wrap them in a Group container. **Ctrl+Shift+G** (or the Inspector's Ungroup button) dissolves it. The **Boundary** shape from Architecture · Core is a container too.

## Nesting by drag

Drag a shape onto a container to nest it; drag it back out to release it. Dragging a child against the container's edge **auto-grows** the container to keep it inside.

## Containers behave as one thing

Moving a container moves its contents. Deleting one takes its contents (undo restores everything). Duplicating clones the whole subtree. Copy/paste carries contents and internal connectors along.

Double-click a container to **drill into it** — see the drill-down article.`,
      related: ['drilldown', 'clipboard-duplicate', 'styling-inspector'],
    },
    {
      id: 'drilldown',
      title: 'Drill-down: diagrams with depth',
      category: 'shapes',
      featured: true,
      tags: ['drill', 'levels', 'breadcrumb', 'collapse', 'zoom in', 'nested', 'deep link'],
      body: `A Graffel diagram can be layered: a container's interior is a level of its own.

## Navigating levels

- **Double-click a container** to enter it (hover shows a "⤢ Double-click to open" hint)
- The **breadcrumb** (top-left) shows where you are; click any crumb to jump out
- **Esc** (with nothing selected) climbs one level

## Collapse for a context view

Collapse a container to hide its contents — connectors to inner shapes re-target the container itself, giving you a context diagram for free, with a badge counting the hidden shapes.

## Cross-level connections

A connector whose other end lives on a different level shows as a clickable **stub chip** ("→ Email Provider") above the shape; click it to reveal the off-level peer.

## Deep links

The URL hash tracks your level, so the address bar is always shareable. The breadcrumb's **🔗 Link** button copies a URL that reopens this exact level — including in read-only share views.`,
      related: ['containers-grouping', 'share-links', 'walkthrough-mode'],
    },
    {
      id: 'alignment-tidy',
      title: 'Alignment guides, snapping, and Tidy up',
      category: 'shapes',
      tags: ['align', 'snap', 'grid', 'guides', 'spacing', 'tidy', 'auto-layout', 'arrange'],
      body: `Dragging a shape near alignment snaps it there and flashes a guide:

- **Cyan** — centers aligned
- **Magenta** — edges aligned
- **Orange (double ticks)** — equal spacing between row/column neighbors

Hold **Alt** during a drag to suppress snapping for that drag.

## Grid snap

The **⌗ Grid** toolbar button (or **Ctrl+;**) toggles an 8px grid snap. It's off by default and your choice persists.

## Tidy up

The **✨ Tidy up** button (also \`View: Tidy up\` in the command palette) auto-arranges the level currently in view into a clean left-to-right hierarchy. It's a single undoable step, and only the level you're looking at moves — drilled-in interiors stay as they are.`,
      related: ['canvas-navigation', 'drilldown', 'command-palette'],
    },

    // ---------- Connectors ----------
    {
      id: 'drawing-connectors',
      title: 'Drawing and reconnecting connectors',
      category: 'connectors',
      featured: true,
      tags: ['connector', 'edge', 'anchor', 'connect', 'reconnect', 'arrow', 'line'],
      body: `Connectors are Graffel's centerpiece: drag from a shape edge, drop on another shape. No modes, no modals.

## Drawing

Hover a shape and four **anchors** appear on its edges — anchors sit on the drawn silhouette of the shape (the cylinder's curve, the diamond's point), not a bounding box. Drag from an anchor; a live preview follows the cursor; drop on any shape.

## Connectors stay attached — intelligently

Ends are **floating** by default: each end picks the facing side of its shape and re-sides live as you move things, so lines never stab through a shape or dangle off a corner. Orthogonal connectors also route **around** intervening shapes, with clean clearance.

## Reconnecting

Select a connector and drag an endpoint to a different shape to re-wire it — no delete-and-redraw. (Self-loops are refused.) It's undoable like everything else.`,
      related: ['connector-geometry', 'connector-styling', 'first-diagram'],
    },
    {
      id: 'connector-geometry',
      title: 'Connector geometry: types, waypoints, routing',
      category: 'connectors',
      tags: ['waypoint', 'corner', 'orthogonal', 'straight', 'curved', 'route', 'right-angle'],
      body: `Every connector has a geometry type — **straight**, **orthogonal** (right-angle), or **curved** — switchable in the Inspector or the connector's right-click menu.

## Waypoints: explicit corners

Want the line to turn exactly *there*? Select a connector:

- Drag the faded **ghost handle** at a segment's midpoint to insert a corner
- Drag any **corner handle** to move it (snaps to an 8px grid)
- The Inspector shows a "Corners: N" badge and a **Clear corners** button

Manual waypoints override automatic routing. Moving a connected shape doesn't drag your corners along — the line just reaches farther.

## The right-click menu

Right-click any connector for **Make right-angle / Make straight / Make curved / Clear corners** — the quick way to hand the path back to the auto-router.

Note: curved (bezier) connectors ignore waypoints — that's a documented limitation.`,
      related: ['drawing-connectors', 'connector-styling', 'alignment-tidy'],
    },
    {
      id: 'connector-styling',
      title: 'Connector labels, line styles, and arrowheads',
      category: 'connectors',
      tags: ['label', 'stroke', 'dashed', 'dotted', 'marker', 'arrowhead', 'endpoint'],
      body: `Select a connector and the Inspector offers:

- **Label** — or just double-click the connector for an inline editor
- **Stroke** color and width
- **Line style** — solid, dashed, or dotted
- **Endpoint markers** — arrows, triangles, diamonds, and circles at either end, in filled and outline variants and three sizes

## Slideable labels

A label doesn't have to sit at the midpoint: **drag it anywhere along its connector** and it stays at that position (persisted with the document).

The floating quick-style bar over a selected connector carries the same Stroke / Line / Arrows controls for one-click changes.`,
      related: ['connector-geometry', 'styling-inspector'],
    },

    // ---------- Keyboard & speed ----------
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard shortcuts',
      category: 'keyboard',
      featured: true,
      tags: ['shortcuts', 'keys', 'hotkey', 'nudge', 'quick insert', 'undo'],
      body: `Graffel is built keyboard-first. (Cmd on macOS, Ctrl on Windows/Linux.)

## Insert & tools

- **R / E / D / T** — insert rectangle / ellipse / diamond / text at the cursor
- **V** — Select tool · **H** — Hand tool · **hold Space** — pan
- **/** — command palette

## Edit

- **Ctrl+Z / Ctrl+Shift+Z** — undo / redo (unbounded, coalesced per gesture)
- **Ctrl+D** — duplicate selection · **Ctrl+A** — select all
- **Ctrl+C / X / V** — copy / cut / paste (real clipboard — works across tabs)
- **Ctrl+G / Ctrl+Shift+G** — group / ungroup
- **Delete** — delete selection
- **Arrows** — nudge 1px · **Shift+Arrows** — nudge 10px
- **Enter** or **F2** — edit the selected shape's label; or just start typing
- **Esc** — deselect; with nothing selected, climb one drill-down level

## Canvas

- **Ctrl+;** — toggle grid snap · **hold Alt while dragging** — suppress snapping
- **F1** — this help panel`,
      related: ['command-palette', 'clipboard-duplicate', 'first-diagram'],
    },
    {
      id: 'command-palette',
      title: 'The command palette',
      category: 'keyboard',
      featured: true,
      tags: ['palette', 'commands', 'search', 'slash', 'fuzzy'],
      body: `Press **/** and type — the command palette fuzzy-matches every app action:

- **Insert** — service, database, queue, boundary, rectangle, ellipse, diamond, text
- **Edit** — undo, redo, select all, duplicate, delete
- **View** — Tidy up (auto-layout)
- **File** — new diagram, Documents, import/export Mermaid, import docker-compose, download .graffel, open, export PNG / SVG, copy as image

**↑/↓** navigates, **Enter** runs, **Esc** closes. Shortcut hints appear on the right of each result, so the palette doubles as a way to learn the direct keys.`,
      related: ['keyboard-shortcuts', 'shape-library', 'mermaid-interop'],
    },
    {
      id: 'clipboard-duplicate',
      title: 'Copy, paste, and duplicate',
      category: 'keyboard',
      tags: ['copy', 'paste', 'cut', 'duplicate', 'clipboard', 'cross-tab'],
      body: `Graffel's clipboard is the **system clipboard**, so copies travel:

- **Ctrl+C / Ctrl+X** copy or cut the selected shapes (with the connectors between them)
- **Ctrl+V** pastes at the cursor — in this diagram, another document, or **another browser tab**
- Containers travel with their contents and internal connectors; pasted shapes get fresh identities, and pasting while drilled in pastes into that level

## Duplicate

**Ctrl+D** clones the selection with a small offset — the quickest way to repeat a styled shape.

## Copy image

The **Copy image** toolbar button puts a PNG of the current view on the clipboard, ready to paste straight into Slack or a doc — no export/upload round-trip.`,
      related: ['keyboard-shortcuts', 'export-images', 'containers-grouping'],
    },

    // ---------- Import & export ----------
    {
      id: 'export-images',
      title: 'Exporting PNG and SVG',
      category: 'import-export',
      tags: ['export', 'png', 'svg', 'image', 'download', 'docs'],
      body: `Two exports, both faithful to what's on the canvas:

- **Export PNG** — a raster image, right for chat and slides
- **Export SVG** — a vector image, right for design docs and wikis (crisp at any size)

Both export the **level currently in view** — drill into a container first to export just its interior.

For a quick paste into Slack or a doc, **Copy image** skips the download entirely and puts the PNG on your clipboard.

To hand someone the *editable* diagram rather than a picture of it, use **Download .graffel** (see the Documents article) or a share link.`,
      related: ['clipboard-duplicate', 'documents-library', 'share-links'],
    },
    {
      id: 'mermaid-interop',
      title: 'Mermaid import and export',
      category: 'import-export',
      tags: ['mermaid', 'flowchart', 'markdown', 'text', 'import', 'export', 'mmd', 'subgraph'],
      body: `The **⇄ Mermaid** dialog converts both ways between Graffel and the Mermaid \`graph\`/\`flowchart\` dialect.

## Import

Paste a flowchart and it opens as a new, auto-laid-out document. Supported: the common node shapes (\`[]\`, \`()\`, \`{}\`, \`(())\`, \`[()]\`), edge and inline labels, chained edges, comments — and **\`subgraph\` blocks become enterable containers**, so nested architectures arrive with drill-down intact.

## Export

\`Export to Mermaid…\` (in the command palette) serializes the level in view — including its containers as \`subgraph\` blocks — to \`graph\` text you can **Copy** or download as \`.mmd\`, ready for READMEs, wikis, and ADRs.

Structure round-trips faithfully; styling and exact geometry are necessarily lossy (Mermaid has no way to say them).`,
      related: ['compose-living', 'command-palette', 'export-images'],
    },
    {
      id: 'compose-living',
      title: 'Living diagrams from docker-compose',
      category: 'import-export',
      tags: ['docker', 'compose', 'yaml', 'generate', 'sync', 'living', 'services'],
      body: `Point Graffel at a \`docker-compose.yml\` (**🐳 Compose** — paste or pick a file) and it generates an architecture diagram:

- **Services become shapes** — with the type inferred from the image: Postgres → database, Redis → cache, RabbitMQ/Kafka → queue, Nginx/Traefik → gateway, Prometheus/Grafana → monitoring, anything else → service
- **\`depends_on\` becomes the wiring**
- The result is auto-laid-out and fully editable

## Re-sync: the diagram doesn't rot

When the compose file changes, import it again — Graffel **merges** instead of replacing:

- Services you moved or restyled **keep your layout**
- New services are staged below the existing content; removed ones drop out
- An image swap re-types the shape
- **Hand-drawn shapes and connectors are never touched**

A change report ("+2 added · −1 removed · your layout was preserved") sums it up, and the whole merge is one undoable step.`,
      related: ['mermaid-interop', 'alignment-tidy', 'version-history'],
    },

    // ---------- Account & sharing ----------
    {
      id: 'google-drive',
      title: 'Google sign-in and Drive save',
      category: 'sharing',
      tags: ['google', 'sign in', 'auth', 'account', 'drive', 'cloud', 'save'],
      body: `Graffel works fully without an account — local documents, files, export, and the whole editor. Signing in adds cloud features.

## Signing in

Click **Sign in with Google** in the toolbar. When signed in, your avatar and name appear with a sign-out option, and the **Drive** and **Share** controls light up. Reloading keeps the session.

## Drive save and open

- **Save to Drive** creates a \`.graffel\` file in your Google Drive the first time, then updates that same file on subsequent saves
- **Open from Drive** lists your Graffel files; click one to load it
- Graffel can only see files it created (Drive's \`drive.file\` scope) — never the rest of your Drive

Local autosave keeps working as a fallback the whole time.

If sign-in reports it's not configured, the server operator hasn't set up Google credentials — everything local still works.`,
      related: ['share-links', 'documents-library'],
    },
    {
      id: 'share-links',
      title: 'Share a view-only link',
      category: 'sharing',
      tags: ['share', 'link', 'view-only', 'read-only', 'revoke', 'token'],
      body: `**Share** (visible when signed in) creates a link anyone can open — **no sign-in needed to view**.

## What viewers get

A read-only canvas: pan, zoom, and full **drill-down navigation** through containers, but no editing — the palette and inspector are hidden. If the diagram has a walkthrough tour, viewers can play it too.

Level deep-links work here as well: copy a link from the breadcrumb to point someone at the exact level you mean.

## Control

The link is a snapshot bound to a token. You can **revoke** it at any time from the Share menu, after which the link stops resolving. Viewing a shared diagram never overwrites the viewer's own local documents.`,
      related: ['google-drive', 'drilldown', 'walkthrough-mode'],
    },
    {
      id: 'walkthrough-mode',
      title: 'Walkthrough mode: present your architecture',
      category: 'sharing',
      tags: ['present', 'walkthrough', 'tour', 'stops', 'presenter', 'demo'],
      body: `Instead of panning around live in front of an audience, author the tour once:

## Authoring

**🎬 Present** opens the walkthrough panel. **Add stop** captures the current drill-down level and selection as a stop; give each one a title and a note. Reorder or delete stops as the story evolves.

## Presenting

Hit **Present** and Graffel goes full-screen: the camera frames each stop's highlighted shapes, with your note below. **Prev / Next** (or the **arrow keys**) step through; a counter shows where you are; **Esc** exits.

Tours are saved **with the document**, so they survive reloads, travel inside \`.graffel\` files — and a shared view-only link can be presented by its viewers, no account required.`,
      related: ['drilldown', 'share-links'],
    },
  ],
}
