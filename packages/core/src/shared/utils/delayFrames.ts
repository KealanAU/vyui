// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/delayFrames.ts`.
//
// Adapted for vyui: falls back to the global `requestAnimationFrame` (web /
// Lynx 3.0+) before reaching for `lynx.requestAnimationFrame`, and finally to
// a `setTimeout` shim so the helper is safe in jsdom tests where neither
// scheduler exists.

type RAFScheduler = (cb: (timestamp?: number) => void) => unknown

function getRAF(): RAFScheduler {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame
  }
  // Lynx < 3.0 — `lynx.requestAnimationFrame` is the only scheduler.
  const lynxGlobal = globalThis.lynx as unknown as
    | { requestAnimationFrame?: RAFScheduler }
    | undefined
  if (typeof lynxGlobal?.requestAnimationFrame === 'function') {
    return lynxGlobal.requestAnimationFrame.bind(lynxGlobal)
  }
  // jsdom / SSR — approximate a 60fps frame so callers don't hang.
  return (cb: (timestamp?: number) => void) => setTimeout(() => cb(Date.now()), 16)
}

/**
 * Invokes `callback` after `frames` paints — useful when waiting for layout
 * to settle (e.g. focus-after-mount). On Lynx the original implementation
 * routed through `lynx.requestAnimationFrame` because of a bug in ReactLynx
 * 0.109.3; vyui prefers the global `requestAnimationFrame` (Lynx 3.0+ and web)
 * and falls back gracefully.
 */
export function delayFrames(frames: number, callback: () => void): void {
  let count = 0
  const raf = getRAF()

  const frameHandler = () => {
    count++
    if (count >= frames) {
      callback()
    }
    else {
      raf(frameHandler)
    }
  }
  raf(frameHandler)
}
