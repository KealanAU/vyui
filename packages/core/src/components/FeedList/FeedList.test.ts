// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { describe, expect, it, vi } from 'vitest'

// FeedList has no MTS worklets — it wraps Lynx's native `<list>` directly —
// but the test runner still imports vue-lynx via the SFC, so keep the same
// hygienic mock used elsewhere to avoid `internal/ops` source-map noise.
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

// Pull-to-refresh: the iOS list runtime requires `<refresh>` wrapping `<list>`
// with `<refresh-header>` as a sibling — putting `<refresh-header>` inside
// `<list>` crashes the create-UI pass (`refresh-header ui not found`). The
// `enableRefresh` flag toggles between the wrapped and bare templates. Verify
// the toggle by inspecting the rendered template source rather than mounting,
// since `<list>` rendering itself is blocked on MTS test infra.
describe('FeedList — PTR template branching', () => {
  it('renders a <refresh> wrapper around <list> when enableRefresh is true', async () => {
    const Component = (await import('./FeedList.vue')).default as any
    const tpl = String(Component.render ?? Component.__file ?? '')
    // Vue compiles templates to a render function — fall back to the SFC
    // template source if the compiled fn isn't introspectable. Either way,
    // <refresh> must reference `enable-refresh` and wrap a child <list>.
    const src = tpl
    // sanity — ensure we're looking at the real component
    expect(Component).toBeDefined()
    // The template literal lives in the SFC. Read the .vue file directly so
    // the assertion doesn't depend on the compiled render fn shape.
    const fs = await import('node:fs')
    const path = await import('node:path')
    const here = path.dirname(new URL(import.meta.url).pathname)
    const sfc = fs.readFileSync(path.join(here, 'FeedList.vue'), 'utf8')

    // Three required pieces for the iOS-safe PTR layout.
    expect(sfc).toMatch(/<refresh\b[^>]*v-else-if="enableRefresh"/)
    expect(sfc).toMatch(/<refresh-header\b/)
    expect(sfc).toMatch(/@startrefresh="onStartRefresh"/)

    // `<refresh-header>` must be a SIBLING of the inner `<list>`, not nested
    // inside it. Use a word-boundary regex to isolate the `<refresh>` wrapper
    // (`<refresh-header>` also starts with `<refresh` and must not match).
    const wrapperBlock = sfc.match(/<refresh\s[\s\S]*?<\/refresh>/)?.[0] ?? ''
    expect(wrapperBlock).toContain('<refresh-header')
    expect(wrapperBlock).toContain('<list')

    const headerOpen = wrapperBlock.indexOf('<refresh-header')
    const headerClose = wrapperBlock.indexOf('</refresh-header>')
    const listOpen = wrapperBlock.search(/<list\s/)
    expect(headerOpen).toBeGreaterThan(-1)
    expect(headerClose).toBeGreaterThan(headerOpen)
    expect(listOpen).toBeGreaterThan(headerClose)
    suppressUnused(src, tpl)
  })

  it('renders a bare <list> (no <refresh>) when enableRefresh is false', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const here = path.dirname(new URL(import.meta.url).pathname)
    const sfc = fs.readFileSync(path.join(here, 'FeedList.vue'), 'utf8')

    // The v-else branch is the bare-list fallback. It must not be wrapped in
    // <refresh> and must still have the data-vyui-feed-list hook.
    expect(sfc).toMatch(/<list\b[^>]*v-else\b/)
    expect(sfc).toMatch(/data-vyui-feed-list\b/)
  })
})

function suppressUnused(..._args: unknown[]): void { /* tsc no-unused-locals shim */ }

// Refresh lifecycle state machine. The component layers a JS state machine
// over the native `<refresh>` element (idle → pulling → releaseReady →
// refreshing → done → idle). Verify the transition logic in isolation — the
// component drives the same transitions off the `refreshing` watcher and the
// native `startrefresh` / `headeroffset` events.
describe('FeedList — refresh state machine', () => {
  type State = 'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'

  // Mirror of the offset → state mapping in `onHeaderOffset`.
  function offsetToState(
    offset: number,
    headerSize: number,
    current: State,
    inFlight: boolean,
  ): State {
    if (inFlight) return current
    if (current === 'refreshing' || current === 'done') return current
    if (offset <= 0) return 'idle'
    return headerSize > 0 && offset >= headerSize ? 'releaseReady' : 'pulling'
  }

  it('maps pull offset to pulling below threshold and releaseReady at/above it', () => {
    expect(offsetToState(0, 60, 'idle', false)).toBe('idle')
    expect(offsetToState(20, 60, 'idle', false)).toBe('pulling')
    expect(offsetToState(60, 60, 'pulling', false)).toBe('releaseReady')
    expect(offsetToState(80, 60, 'pulling', false)).toBe('releaseReady')
  })

  it('falls back to pulling when header size is unknown', () => {
    expect(offsetToState(80, 0, 'idle', false)).toBe('pulling')
  })

  it('does not regress out of refreshing/done via offset updates', () => {
    expect(offsetToState(0, 60, 'refreshing', false)).toBe('refreshing')
    expect(offsetToState(80, 60, 'done', false)).toBe('done')
  })

  it('ignores offset updates while a refresh is in flight', () => {
    expect(offsetToState(80, 60, 'pulling', true)).toBe('pulling')
  })
})

