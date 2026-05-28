// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/popoverUtils.ts`.
//
// Small registry that lets a Popover declare a custom overlay-mode mapping
// (iOS-only on the upstream platform set). The vyui Popover doesn't currently
// consume this, but the helper is small and useful for any consumer who needs
// to translate logical mode names into a platform-specific controller name.

const overlayModeMap = new Map<string, string>()

/** Register a `mode -> controllerName` mapping consumed by `convertOverlayMode`. */
export const registerOverlayMode = (
  mode: string,
  controllerName: string,
): void => {
  overlayModeMap.set(mode, controllerName)
}

/**
 * Resolve a registered overlay `mode` to its platform-specific controller
 * name. Returns the input untouched when nothing is registered, and
 * `undefined` for empty input.
 */
export const convertOverlayMode = (
  mode: string,
): string | undefined => {
  if (!mode) {
    return undefined
  }
  // only iOS needs this info upstream — for unmapped modes we pass through.
  if (overlayModeMap.has(mode)) {
    return overlayModeMap.get(mode)
  }
  return mode
}
