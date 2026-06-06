// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/common.test.ts`.

import { describe, expect, it } from 'vitest'
import { get, noop } from './common'

describe('common utils', () => {
  describe('get', () => {
    const testObj = {
      a: {
        b: {
          c: 'value',
        },
        arr: [{ nested: 'array-value' }],
      },
      nullValue: null,
      undefinedValue: undefined,
    }

    it('reads a dot-notation path', () => {
      expect(get(testObj, 'a.b.c')).toBe('value')
    })

    it('reads a bracket-notation path', () => {
      expect(get(testObj, 'a[b][c]')).toBe('value')
    })

    it('reads an array-index path', () => {
      expect(get(testObj, 'a.arr[0].nested')).toBe('array-value')
      expect(get(testObj, 'a.arr.0.nested')).toBe('array-value')
    })

    it('returns the default when the path is missing', () => {
      expect(get(testObj, 'a.b.d', 'default')).toBe('default')
      expect(get(testObj, 'x.y.z', 'default')).toBe('default')
    })

    it('returns undefined for a missing path with no default', () => {
      expect(get(testObj, 'a.b.d')).toBeUndefined()
    })

    it('handles null and undefined values along the path', () => {
      expect(get(testObj, 'nullValue.something', 'default')).toBe('default')
      expect(get(testObj, 'undefinedValue.something', 'default')).toBe(
        'default',
      )
    })

    it('returns the default when input is not an object', () => {
      expect(get(null, 'any.path', 'default')).toBe('default')
      expect(get(undefined, 'any.path', 'default')).toBe('default')
      expect(get('string', 'any.path', 'default')).toBe('default')
      expect(get(123, 'any.path', 'default')).toBe('default')
    })
  })

  describe('noop', () => {
    it('is a function that returns undefined', () => {
      expect(typeof noop).toBe('function')
      expect(noop()).toBeUndefined()
    })
  })
})
