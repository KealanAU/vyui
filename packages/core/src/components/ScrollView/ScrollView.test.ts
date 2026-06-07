// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Full render coverage of ScrollView is blocked on MTS test infra — the
// native `<scroll-view>` / `<refresh-header>` intrinsics + UI-method
// `invoke()` API don't have a vitest/jsdom equivalent. Manual verification
// runs in LynxExplorer. See plans/mobile-first-pivot.md §3D.

import { describe, expect, it } from 'vitest'

describe('ScrollView — exports', () => {
  it('exports ScrollView', async () => {
    const mod = await import('.')
    expect(mod.ScrollView).toBeDefined()
  })
})
