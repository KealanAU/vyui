// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Public surface for the Presence primitive. Phase-2 consumers import from
// here.
//
// Side-effect import: ships the shared `vyui-fade-*`, `vyui-zoom-*`,
// `vyui-slide-*-in/out` keyframes so any Presence consumer (Dialog,
// AlertDialog, Sheet, ...) can reference them in its own `.ui-entering` /
// `.ui-leaving` rules without redefining the @keyframes block. Kept in
// the package's `sideEffects` allowlist (`**/*.css`) so the import is
// not tree-shaken out of the published bundle.
import './presence.css'

export {
  default as Presence,
  PresenceContextKey,
  type PresenceProps,
  type PresenceSlotProps,
} from './Presence'

export {
  MAX_WAIT_FRAMES,
  usePresence,
  type UsePresenceRefOptions,
} from './usePresence'

export {
  usePresenceGroup,
  type PresenceGroupChild,
  type UsePresenceGroupOptions,
  type UsePresenceGroupReturn,
} from './usePresenceGroup'

export {
  PresenceState,
  presenceClassVariants,
  resolveAnimationStatus,
  resolveBusyState,
} from './utils'

export type {
  PresenceAnimationStatus,
  PresenceChildrenType,
  PresenceContextType,
  PresenceUiVariants,
  UsePresenceOptions,
  UsePresenceReturnType,
} from './types'
