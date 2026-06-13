import { useEffect } from 'react'
import { useDialogStore } from './dialogStore'

/** Single mount point for app modal dialogs (confirm / error). */
export function AppDialogs() {
  const current = useDialogStore((s) => s.current)
  const resolve = useDialogStore((s) => s.resolve)

  useEffect(() => {
    if (!current) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); resolve(false) }
      else if (e.key === 'Enter') { e.preventDefault(); resolve(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, resolve])

  if (!current) return null

  const isConfirm = current.kind === 'confirm'
  return (
    <div
      className="graffel-dialog-overlay"
      data-testid="dialog-overlay"
      onMouseDown={() => resolve(false)}
    >
      <div
        className={`graffel-dialog${isConfirm && current.danger ? ' is-danger' : ''}`}
        role="dialog"
        aria-modal="true"
        data-testid={isConfirm ? 'dialog-confirm' : 'dialog-error'}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="graffel-dialog-title">{current.title}</h2>
        {current.message ? <p className="graffel-dialog-message">{current.message}</p> : null}
        <div className="graffel-dialog-actions">
          {isConfirm ? (
            <>
              <button type="button" className="graffel-dialog-btn" onClick={() => resolve(false)} data-testid="dialog-cancel">
                {current.cancelLabel}
              </button>
              <button
                type="button"
                className={`graffel-dialog-btn is-primary${current.danger ? ' is-danger' : ''}`}
                onClick={() => resolve(true)}
                data-testid="dialog-ok"
                autoFocus
              >
                {current.confirmLabel}
              </button>
            </>
          ) : (
            <button type="button" className="graffel-dialog-btn is-primary" onClick={() => resolve(true)} data-testid="dialog-dismiss" autoFocus>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
