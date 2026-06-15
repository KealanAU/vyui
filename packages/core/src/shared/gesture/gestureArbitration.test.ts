// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// Unit tests for the pure parts of the gesture-arbitration primitive. The
// `installGestureDetector` worklet calls engine PAPIs that only exist on a
// device, so it is exercised on a device only — here we pin the pure policy
// (consume vs intercept) and the default relation map. The `'main thread'`
// directives are inert strings under vitest.

import { describe, expect, it } from 'vitest'

import {
  emptyRelationMap,
  GESTURE_INTERCEPT_MIN_SDK,
  GESTURE_TYPE_NATIVE,
  shouldInterceptGesture,
} from './gestureArbitration'

describe('gestureArbitration — shouldInterceptGesture', () => {
  it('uses interceptGesture on SDK >= 3.3 (sdkLessThan33 = false)', () => {
    expect(shouldInterceptGesture(false)).toBe(true)
  })

  it('uses consumeGesture on SDK < 3.3 (sdkLessThan33 = true)', () => {
    expect(shouldInterceptGesture(true)).toBe(false)
  })
})

describe('gestureArbitration — constants', () => {
  it('NATIVE gesture type matches gesture-runtime GestureTypeInner.NATIVE (7)', () => {
    expect(GESTURE_TYPE_NATIVE).toBe(7)
  })

  it('intercept SDK floor is 3.3', () => {
    expect(GESTURE_INTERCEPT_MIN_SDK).toBe('3.3')
  })
})

describe('gestureArbitration — emptyRelationMap', () => {
  it('returns an all-empty relation map', () => {
    expect(emptyRelationMap()).toEqual({
      waitFor: [],
      simultaneous: [],
      continueWith: [],
    })
  })

  it('returns a fresh object each call (no shared mutable arrays)', () => {
    const a = emptyRelationMap()
    const b = emptyRelationMap()
    a.waitFor.push(1)
    expect(b.waitFor).toEqual([])
  })
})
