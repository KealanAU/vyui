// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ComputedRef, Ref } from 'vue'

import { createContext } from '../../shared/createContext'

export interface SwiperRootContext {
  currentIndex: Ref<number>
  itemCount: ComputedRef<number>
  itemWidth: ComputedRef<number>
  /** Gap between adjacent items, px (the snap unit is itemWidth + spaceBetween). */
  spaceBetween: ComputedRef<number>
  /** Whether navigation wraps circularly (index 0 ↔ last). */
  loop: ComputedRef<boolean>
  /** Right-to-left layout — flips the per-item margin side. */
  rtl: ComputedRef<boolean>
  /** Set the current index from a child / external API. Triggers animation. */
  setIndex: (index: number) => void
}

export const [injectSwiperRootContext, provideSwiperRootContext] =
  createContext<SwiperRootContext>('SwiperRoot')
