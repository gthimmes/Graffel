# ADR-0006: Command palette and command registry

**Status:** Accepted
**Date:** 2026-05-17
**Decision owner:** Architect

## Context

v1.4 closes the last v1 PRD gap: a `/`-opened command palette listing every action that exists in the app. The questions are:

1. How are commands registered?
2. What matching algorithm filters them?
3. How does the modal integrate with the existing keyboard layer?

## Decision

### Registry

A plain in-memory array of command objects, defined as a module export. No plugin system in v1.4. New commands are added by appending to the registry file.

```ts
interface Command {
  id: string             // stable identifier, used in tests
  label: string          // displayed text
  keywords?: string[]    // additional searchable terms
  group?: string         // 'Insert' | 'Edit' | 'View' | 'File'
  shortcut?: string      // display hint, e.g. 'Cmd+Z'
  run: (ctx: CommandContext) => void
}

interface CommandContext {
  store: typeof useDiagramStore
}
```

The registry is constructed once at module load. It pulls `useDiagramStore` from the store module so commands close over the right actions.

### Matching

**Token-substring with prefix bonus.** Cheap, predictable, doesn't surprise.

- Lowercase both query and (label + keywords joined).
- Tokenize the haystack into space-separated tokens.
- For each query character, find the next occurrence in the haystack.
- Score: number of matched chars + bonus per query token that matches a haystack token at its start.
- Reject if any query character can't be found.

Reasoning: real fuzzy matchers (fzf, Sublime-style) are nicer but heavier. For the size of v1.4's command set (~15-20 commands), substring + prefix bonus is indistinguishable from fzf-level quality. We can swap later without changing the registry shape.

### UI

A centered modal `<dialog>` element opened via the `useUiStore` (or local state — kept simple).

- Input is autofocused on open.
- Results list shows the top N (8) matches.
- `↑` / `↓` change the highlighted index; `Enter` runs it; `Esc` or click-outside closes.
- Grouped headings shown when there's no query; flat list when there is.

### Integration with the keyboard layer

The existing keyboard handler in `DiagramCanvas` learns one new shortcut: `/` (when not in an editable element) → open palette. The palette renders at the App root. When open, the palette's input captures keys; the existing handler's `inEditable` short-circuit keeps it from firing other shortcuts.

The palette dispatches the chosen command's `run()` then closes itself.

## Rationale

- **Module-level registry** keeps v1.4 trivial. v2 might want context-aware commands; we'll address then.
- **Substring + prefix** is the standard answer for a small command set. The cost of fzf is real (bundle size + cognitive overhead during debugging) and unjustified.
- **`<dialog>` element** gives us proper modal focus-trap and backdrop semantics for free in modern browsers.

## Consequences

**Positive:**
- The palette is a single component + one registry file. ~300 lines total.
- Adding a new command is one line in the registry.
- Tests can target commands by `id` regardless of label changes.

**Negative:**
- No recent/pinned commands (v1.4 non-goal).
- No argument prompts (`"Set fill to ___"` doesn't ask for the color — defer).
- The matcher won't impress fzf fans; this is fine for v1.

## Off-ramps

If we ever need fuzzy-fzf quality (longer command set, fuzzy-friendly aliasing), drop in `fuse.js` or a custom Smith-Waterman-ish matcher. The `Command` interface is stable; replacing the matcher is internal.
