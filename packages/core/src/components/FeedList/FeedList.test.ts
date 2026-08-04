// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { describe, expect, it, vi } from 'vitest'

// FeedList's pull-to-refresh worklets fire on a device only, and its BG helpers
// (`keyFor`, the refresh callbacks) are `<script setup>`-local with no observable
// DOM output — so this suite pins the SFC source itself rather than mirroring the
// logic, which would pass no matter what the component does. Keep the hygienic
// vue-lynx mock used elsewhere to avoid `internal/ops` source-map noise.
vi.mock('vue-lynx', async () => {
  const actual = await vi.importActual<typeof import('vue-lynx')>('vue-lynx')
  return { ...actual }
})

async function readSfc(): Promise<string> {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const here = path.dirname(new URL(import.meta.url).pathname)
  return fs.readFileSync(path.join(here, 'FeedList.vue'), 'utf8')
}

function body(sfc: string, fn: string): string {
  return sfc.match(new RegExp(`function ${fn}[\\s\\S]*?\\n}`))?.[0] ?? ''
}

describe('FeedList — exports', () => {
  it('exports FeedList default', async () => {
    const mod = await import('.')
    expect(mod.FeedList).toBeDefined()
  })
})

// `keyFor` feeds the row `v-for` key and the native `item-key` attr; neither
// derivation is readable back out of the rendered tree, so pin the source.
describe('FeedList — keyFor', () => {
  it('prefers the itemKey fn, then itemKeyField, then the index', async () => {
    const fn = body(await readSfc(), 'keyFor')
    expect(fn).toMatch(/if \(typeof props\.itemKey === 'function'\) return props\.itemKey\(item, index\)/)
    expect(fn).toMatch(/const field = \(props\.itemKeyField \?\? 'id'\)/)
    expect(fn).toMatch(/if \(v == null\) return String\(index\)/)
    expect(fn).toMatch(/return String\(v\)/)
  })

  it('is what both list branches key their rows on', async () => {
    const sfc = await readSfc()
    expect(sfc.match(/:key="keyFor\(item, index\)"/g)?.length).toBe(2)
    expect(sfc.match(/'item-key': keyFor\(item, index\)/g)?.length).toBe(2)
  })
})

