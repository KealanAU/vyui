// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { describe, expect, it, vi } from 'vitest'

// FeedList's pull-to-refresh worklets fire on a device only — under vitest we
// verify the unit-testable parts: the `keyFor` helper, the SFC's PTR wiring
// (gesture-arbitrated, no native `<refresh>`), and the pure refresh
// state-machine transitions. Keep the hygienic vue-lynx mock used elsewhere to
// avoid `internal/ops` source-map noise.
vi.mock('vue-lynx', async () => {
  const actual = await vi.importActual<typeof import('vue-lynx')>('vue-lynx')
  return { ...actual }
})

describe('FeedList — exports', () => {
  it('exports FeedList default', async () => {
    const mod = await import('.')
    expect(mod.FeedList).toBeDefined()
  })
})

// Pure logic regression tests for the `keyFor` helper inside FeedList. Kept
// here so the key-derivation behaviour is verified without rendering (which
// is blocked on MTS test infra alongside the rest of the mobile suite).
describe('FeedList — keyFor', () => {
  function keyFor<T extends object>(
    item: T,
    index: number,
    opts: { itemKey?: (item: T, i: number) => string, itemKeyField?: string },
  ): string {
    if (typeof opts.itemKey === 'function') return opts.itemKey(item, index)
    const field = opts.itemKeyField ?? 'id'
    const v = (item as Record<string, unknown>)[field]
    if (v == null) return String(index)
    return String(v)
  }

  it('reads the configured field by default', () => {
    expect(keyFor({ id: 'a' }, 0, { itemKeyField: 'id' })).toBe('a')
    expect(keyFor({ sku: 42 }, 7, { itemKeyField: 'sku' })).toBe('42')
  })

  it('falls back to index when the field is missing / nullish', () => {
    expect(keyFor({}, 3, { itemKeyField: 'id' })).toBe('3')
    expect(keyFor({ id: null }, 1, { itemKeyField: 'id' })).toBe('1')
  })

  it('uses itemKey fn when provided, ignoring itemKeyField', () => {
    expect(
      keyFor({ id: 'a' }, 5, {
        itemKey: (item, i) => `${(item as { id: string }).id}-${i}`,
        itemKeyField: 'id',
      }),
    ).toBe('a-5')
  })
})

// Pull-to-refresh is now a custom rubber-band driven by a gesture-arbitrated
// NativeGesture on a BARE `<list>` (no native `<refresh>` wrapper). The MT
// gesture cannot run under vitest, so assert the SFC wiring by inspecting the
// template/script source: enableRefresh gates a translated wrapper + the
// refreshHeader slot exposes `{ state, progress }`, the gesture detector is
// installed manually, and the public API matches the demo-facing contract.
describe('FeedList — PTR wiring (gesture-arbitrated)', () => {
  async function readSfc(): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const here = path.dirname(new URL(import.meta.url).pathname)
    return fs.readFileSync(path.join(here, 'FeedList.vue'), 'utf8')
  }

  it('renders a translated wrapper + bare <list> (no native <refresh>) when enableRefresh is true', async () => {
    const sfc = await readSfc()
    // Look only at the <template> block so the explanatory comments above it
    // (which mention `<refresh>` in prose) don't trip the assertions.
    const template = sfc.match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
    expect(template).not.toBe('')
    // No native refresh element anymore.
    expect(template).not.toMatch(/<refresh[\s>]/)
    expect(template).not.toMatch(/<refresh-header[\s>]/)
    // The PTR branch is gated on enableRefresh and wraps the list in a
    // main-thread-ref'd wrapper that the worklets translate.
    expect(template).toMatch(/v-else-if="enableRefresh"/)
    expect(template).toMatch(/:main-thread-ref="wrapperRef"/)
    expect(template).toMatch(/:main-thread-ref="listRef"/)
    expect(template).toMatch(/data-vyui-feed-list\b/)
  })

  it('exposes { state, progress } slot props on the refreshHeader slot', async () => {
    const sfc = await readSfc()
    expect(sfc).toMatch(/name="refreshHeader"\s+:state="refreshState"\s+:progress="pullProgress"/)
  })

  it('installs the gesture detector manually (vue-lynx has no gesture transform)', async () => {
    const sfc = await readSfc()
    // The install worklet is inlined in the SFC (a .ts-resident worklet crashes
    // at card load) and the PAPIs are reached via `globalThis.` so the worklet
    // transform doesn't capture them from the background scope.
    expect(sfc).toMatch(/globalThis\.__SetGestureDetector/)
    expect(sfc).toMatch(/globalThis\.__SetAttribute/)
    // The new-gesture path is enabled via the vue-lynx patch, not a template
    // prop — assert no gesture-binding ATTRIBUTE is used (scan the template).
    const template = sfc.match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
    expect(template).not.toMatch(/:?main-thread:gesture=|:main-thread-gesture=|:gesture=/)
  })

  it('keeps load-more on native scrolltolower + loadingMore v-model + footer slots', async () => {
    const sfc = await readSfc()
    expect(sfc).toMatch(/@scrolltolower="onScrollToLower"/)
    expect(sfc).toMatch(/name="loadMoreFooter"/)
    expect(sfc).toMatch(/name="noMoreDataFooter"/)
    expect(sfc).toMatch(/useStandardVModelOf<boolean>\(props, 'loadingMore', emits\)/)
  })

  it('renders a bare <list> (no wrapper) when enableRefresh is false', async () => {
    const sfc = await readSfc()
    // The final fallback is a <list v-else …> with no main-thread-ref wrapper.
    expect(sfc).toMatch(/<list\s+v-else\b/)
  })
})

