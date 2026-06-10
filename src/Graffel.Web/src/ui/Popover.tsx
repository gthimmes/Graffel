import { useEffect, useRef, type ReactNode } from 'react'

/**
 * A small popover anchored below its trigger. Closes on outside-click or Escape.
 * Rendered inline (absolutely positioned under the trigger wrapper), so the
 * parent must be `position: relative`.
 */
export function Popover({
  open,
  onClose,
  children,
  testId,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  testId?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    // Defer the outside-click listener so the click that opened us doesn't close it.
    const t = window.setTimeout(() => document.addEventListener('mousedown', onDown), 0)
    document.addEventListener('keydown', onKey, true)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div ref={ref} className="graffel-popover" data-testid={testId} role="dialog">
      {children}
    </div>
  )
}
