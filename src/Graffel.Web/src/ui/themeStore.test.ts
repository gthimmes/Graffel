import { beforeEach, describe, expect, it } from 'vitest'
import { resolvePref, useThemeStore } from './themeStore'

beforeEach(() => {
  localStorage.clear()
  useThemeStore.setState({ pref: 'light' })
})

describe('resolvePref', () => {
  it('passes through explicit light/dark', () => {
    expect(resolvePref('light')).toBe('light')
    expect(resolvePref('dark')).toBe('dark')
  })
  it('resolves system via matchMedia (jsdom default → light)', () => {
    expect(resolvePref('system')).toBe('light')
  })
})

describe('useThemeStore', () => {
  it('toggle flips light↔dark and persists', () => {
    useThemeStore.getState().setPref('light')
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().pref).toBe('dark')
    expect(localStorage.getItem('graffel.theme.v1')).toBe('dark')
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().pref).toBe('light')
  })

  it('toggle from system resolves first, then sets the opposite', () => {
    useThemeStore.getState().setPref('system') // jsdom resolves to light
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().pref).toBe('dark')
  })
})