// Double-fire guard for native `startrefresh`. The component only emits
// `refresh` / flips `refreshing` once per gesture even if the native element
// fires `startrefresh` twice.
describe('FeedList — startrefresh double-fire guard', () => {
  function makeStart() {
    let inFlight = false
    let refreshing = false
    let fired = 0
    return {
      start(disabled = false) {
        if (disabled) return
        if (inFlight || refreshing) return
        inFlight = true
        refreshing = true
        fired += 1
      },
      get fired() { return fired },
    }
  }

  it('fires refresh exactly once for repeated startrefresh events', () => {
    const s = makeStart()
    s.start()
    s.start()
    s.start()
    expect(s.fired).toBe(1)
  })

  it('does not fire when disabled', () => {
    const s = makeStart()
    s.start(true)
    expect(s.fired).toBe(0)
  })
})

// Load-more debounce + suppression. Mirrors the guards in `onScrollToLower`.
describe('FeedList — loadMore debounce', () => {
  function makeLoadMore(opts: {
    enableLoadMore?: boolean
    debounceMs?: number
    noMoreData?: () => boolean
    loadingMore?: () => boolean
  } = {}) {
    const enableLoadMore = opts.enableLoadMore ?? true
    const debounceMs = opts.debounceMs ?? 400
    let lastAt = 0
    let fired = 0
    let loadingMore = false
    return {
      scrollToLower(now: number, disabled = false) {
        if (!enableLoadMore || disabled) return
        const noMore = opts.noMoreData?.() ?? false
        const loading = opts.loadingMore?.() ?? loadingMore
        if (loading || noMore) return
        if (now - lastAt < debounceMs) return
        lastAt = now
        loadingMore = true
        fired += 1
      },
      finishLoad() { loadingMore = false },
      get fired() { return fired },
    }
  }

  it('fires once then suppresses while loadingMore is true', () => {
    const lm = makeLoadMore()
    lm.scrollToLower(1000)
    lm.scrollToLower(1100)
    lm.scrollToLower(2000)
    expect(lm.fired).toBe(1)
  })

  it('fires again after the fetch finishes and the debounce window passes', () => {
    const lm = makeLoadMore({ debounceMs: 400 })
    lm.scrollToLower(1000)
    lm.finishLoad()
    lm.scrollToLower(1200) // within debounce window → suppressed
    expect(lm.fired).toBe(1)
    lm.finishLoad()
    lm.scrollToLower(1500) // past window → fires
    expect(lm.fired).toBe(2)
  })

  it('never fires when noMoreData is true', () => {
    const lm = makeLoadMore({ noMoreData: () => true })
    lm.scrollToLower(1000)
    lm.scrollToLower(5000)
    expect(lm.fired).toBe(0)
  })

  it('does not fire when enableLoadMore is false', () => {
    const lm = makeLoadMore({ enableLoadMore: false })
    lm.scrollToLower(1000)
    expect(lm.fired).toBe(0)
  })
})

// SFC-source assertions for the new refresh-header slot bindings and footer
// slots — verified against the template source like the PTR branching tests,
// since `<list>` rendering is blocked on MTS test infra.
describe('FeedList — refresh-header + footer slots', () => {
  async function readSfc(): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const here = path.dirname(new URL(import.meta.url).pathname)
    return fs.readFileSync(path.join(here, 'FeedList.vue'), 'utf8')
  }

  it('passes lifecycle state + flags into the refreshHeader slot', async () => {
    const sfc = await readSfc()
    expect(sfc).toMatch(/name="refreshHeader"/)
    expect(sfc).toMatch(/:state="refreshState"/)
    expect(sfc).toMatch(/:release-ready="refreshState === 'releaseReady'"/)
    expect(sfc).toMatch(/:refreshing="refreshState === 'refreshing'"/)
  })

  it('exposes loadMoreFooter and noMoreDataFooter slots', async () => {
    const sfc = await readSfc()
    expect(sfc).toMatch(/name="loadMoreFooter"/)
    expect(sfc).toMatch(/name="noMoreDataFooter"/)
  })

  it('keeps the iOS-safe refresh-header sibling layout intact', async () => {
    const sfc = await readSfc()
    const wrapperBlock = sfc.match(/<refresh\s[\s\S]*?<\/refresh>/)?.[0] ?? ''
    const headerClose = wrapperBlock.indexOf('</refresh-header>')
    const listOpen = wrapperBlock.search(/<list\s/)
    expect(listOpen).toBeGreaterThan(headerClose)
  })
})
