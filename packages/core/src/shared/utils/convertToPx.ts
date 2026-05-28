// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/convertToPx.ts`.
//
// Adapted for vyui: the original module read `SystemInfo` at import time, which
// crashes any environment (jsdom, SSR) without the Lynx runtime global. The
// reads here are deferred and gated on the global being present so the helper
// is safe to import outside Lynx — falling back to web `innerWidth`/`innerHeight`
// when available, else returning `undefined`.

function getScreenWidth(): number | undefined {
  if (typeof SystemInfo !== 'undefined') {
    return SystemInfo.pixelWidth / SystemInfo.pixelRatio
  }
  if (typeof window !== 'undefined' && typeof window.innerWidth === 'number') {
    return window.innerWidth
  }
  return undefined
}

function getScreenHeight(): number | undefined {
  if (typeof SystemInfo !== 'undefined') {
    return SystemInfo.pixelHeight / SystemInfo.pixelRatio
  }
  if (typeof window !== 'undefined' && typeof window.innerHeight === 'number') {
    return window.innerHeight
  }
  return undefined
}

/** Logical screen width in CSS pixels (`pixelWidth / pixelRatio`). */
export const screenWidth: number = getScreenWidth() ?? 0

/** Logical screen height in CSS pixels (`pixelHeight / pixelRatio`). */
export const screenHeight: number = getScreenHeight() ?? 0

/**
 * Converts a CSS-like length string (`'12px'`, `'24rpx'`, `'50vw'`, `'80vh'`)
 * into a numeric pixel value. Returns `undefined` for an empty input or an
 * unrecognised unit.
 *
 * - `rpx` is the Lynx-specific responsive pixel — `1rpx == screenWidth / 750`
 *   to match a 750px design baseline.
 * - `vw`/`vh` are viewport-percentage units mapped against the screen.
 */
export function convertToPx(
  value:
    | `${number}px`
    | `${number}rpx`
    | `${number}vw`
    | `${number}vh`
    | undefined,
): number | undefined {
  if (!value) {
    return undefined
  }
  const num = Number.parseFloat(value)

  const unit = value.slice(String(num).length).trim()
  switch (unit) {
    case 'px':
      return num
    case 'rpx':
      return num * (screenWidth / 750)
    case 'vw':
      return num * (screenWidth / 100)
    case 'vh':
      return num * (screenHeight / 100)
  }
}