// Pull-to-refresh is a custom rubber-band driven by `:main-thread-bindtouch*`
// worklets on a BARE `<list>` (no native `<refresh>` wrapper, no
// gesture-runtime). The MT worklets cannot run under vitest, so assert the SFC
// wiring by inspecting the template/script source: enableRefresh gates a
// translated wrapper + the refreshHeader slot exposes `{ state, progress }`,
// the touch handlers are bound, and the public API matches the demo contract.
describe('FeedList — PTR wiring (touch worklets)', () => {
  it('renders a translated wrapper + bare <list> (no native <refresh>) when enableRefresh is true', async () => {
    const sfc = await readSfc()
    // Look only at the <template> block so the explanatory comments above it
    // (which mention `<refresh>` in prose) don't trip the assertions.
    const template = sfc.match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
    expect(template).not.toBe('')
    // No native refresh element anymore.
    expect(template).not.toMatch(/<refresh[\s>]/)
    expect(template).not.toMatch(/<refresh-header[\s>]/)
    // The PTR/bounce branch is gated on enableRefresh || enableBounce and wraps
    // the list in a main-thread-ref'd wrapper that the worklets translate.
    expect(template).toMatch(/v-else-if="enableRefresh \|\| enableBounce"/)
    expect(template).toMatch(/:main-thread-ref="wrapperRef"/)
    expect(template).toMatch(/:main-thread-ref="listRef"/)
    expect(template).toMatch(/data-vyui-feed-list\b/)
  })

  it('exposes { state, progress } slot props on the refreshHeader slot', async () => {
    const sfc = await readSfc()
    expect(sfc).toMatch(/name="refreshHeader"\s+:state="refreshState"\s+:progress="pullProgress"/)
  })

  it('drives PTR via :main-thread-bindtouch* worklets, not gesture-runtime', async () => {
    const sfc = await readSfc()
    const template = sfc.match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
    // Touch worklets are bound on the PTR list; scroll offset is tracked to gate
    // the pull to the top edge.
    expect(template).toMatch(/:main-thread-bindtouchstart="_onTouchStart"/)
    expect(template).toMatch(/:main-thread-bindtouchmove="_onTouchMove"/)
    expect(template).toMatch(/:main-thread-bindtouchend="_onTouchEnd"/)
    expect(template).toMatch(/:main-thread-bindscroll="_onScrollMT"/)
    // Native bounce is forced off on the PTR list so the top pull isn't stolen.
    expect(template).toMatch(/:bounces="false"/)
    // No gesture-runtime: no manual detector install call, no gesture bind attr.
    // (The header comment may mention `__SetGestureDetector` in prose to explain
    // why it's avoided — assert there's no actual *call* to it.)
    expect(sfc).not.toMatch(/__SetGestureDetector\s*\(/)
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

// The refresh state machine is plain reactive BG logic driven by the worklets
// (`runOnBackground(_onPull)` etc). The callbacks are `<script setup>`-local, so
// the `idle → pulling → releaseReady → refreshing → done → idle` lifecycle and
// its guards are pinned from the source.
describe('FeedList — refresh state machine', () => {
  it('dedupes state writes so refreshStateChange only fires on real transitions', async () => {
    const fn = body(await readSfc(), 'setRefreshState')
    expect(fn).toMatch(/if \(refreshState\.value === next\) return/)
    expect(fn).toMatch(/emits\('refreshStateChange', next\)/)
  })

  it('reports releaseReady past the threshold, and is inert while refreshing', async () => {
    const fn = body(await readSfc(), '_onPull')
    expect(fn).toMatch(/pullProgress\.value = progress/)
    expect(fn).toMatch(/if \(refreshing\.value\) return/)
    expect(fn).toMatch(/setRefreshState\(releaseReady \? 'releaseReady' : 'pulling'\)/)
  })

  it('returns to idle on release only when no refresh is in flight', async () => {
    const fn = body(await readSfc(), '_onRelease')
    expect(fn).toMatch(/pullProgress\.value = 0/)
    expect(fn).toMatch(/if \(!refreshing\.value\) setRefreshState\('idle'\)/)
  })

  it('fires refresh once — the guard precedes the emit so a held pull cannot re-trigger', async () => {
    const fn = body(await readSfc(), '_onTriggerRefresh')
    expect(fn).toMatch(/if \(refreshing\.value\) return/)
    expect(fn).toMatch(/refreshing\.value = true/)
    expect(fn).toMatch(/setRefreshState\('refreshing'\)/)
    expect(fn.indexOf('if (refreshing.value) return')).toBeLessThan(fn.indexOf('emits(\'refresh\')'))
  })

  it('springs closed through done before idle', async () => {
    const sfc = await readSfc()
    expect(body(sfc, '_onClosed')).toMatch(/setRefreshState\('done'\)[\s\S]*setRefreshState\('idle'\)/)
    // …and the MT spring-back is what calls it.
    expect(body(sfc, '_springClose')).toMatch(/runOnBackground\(_onClosed as any\)\(\)/)
  })
})

// `_rubber` is a hand-kept copy of `physics.ts` `rubberEffect` — cross-file
// worklet calls don't resolve, so the maths is duplicated. physics.test.ts owns
// the behavioural spec; pin the copy's terms here so drift is caught.
describe('FeedList — inline rubber mirrors physics.ts', () => {
  it('keeps the rubberEffect terms in the _rubber worklet', async () => {
    const fn = body(await readSfc(), '_rubber')
    expect(fn).toMatch(/'main thread'/)
    expect(fn).toMatch(/if \(delta === 0 \|\| bounceWidth === 0\) return 0/)
    expect(fn).toMatch(/const swipeLimit = bounceWidth \* 2/)
    expect(fn).toMatch(/const effective = absDelta < swipeLimit \? absDelta : swipeLimit/)
    expect(fn).toMatch(/const bounce = effective \/ \(effective \/ bounceWidth \+ 1\)/)
    // 1.5 is `scaleFactor` in physics.ts.
    expect(fn).toMatch(/return sign \* bounce \* 1\.5/)
  })
})
