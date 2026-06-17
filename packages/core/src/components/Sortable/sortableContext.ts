// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import type { ComputedRef, Ref } from 'vue'
import type { MainThreadRef } from 'vue-lynx'

import { createContext } from '../../shared/createContext'

/**
 * Per-item registry slot. The MT touch worklets read every entry to paint
 * non-lifted item transforms during drag without crossing into BG.
 */
export interface SortableItemHandle {
  /** Logical index at the time of registration. Updated via `watch` on prop changes. */
  index: number
  /**
   * Plain JS object that holds the MT element. BG seeds `.current` on mount
   * from the item's `useMainThreadRef` — same pattern Slider thumbs use.
   */
  elementRef: { current: { setStyleProperty?(k: string, v: string): void } | null }
}

export interface SortableRootContext<T = unknown> {
  /** Reactive item array — source of truth for ordering. */
  items: Ref<T[]>
  /** Fixed item height in px (uniform-row swap math). */
  itemHeight: ComputedRef<number>
  /** Global interaction disable. */
  disabled: ComputedRef<boolean>
  /** Currently lifted index (BG-side, drives slot `dragging` flag). -1 if none. */
  draggingIndex: Ref<number>

  // ── MT-shared state ──────────────────────────────────────────────────────
  /** MT-shared registry of every mounted item's handle. */
  itemHandlesMT: MainThreadRef<SortableItemHandle[]>
  /** MT mirror of `itemHeight`. */
  itemHeightMT: MainThreadRef<number>
  /** MT mirror of `disabled`. */
  disabledMT: MainThreadRef<boolean>
  /** Currently lifted index, MT side. -1 if none. Used to gate concurrent touches. */
  draggingIndexMT: MainThreadRef<number>
  /** Long-press activation delay in ms. */
  longPressMsMT: MainThreadRef<number>

  // ── Autoscroll (MT) ──────────────────────────────────────────────────────
  /** Scroll container element (the root view). null when not yet mounted. */
  scrollRefMT: MainThreadRef<{ scrollTop?: number, scrollHeight?: number, clientHeight?: number, scrollTo?(o: { top?: number, behavior?: string }): void } | null>
  /** Viewport top in page coords, px. Measured on mount. */
  viewportTopMT: MainThreadRef<number>
  /** Viewport height, px. Measured on mount; 0 disables autoscroll. */
  viewportHeightMT: MainThreadRef<number>
  /** Edge band (px from top/bottom) within which autoscroll engages. 0 = off. */
  autoScrollEdgeMT: MainThreadRef<number>
  /** Max autoscroll speed in px per touchmove frame. */
  autoScrollSpeedMT: MainThreadRef<number>

  // ── BG callbacks invoked from MT worklets ────────────────────────────────
  /** Commit a reorder from `from` → `to`. Emits `update:modelValue` + `reorder`. */
  commitReorder: (from: number, to: number) => void
  /** Mark drag started (sets `draggingIndex` for slot reactivity). */
  notifyDragStart: (index: number) => void
  /** Mark drag ended without a commit (e.g. cancel). */
  notifyDragEnd: () => void
}

export const [injectSortableRootContext, provideSortableRootContext]
  = createContext<SortableRootContext>('SortableRoot')
