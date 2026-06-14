// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/version.test.ts`.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  isNativeRefreshSupported,
  lynxSDKVersionStringToNumber,
  nativeLynxSDKVersionGreaterThan,
  nativeLynxSDKVersionLessThan,
} from './version'

function createMockSystemInfo(lynxSdkVersion: string) {
  return {
    lynxSdkVersion,
    osVersion: '1.0',
    pixelHeight: 100,
    pixelWidth: 100,
    pixelRatio: 1,
    platform: 'Android',
    runtimeType: 'quickjs',
  }
}

describe('version utils', () => {
  describe('lynxSDKVersionStringToNumber', () => {
    it('converts a version string to a number', () => {
      expect(lynxSDKVersionStringToNumber('1.2.3')).toBe(10203)
      expect(lynxSDKVersionStringToNumber('2.0.0')).toBe(20000)
      expect(lynxSDKVersionStringToNumber('0.1.0')).toBe(100)
    })

    it('handles missing version parts', () => {
      expect(lynxSDKVersionStringToNumber('1')).toBe(10000)
      expect(lynxSDKVersionStringToNumber('1.2')).toBe(10200)
      expect(lynxSDKVersionStringToNumber('')).toBe(0)
    })

    it('handles leading zeros', () => {
      expect(lynxSDKVersionStringToNumber('01.02.03')).toBe(10203)
    })

    it('handles large version numbers', () => {
      expect(lynxSDKVersionStringToNumber('99.99.99')).toBe(999999)
    })
  })

  describe('nativeLynxSDKVersionGreaterThan', () => {
    beforeEach(() => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.2.3')
    })

    it('returns true when native version is greater', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.2.4')
      expect(nativeLynxSDKVersionGreaterThan('1.2.3')).toBe(true)
    })

    it('returns false when native version is equal', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.2.3')
      expect(nativeLynxSDKVersionGreaterThan('1.2.3')).toBe(false)
    })

    it('returns false when native version is less', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.2.2')
      expect(nativeLynxSDKVersionGreaterThan('1.2.3')).toBe(false)
    })
  })

  describe('nativeLynxSDKVersionLessThan', () => {
    beforeEach(() => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.2.3')
    })

    it('returns true when native version is less', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.2.2')
      expect(nativeLynxSDKVersionLessThan('1.2.3')).toBe(true)
    })

    it('returns false when native version is equal', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.2.3')
      expect(nativeLynxSDKVersionLessThan('1.2.3')).toBe(false)
    })

    it('returns false when native version is greater', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.2.4')
      expect(nativeLynxSDKVersionLessThan('1.2.3')).toBe(false)
    })

    it('handles major version differences', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.0.0')
      expect(nativeLynxSDKVersionLessThan('2.0.0')).toBe(true)
    })

    it('handles minor version differences', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.1.0')
      expect(nativeLynxSDKVersionLessThan('1.2.0')).toBe(true)
    })
  })

  describe('isNativeRefreshSupported', () => {
    afterEach(() => {
      delete (globalThis as any).SystemInfo
    })

    it('returns false when SystemInfo is absent (jsdom / OSS engine)', () => {
      delete (globalThis as any).SystemInfo
      expect(isNativeRefreshSupported()).toBe(false)
    })

    it('returns false by default when SystemInfo gives no positive signal', () => {
      ;(globalThis as any).SystemInfo = createMockSystemInfo('1.4.0')
      expect(isNativeRefreshSupported()).toBe(false)
    })

    it('returns true only when the host advertises supportRefreshUI', () => {
      ;(globalThis as any).SystemInfo = {
        ...createMockSystemInfo('1.4.0'),
        supportRefreshUI: true,
      }
      expect(isNativeRefreshSupported()).toBe(true)
    })

    it('treats a non-true supportRefreshUI as unsupported', () => {
      ;(globalThis as any).SystemInfo = {
        ...createMockSystemInfo('1.4.0'),
        supportRefreshUI: 'yes',
      }
      expect(isNativeRefreshSupported()).toBe(false)
    })
  })
})
