import { describe, expect, it } from 'vitest'
import { getSafeAreaInsetsFromGlobalProps } from './useSafeArea'

describe('getSafeAreaInsetsFromGlobalProps', () => {
  it('returns zeros with no global props', () => {
    expect(getSafeAreaInsetsFromGlobalProps()).toEqual({ top: 0, bottom: 0 })
    expect(getSafeAreaInsetsFromGlobalProps({})).toEqual({ top: 0, bottom: 0 })
  })

  it('gates Android to zeros (container insets the view natively)', () => {
    expect(getSafeAreaInsetsFromGlobalProps({
      os: 'Android',
      topHeight: 24,
      safeAreaBottom: 16,
    })).toEqual({ top: 0, bottom: 0 })
  })

  it('normalizes Sparkling topHeight/bottomHeight on iOS', () => {
    expect(getSafeAreaInsetsFromGlobalProps({
      os: 'iOS',
      topHeight: 59,
      bottomHeight: 34,
    })).toEqual({ top: 59, bottom: 34 })
  })

  it('normalizes Lynx Explorer safeAreaTop/safeAreaBottom without an os prop', () => {
    expect(getSafeAreaInsetsFromGlobalProps({
      safeAreaTop: 47,
      safeAreaBottom: 34,
    })).toEqual({ top: 47, bottom: 34 })
  })

  it('prefers Sparkling names when both are present', () => {
    expect(getSafeAreaInsetsFromGlobalProps({
      os: 'ios',
      topHeight: 59,
      safeAreaTop: 47,
      bottomHeight: 34,
      safeAreaBottom: 20,
    })).toEqual({ top: 59, bottom: 34 })
  })

  it('parses string values and clamps junk to zero', () => {
    expect(getSafeAreaInsetsFromGlobalProps({
      os: 'ios',
      topHeight: '59',
      bottomHeight: -10,
    })).toEqual({ top: 59, bottom: 0 })
    expect(getSafeAreaInsetsFromGlobalProps({
      os: 'ios',
      topHeight: 'garbage',
      bottomHeight: Number.NaN,
    })).toEqual({ top: 0, bottom: 0 })
  })
})
