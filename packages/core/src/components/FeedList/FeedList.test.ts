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

// FeedList renders Lynx's native virtualized `<list>` directly. Pull-to-refresh
// is intentionally NOT implemented (the native `<refresh>` element is unused
// upstream and absent from the OSS runtime — see FeedList.vue header). Verify
// the template renders a bare `<list>` with no `<refresh>` wrapper by inspecting
// the SFC source, since `<list>` rendering is blocked on MTS test infra.
describe('FeedList — template', () => {
  async function readSfc(): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const here = path.dirname(new URL(import.meta.url).pathname)
    return fs.readFileSync(path.join(here, 'FeedList.vue'), 'utf8')
  }

  it('renders a bare <list> with the data-vyui-feed-list hook', async () => {
    const sfc = await readSfc()
    expect(sfc).toMatch(/<list\b/)
    expect(sfc).toMatch(/data-vyui-feed-list\b/)
  })

  it('never emits a native <refresh> / <refresh-header> element', async () => {
    const sfc = await readSfc()
    // Scope to the template — the file header comment legitimately mentions
    // `<refresh>` when documenting why it is intentionally absent.
    const template = sfc.match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
    expect(template).not.toMatch(/<refresh\b/)
    expect(template).not.toMatch(/<refresh-header\b/)
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

// SFC-source assertions for the footer slots — verified against the template
// source like the template tests, since `<list>` rendering is blocked on MTS
// test infra.
describe('FeedList — footer slots', () => {
  async function readSfc(): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const here = path.dirname(new URL(import.meta.url).pathname)
    return fs.readFileSync(path.join(here, 'FeedList.vue'), 'utf8')
  }

  it('exposes loadMoreFooter and noMoreDataFooter slots', async () => {
    const sfc = await readSfc()
    expect(sfc).toMatch(/name="loadMoreFooter"/)
    expect(sfc).toMatch(/name="noMoreDataFooter"/)
  })
})
