// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Bridges DialogContent (group orchestrator) to DialogContentImpl (the
// painted backdrop + panel). DialogContent owns the per-child Presence
// state slots ([backdropState, panelState]) and the setters; the impl reads
// them so each layer can drive its own `<Presence>` in controlled mode.
//
// Why a dedicated context (and not the root context): the impl mounts via
// the OverlayRoot portal, but the group orchestration lives inside the
// DialogContent's setup tree. Provides captured on DialogContent flow
// through `registerOverlay(..., capturedProvides)` and are re-injected at
// paint time — so this context survives the portal hop.

import type { InjectionKey, Ref } from 'vue'
import type { PresenceState } from '@/components/Presence'

export interface DialogContentPresenceContext {
  /** Live state slot for the backdrop (`OverlayBackdrop` fade layer). */
  backdropState: Ref<PresenceState>
  /** Live state slot for the inner content panel (`Primitive` zoom). */
  panelState: Ref<PresenceState>
  /** Controlled-state setter for the backdrop's `<Presence>`. */
  setBackdropState: (s: PresenceState) => void
  /** Controlled-state setter for the panel's `<Presence>`. */
  setPanelState: (s: PresenceState) => void
  /** Drives `show` on both inner `<Presence>` wrappers. */
  show: Ref<boolean>
  /** Verbose lifecycle tracing — forwarded to both child Presence wrappers. */
  debugLog?: boolean
}

export const DialogContentPresenceKey: InjectionKey<DialogContentPresenceContext>
  = Symbol.for('vyui:DialogContentPresence')
