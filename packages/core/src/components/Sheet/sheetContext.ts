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
   * Current snap index, 0..snapPoints.length-1 (0 = smallest fraction =
   * most closed). Drag settles write it; writing it moves the open sheet.
   * Persists across close/reopen.
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
  /**
   * Whether drag past the most-closed snap dismisses. `false` with multiple
   * snap points still allows drag between snaps.
   */
  enableDragToClose: ComputedRef<boolean>
  /** Restrict drag to the SheetHandle when true. */
  handleOnly: ComputedRef<boolean>
  /** Open or close — emits update:open. */
  setOpen: (next: boolean) => void
  /** Snap to a specific index, animated. */
  setSnap: (index: number) => void
  /**
   * MT-side panel progress (1 = fully open, 0 = the full panel height
   * toward closed). SheetContent's worklets write it on touchmove,
   * release/cancel, programmatic snap moves, and the non-drag close from
   * an intermediate snap. The CSS keyframe open/close animations do NOT
   * touch it, so MT readers must not treat it as a general open-ness
   * signal.
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
  /**
   * Set by SheetContent's release worklet when a drag DISMISSES the sheet:
   * from that point the MT inline transition is already painting the panel
   * and backdrop off-screen, so the panel/backdrop drop their `ui-leaving`
   * class and the `.ui-leaving` keyframes never apply.
   *
   * Without this the close is driven TWICE — the inline transition from the
   * release position, and Presence's keyframe, which starts from the
   * fully-open underlying value and so yanks the panel back up and replays
   * the exit. Inline `animation: 'none'` was supposed to suppress the
   * keyframe, but a class-driven animation wins over it on the Lynx style
   * path. Reset by SheetRoot whenever `open` flips back to `true`.
   */
  dragClosing: Ref<boolean>
}

export const [injectSheetRootContext, provideSheetRootContext] =
  createContext<SheetRootContext>('SheetRoot')

/**
 * Gesture handler bag (touch + desktop-mouse twins) shared between
 * SheetContent and SheetHandle so the handle can drive the same MT drag
 * pipeline as the content surface. Provided by SheetContent, injected by
 * SheetHandle.
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
