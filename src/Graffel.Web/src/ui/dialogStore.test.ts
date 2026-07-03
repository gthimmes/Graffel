import { beforeEach, describe, expect, it } from 'vitest'
import { useDialogStore } from './dialogStore'

describe('dialogStore', () => {
  beforeEach(() => {
    useDialogStore.setState({ current: null })
  })

  it('ask() opens a confirm dialog and resolves true when confirmed', async () => {
    const promise = useDialogStore.getState().ask({ title: 'Delete?' })
    const cur = useDialogStore.getState().current
    expect(cur?.kind).toBe('confirm')
    expect(cur?.title).toBe('Delete?')

    useDialogStore.getState().resolve(true)
    await expect(promise).resolves.toBe(true)
    // Resolving clears the current dialog.
    expect(useDialogStore.getState().current).toBeNull()
  })

  it('ask() resolves false when cancelled', async () => {
    const promise = useDialogStore.getState().ask({ title: 'Sure?' })
    useDialogStore.getState().resolve(false)
    await expect(promise).resolves.toBe(false)
  })

  it('applies default confirm/cancel labels but keeps overrides', () => {
    useDialogStore.getState().ask({ title: 'A' })
    let cur = useDialogStore.getState().current
    expect(cur).toMatchObject({ confirmLabel: 'OK', cancelLabel: 'Cancel', danger: false })

    useDialogStore.getState().resolve(false)
    useDialogStore.getState().ask({ title: 'B', confirmLabel: 'Yes', cancelLabel: 'No', danger: true })
    cur = useDialogStore.getState().current
    expect(cur).toMatchObject({ confirmLabel: 'Yes', cancelLabel: 'No', danger: true })
  })

  it('showError() opens an error dialog that resolves on dismiss', async () => {
    const promise = useDialogStore.getState().showError('Boom', 'details')
    expect(useDialogStore.getState().current?.kind).toBe('error')
    useDialogStore.getState().resolve(true)
    await expect(promise).resolves.toBe(true)
    expect(useDialogStore.getState().current).toBeNull()
  })

  it('resolve() with no open dialog is a harmless no-op', () => {
    expect(() => useDialogStore.getState().resolve(true)).not.toThrow()
    expect(useDialogStore.getState().current).toBeNull()
  })
})
