import { useEffect } from 'react'
import { PACKS, useLibraryPrefs } from '../shapes/registry'

export function LibraryManager({ onClose }: { onClose: () => void }) {
  const isEnabled = useLibraryPrefs((s) => s.isEnabled)
  const togglePack = useLibraryPrefs((s) => s.togglePack)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="graffel-modal-backdrop"
      data-testid="library-manager-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="graffel-modal" role="dialog" aria-modal="true" data-testid="library-manager">
        <header className="modal-header">
          <h2>Shape libraries</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close" data-testid="library-manager-close">×</button>
        </header>
        <p className="modal-hint">
          Toggle which categories appear in the palette. Your choice is remembered on this browser.
        </p>
        <ul className="library-list">
          {PACKS.map((pack) => {
            const enabled = isEnabled(pack.id)
            return (
              <li key={pack.id} className="library-item">
                <label className="library-item-row">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => togglePack(pack.id)}
                    data-testid={`library-toggle-${pack.id}`}
                  />
                  <span className="library-item-text">
                    <span className="library-item-label">{pack.label}</span>
                    {pack.description && <span className="library-item-desc">{pack.description}</span>}
                  </span>
                  <span className="library-item-count">{pack.shapes.length} shapes</span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
