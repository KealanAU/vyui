// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { reactive } from 'vue'

/**
 * Process-wide animation timing knobs.
 *
 * Deliberately a reactive **module singleton**, NOT provide/inject: overlay
 * surfaces (Dialog, Sheet, DropdownMenu, …) render through the OverlayRoot
 * portal, outside the triggering component's tree — which breaks both Vue
 * injection AND CSS-variable cascade. A singleton every component imports
 * sidesteps the portal entirely, so one mutation re-times every overlay.
 *
 * Components read these and apply {@link motionAnimationStyle} as inline
 * `animation-duration` / `animation-timing-function` on their animated view,
 * overriding the CSS-keyframe defaults (inline longhands beat the stylesheet's
 * `animation` shorthand). Mutate from anywhere — a settings screen, a reduced-
 * motion toggle, or the motion playground.
 */
export interface MotionConfig {
  /** Enter (open) animation duration, ms. */
  enterMs: number
  /** Leave (close) animation duration, ms. */
  exitMs: number
  /** Easing curve applied to both enter and leave. Any CSS easing string. */
  easing: string
}

export const motionConfig = reactive<MotionConfig>({
  enterMs: 220,
  exitMs: 180,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
})

/**
 * Build the inline style that overrides a keyframe's timing from
 * {@link motionConfig}. Pass `leaving` so the right duration is chosen.
 *
 * Returns only the timing longhands — the keyframe class still owns the
 * animation `name` + `fill`, which these don't touch.
 */
export function motionAnimationStyle(leaving: boolean): {
  animationDuration: string
  animationTimingFunction: string
} {
  return {
    animationDuration: `${leaving ? motionConfig.exitMs : motionConfig.enterMs}ms`,
    animationTimingFunction: motionConfig.easing,
  }
}