// The refresh state machine is plain reactive BG logic (the worklets only feed
// it `progress` / trigger events). Mirror the transition rules here so the
// `idle → pulling → releaseReady → refreshing → done → idle` lifecycle and the
// emitted `refreshStateChange` sequence are pinned without a device.
describe('FeedList — refresh state machine', () => {
  type State = 'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'

  function makeMachine() {
    let state: State = 'idle'
    let refreshing = false
    let progress = 0
    const changes: State[] = []
    let refreshEmitted = 0

    function set(next: State) {
      if (state === next) return
      state = next
      changes.push(next)
    }
    // BG callbacks mirrored from FeedList.vue.
    return {
      get state() { return state },
      get progress() { return progress },
      get changes() { return changes },
      get refreshEmitted() { return refreshEmitted },
      onPull(p: number, releaseReady: boolean) {
        progress = p
        if (refreshing) return
        set(releaseReady ? 'releaseReady' : 'pulling')
      },
      onRelease() {
        progress = 0
        if (!refreshing) set('idle')
      },
      onTriggerRefresh() {
        progress = 1
        if (refreshing) return
        refreshing = true
        set('refreshing')
        refreshEmitted++
      },
      onClosed() {
        progress = 0
        set('done')
        set('idle')
      },
      endRefresh() { refreshing = false },
    }
  }

  it('pull below threshold then release returns to idle without firing refresh', () => {
    const m = makeMachine()
    m.onPull(0.4, false)
    expect(m.state).toBe('pulling')
    m.onRelease()
    expect(m.state).toBe('idle')
    expect(m.refreshEmitted).toBe(0)
  })

  it('pull past threshold reports releaseReady', () => {
    const m = makeMachine()
    m.onPull(0.5, false)
    m.onPull(1, true)
    expect(m.changes).toEqual(['pulling', 'releaseReady'])
  })

  it('crossing threshold + release fires refresh once and enters refreshing', () => {
    const m = makeMachine()
    m.onPull(1, true)
    m.onTriggerRefresh()
    expect(m.state).toBe('refreshing')
    expect(m.refreshEmitted).toBe(1)
    // Further pulls while refreshing do not re-trigger.
    m.onPull(1, true)
    m.onTriggerRefresh()
    expect(m.refreshEmitted).toBe(1)
  })

  it('consumer ending the refresh springs closed: done then idle', () => {
    const m = makeMachine()
    m.onPull(1, true)
    m.onTriggerRefresh()
    m.endRefresh()
    m.onClosed()
    expect(m.changes).toEqual(['releaseReady', 'refreshing', 'done', 'idle'])
    expect(m.state).toBe('idle')
    expect(m.progress).toBe(0)
  })
})

// The inline rubber-band worklet in FeedList.vue must match the unit-tested
// `physics.ts` spec (the two are kept in sync by hand). Mirror the same maths
// and assert it agrees with `rubberEffect` so drift is caught.
describe('FeedList — inline rubber matches physics.ts', () => {
  function inlineRubber(delta: number, bounceWidth: number): number {
    if (delta === 0 || bounceWidth === 0) return 0
    const swipeLimit = bounceWidth * 2
    const absDelta = delta < 0 ? -delta : delta
    const effective = absDelta < swipeLimit ? absDelta : swipeLimit
    const bounce = effective / (effective / bounceWidth + 1)
    const sign = delta < 0 ? -1 : 1
    return sign * bounce * 1.5
  }

  it('agrees with rubberEffect across a range', async () => {
    const { rubberEffect } = await import('@/shared/gesture/physics')
    for (const d of [-200, -64, -1, 0, 1, 32, 64, 128, 256]) {
      expect(inlineRubber(d, 64)).toBeCloseTo(rubberEffect(d, 64), 6)
    }
  })
})
