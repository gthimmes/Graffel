import { create } from 'zustand'

// v3.16 — in-app modal dialogs replacing native confirm()/alert(). `ask` returns
// a promise that resolves true/false; `showError` is informational (resolves on
// dismiss). Only one dialog is shown at a time.

interface ConfirmRequest {
  kind: 'confirm'
  title: string
  message?: string
  confirmLabel: string
  cancelLabel: string
  danger: boolean
  resolve: (ok: boolean) => void
}

interface ErrorRequest {
  kind: 'error'
  title: string
  message?: string
  resolve: (ok: boolean) => void
}

type DialogRequest = ConfirmRequest | ErrorRequest

interface DialogState {
  current: DialogRequest | null
  ask: (opts: { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>
  showError: (title: string, message?: string) => Promise<boolean>
  resolve: (ok: boolean) => void
}

export const useDialogStore = create<DialogState>((set, get) => ({
  current: null,
  ask(opts) {
    return new Promise<boolean>((resolve) => {
      set({
        current: {
          kind: 'confirm',
          title: opts.title,
          message: opts.message,
          confirmLabel: opts.confirmLabel ?? 'OK',
          cancelLabel: opts.cancelLabel ?? 'Cancel',
          danger: opts.danger ?? false,
          resolve,
        },
      })
    })
  },
  showError(title, message) {
    return new Promise<boolean>((resolve) => {
      set({ current: { kind: 'error', title, message, resolve } })
    })
  },
  resolve(ok) {
    const cur = get().current
    if (cur) cur.resolve(ok)
    set({ current: null })
  },
}))
