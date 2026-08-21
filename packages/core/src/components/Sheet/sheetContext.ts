// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import type { ComputedRef, Ref } from 'vue'
import type { MainThreadRef } from 'vue-lynx'

import { createContext } from '../../shared/createContext'
import type { SheetDirection } from '../../shared/composables'

export interface SheetRootContext {
  /** Controlled open state. */
  open: Ref<boolean>
  /**
   * Current snap index, 0..snapPoints.length-1 (0 = most closed). Drag settles
   * write it; writing it moves the open sheet. Persists across close/reopen.
   */
  snapIndex: Ref<number>
  /** Edge the sheet is anchored to. */
  side: ComputedRef<SheetDirection>
  /** Snap points (0-1 fractions of viewport extent on the sheet axis), low to high. */
  snapPoints: ComputedRef<number[]>
  /** Viewport height in px (resolved from prop / runtime). */
  viewportHeight: ComputedRef<number>
  /** Viewport width in px (resolved from prop / runtime). */
  viewportWidth: ComputedRef<number>
  /** Velocity threshold for fling-to-dismiss (px/s). */
  dismissVelocity: ComputedRef<number>
  /** Animation duration for settle (ms). */
  duration: ComputedRef<number>
  /** Whether drag past the most-closed snap dismisses. `false` with multiple
   *  snap points still allows drag between snaps. */
  enableDragToClose: ComputedRef<boolean>
  /** Restrict drag to the SheetHandle when true. */
  handleOnly: ComputedRef<boolean>
  /** Open or close — emits update:open. */
  setOpen: (next: boolean) => void
  /** Snap to a specific index, animated. */
  setSnap: (index: number) => void
  /**
   * MT-side panel progress (1 = fully open, 0 = a full panel height toward
   * closed), written by SheetContent's worklets. The CSS keyframe open/close
   * animations do NOT touch it, so it is not a general open-ness signal.
   */
  progressMTRef: MainThreadRef<number>
  /**
   * MT element handle for the backdrop, populated by SheetBackdrop via
   * `:main-thread-ref`. SheetContent's drag worklets paint inline `opacity` on
   * it so the fade tracks drag position. May be null — sheets can render
   * without a backdrop, and Presence unmounts it on close.
   */
  backdropElRef: MainThreadRef<any>
  /**
   * Set by SheetContent's release worklet when a drag DISMISSES the sheet: the
   * MT inline transition is already painting the panel and backdrop off-screen,
   * so both drop their `ui-leaving` class and the keyframes never apply.
   * Without it the close runs TWICE, the keyframe yanking the panel back to
   * fully open first. Inline `animation: 'none'` can't suppress it — a
   * class-driven animation wins on the Lynx style path. Reset by SheetRoot when
   * `open` flips back to `true`.
   */
  dragClosing: Ref<boolean>
}

export const [injectSheetRootContext, provideSheetRootContext] =
  createContext<SheetRootContext>('SheetRoot')

/**
 * Gesture handler bag (touch + desktop-mouse twins) shared between SheetContent
 * and SheetHandle so the handle drives the same MT drag pipeline. Provided by
 * SheetContent, injected by SheetHandle.
 */
export interface SheetDragContext {
  handleTouchStartMT: any
  handleTouchMoveMT: any
  handleTouchEndMT: any
  handleMouseDownMT: any
  handleMouseMoveMT: any
  handleMouseUpMT: any
}

export const [injectSheetDragContext, provideSheetDragContext] =
  createContext<SheetDragContext | null>('SheetContent', 'SheetDrag')
