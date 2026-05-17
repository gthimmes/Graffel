import { useEffect, useMemo, useRef, useState } from 'react'
import { create } from 'zustand'
import { COMMANDS, type Command } from '../commands/registry'
import { rankCommands } from '../commands/match'

interface UiState {
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
}

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  openPalette:  () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
}))

if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>
  const existing = (w.__graffel as Record<string, unknown> | undefined) ?? {}
  w.__graffel = { ...existing, useUiStore }
}

const MAX_RESULTS = 8

export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen)
  const close = useUiStore((s) => s.closePalette)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => rankCommands(COMMANDS, query).slice(0, MAX_RESULTS), [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlight(0)
      // Defer focus so the input has mounted.
      const t = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    setHighlight(0)
  }, [query])

  if (!open) return null

  function run(cmd: Command) {
    close()
    // Defer so the modal closes before the command fires (some commands open
    // a file picker / download; running mid-close can interleave focus weirdly).
    window.setTimeout(() => { void cmd.run() }, 0)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = results[highlight]
      if (cmd) run(cmd)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  return (
    <div
      className="graffel-palette-backdrop"
      data-testid="palette-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="graffel-palette" role="dialog" aria-modal="true" data-testid="command-palette">
        <input
          ref={inputRef}
          type="text"
          className="palette-input"
          placeholder="Type a command…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          data-testid="palette-input"
          aria-label="Command"
        />
        <ul className="palette-results" data-testid="palette-results">
          {results.length === 0 ? (
            <li className="palette-empty" data-testid="palette-empty">No matching commands</li>
          ) : (
            results.map((cmd, i) => (
              <li
                key={cmd.id}
                className={`palette-result ${i === highlight ? 'is-active' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => run(cmd)}
                data-testid={`palette-result-${cmd.id}`}
              >
                <span className="palette-result-label">{cmd.label}</span>
                {cmd.shortcut ? (
                  <span className="palette-result-shortcut">{cmd.shortcut}</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
