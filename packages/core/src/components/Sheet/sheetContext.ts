// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import type { ComputedRef, Ref } from 'vue'
import type { MainThreadRef } from 'vue-lynx'

import { createContext } from '../../shared/createContext'

export interface SheetRootContext {
  /** Controlled open state. */
  open: Ref<boolean>
  /** Current snap index. 0..snapPoints.length-1 when open. */
  snapIndex: Ref<number>
  /** Snap points (0-1 fractions of viewport height), low to high. */
  snapPoints: ComputedRef<number[]>
  /** Viewport height in px (resolved from prop / runtime). */
  viewportHeight: ComputedRef<number>
  /**
   * Velocity threshold for fling-to-snap (px/s). Currently unused —
   * reserved for multi-snap drag settle, which isn't implemented yet.
   */
  velocityThreshold: ComputedRef<number>
  /** Velocity threshold for fling-to-dismiss (px/s). */
  dismissVelocity: ComputedRef<number>
  /** Animation duration for settle (ms). */
  duration: ComputedRef<number>
  /** Whether the user can drag below the first snap to dismiss. */
  enableDragToClose: ComputedRef<boolean>
  /** Restrict drag to the SheetHandle when true. */
  handleOnly: ComputedRef<boolean>
  /** Open or close — emits update:open. */
  setOpen: (next: boolean) => void
  /** Snap to a specific index, animated. */
  setSnap: (index: number) => void
  /**
   * MT-side drag progress (1 = fully open, 0 = dragged the full panel
   * height). SheetContent's touch worklets write it on touchmove and on
   * release/cancel. Only updated during drag — CSS-driven open/close
   * animations do NOT touch it, so MT readers must not treat it as a
   * general open-ness signal.
   */
  progressMTRef: MainThreadRef<number>
  /**
   * MT element handle for the backdrop. SheetBackdrop populates it via
   * `:main-thread-ref` on mount; SheetContent's drag worklets paint inline
   * `opacity` on it directly so the fade is sync'd to drag position with no
   * extra polling loop. May be null — sheets can render without a backdrop,
   * and Presence unmounts it on close — so painters must null-check.
   */
  backdropElRef: MainThreadRef<any>
}

export const [injectSheetRootContext, provideSheetRootContext] =
  createContext<SheetRootContext>('SheetRoot')

/**
 * Touch handler bag shared between SheetContent and SheetHandle so the
 * handle can drive the same MT drag pipeline as the content surface.
 * Provided by SheetContent, injected by SheetHandle.
 */
export interface SheetDragContext {
  handleTouchStartMT: any
  handleTouchMoveMT: any
  handleTouchEndMT: any
}

export const [injectSheetDragContext, provideSheetDragContext] =
  createContext<SheetDragContext | null>('SheetContent', 'SheetDrag')
