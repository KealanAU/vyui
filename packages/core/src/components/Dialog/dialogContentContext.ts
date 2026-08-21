// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Bridges DialogContent (group orchestrator) to DialogContentImpl (the painted
// backdrop + panel): DialogContent owns the per-child Presence state slots and
// setters, and the impl reads them so each layer drives its own `<Presence>` in
// controlled mode.
//
// A dedicated context rather than the root one because the impl mounts via the
// OverlayRoot portal while the group orchestration lives in DialogContent's
// setup tree — provides captured there flow through `registerOverlay` and are
// re-injected at paint time, so this context survives the portal hop.

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
