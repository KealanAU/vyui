// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
//
// Rewritten against the Lynx Slider rebuild. The drag lives entirely
// in SliderImplMTS's main-thread worklets, which cannot run under vitest (the
// SWC worklet transform isn't wired here), so there is no way to drive a
// gesture from a test. What IS reachable is the contract either side of it:
// what the component renders, and `commitFromMT` — the single background
// round-trip the touchend worklet makes per gesture, exposed on the root
// context. The worklets' own invariants are asserted against the SFC source at
// the bottom of this file, the same shape FeedList's PTR tests use.
//
// Assertions are on the emitted `update:modelValue` / `valueCommit` contract,
// not on rendered thumb geometry — the component renders absolute-positioned
// thumbs but jsdom does not paint.
import { describe, expect, it } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'
import { defineComponent, ref } from 'vue'
import { injectSliderRootContext, SliderRange, SliderRoot, SliderThumb, SliderTrack } from '.'

/** Captures the root context from inside the slider so tests can drive the
 *  same entry point the touchend worklet calls through `runOnBackground`. */
function makeProbe() {
  const seen: {
    commitFromMT?: (values: number[]) => void
    updateFromMT?: (values: number[]) => void
  } = {}
  const Probe = defineComponent({
    name: 'ContextProbe',
    setup() {
      const ctx = injectSliderRootContext()
      seen.commitFromMT = ctx.commitFromMT
      seen.updateFromMT = ctx.updateFromMT
      return () => null
    },
  })
  return { seen, Probe }
}

function mountSlider(props: Record<string, unknown> = {}) {
  const updates: number[][] = []
  const commits: number[][] = []
  const { seen, Probe } = makeProbe()
  const result = render({
    components: { SliderRoot, SliderTrack, SliderRange, SliderThumb, Probe },
    setup() {
      const model = ref<number[]>((props.modelValue as number[]) ?? (props.defaultValue as number[]) ?? [0])
      return {
        model,
        props,
        onUpdate: (v: number[]) => {
          model.value = v
          updates.push([...v])
        },
        onCommit: (v: number[]) => commits.push([...v]),
      }
    },
    template: `
      <SliderRoot
        :model-value="model"
        :disabled="props.disabled"
        :inverted="props.inverted"
        :orientation="props.orientation"
        :min-steps-between-thumbs="props.minStepsBetweenThumbs"
        @update:model-value="onUpdate"
        @value-commit="onCommit"
      >
        <SliderTrack><SliderRange /></SliderTrack>
        <SliderThumb v-for="(_, i) in model" :key="i" />
        <Probe />
      </SliderRoot>
    `,
  })
  return {
    ...result,
    updates,
    commits,
    live: (v: number[]) => seen.updateFromMT!(v),
    commit: (v: number[]) => seen.commitFromMT!(v),
  }
}

describe('SliderRoot rendering & a11y traits', () => {
  it('renders thumb with adjustable trait', () => {
    const { container } = mountSlider()
    const thumb = container.querySelector('[accessibility-traits="adjustable"]')
    expect(thumb).not.toBeNull()
  })

  it('marks root and thumb data-disabled when disabled', () => {
    const { container } = mountSlider({ disabled: true })
    expect(container.querySelector('[data-vyui-slider-impl]')!.getAttribute('data-disabled')).toBe('')
    expect(container.querySelector('.vyui-slider-thumb')!.getAttribute('data-disabled')).toBe('')
  })
})

// The thumb is centred on its value by translating back half its own size. The
// direction of that pull depends on which edge anchors it — `right: X%` pins the
// thumb's right edge, so it has to move the opposite way from a `left`-anchored
// one. Horizontal missed the flip, leaving inverted/RTL sliders' thumbs sitting
// half a thumb-width left of the fill. `getThumbInBoundsOffset` would have
// absorbed it, but it is always 0 on Lynx native — `useSize` leans on
// ResizeObserver / offsetWidth, neither of which exists there.
describe('SliderThumb centring follows the anchoring edge', () => {
  const transformOf = (container: Element) =>
    container.querySelector('.vyui-slider-thumb')?.getAttribute('style') ?? ''

  it('pulls left when anchored left, right when anchored right', () => {
    expect(transformOf(mountSlider().container)).toContain('translateX(-50%)')
    expect(transformOf(mountSlider({ inverted: true }).container)).toContain('translateX(50%)')
  })

  it('does the same on the vertical axis', () => {
    expect(transformOf(mountSlider({ orientation: 'vertical' }).container)).toContain('translateY(50%)')
    expect(transformOf(mountSlider({ orientation: 'vertical', inverted: true }).container)).toContain('translateY(-50%)')
  })
})

describe('commitFromMT — the one BG round-trip per gesture', () => {
  it('writes the dragged values through and fires a single valueCommit', async () => {
    const { commit, updates, commits } = mountSlider({ modelValue: [25] })

    commit([75])
    await waitForUpdate()

    expect(updates[updates.length - 1]).toEqual([75])
    expect(commits).toEqual([[75]])
  })

  it('stays silent when the gesture did not actually change anything', async () => {
    const { commit, updates, commits } = mountSlider({ modelValue: [40] })

    commit([40])
    await waitForUpdate()

    expect(updates).toEqual([])
    expect(commits).toEqual([])
  })

  // The live updates have already written the value by the time touchend
  // lands, so `valueCommit` has to compare against the start of the GESTURE.
  // Comparing frame-to-frame would find nothing changed and never fire.
  it('still emits valueCommit after live updates have written the value', async () => {
    const { live, commit, updates, commits } = mountSlider({ modelValue: [40] })

    live([55])
    live([70])
    await waitForUpdate()
    expect(updates).toEqual([[55], [70]])
    expect(commits).toEqual([])

    commit([70])
    await waitForUpdate()
    expect(commits).toEqual([[70]])
  })

  // Regression: a stale MT mirror used to arrive here as a short array, and
  // `writeModelValue`'s `next[0] ?? 0` turned that into a hard 0 — the slider
  // snapped to the minimum on first touch and never recovered.
  it('rejects a payload that does not line up with the live thumbs', async () => {
    const { commit, updates, commits } = mountSlider({ modelValue: [40] })

    commit([])
    commit([10, 90])
    commit([Number.NaN])
    await waitForUpdate()

    expect(updates).toEqual([])
    expect(commits).toEqual([])
  })

  // Backstop only — the worklets drop violating frames so the thumb stops at
  // the gap. If this ever fires in a real gesture the fill is already painted
  // past the limit with no way to learn the commit was refused.
  it('refuses a payload that violates minStepsBetweenThumbs', async () => {
    const { commit, updates, commits } = mountSlider({ modelValue: [10, 90], minStepsBetweenThumbs: 20 })

    commit([10, 20])
    await waitForUpdate()
    expect(updates).toEqual([])

    commit([10, 40])
    await waitForUpdate()
    expect(updates[updates.length - 1]).toEqual([10, 40])
    expect(commits).toEqual([[10, 40]])
  })

  it('does not commit while disabled', async () => {
    const { commit, updates, commits } = mountSlider({ modelValue: [40], disabled: true })

    commit([70])
    await waitForUpdate()

    expect(updates).toEqual([])
    expect(commits).toEqual([])
  })
})

// Regression — "thumb starts at the right place, jumps to 0 on first touch and
// never moves again". The MT drag path filled its thumb registry and every
// `*MT` mirror with BACKGROUND-thread writes to `MainThreadRef.current`, which
// vue-lynx silently no-ops. The main thread saw an empty handle list
// (`_paintActiveThumb` bailed on every frame) and a stale value array, whose
// commit landed as `next[0] ?? 0`.
//
// SliderImplMTS can't render under vitest — the SWC worklet transform doesn't
// run, so `:main-thread-bindtouch*` crashes `applySetWorkletEvent` — so the
// thread-boundary rules are asserted against the SFC source, same shape as
// FeedList's PTR tests.
describe('Slider — nothing crosses BG -> MT by assignment', () => {
  async function readSfc(name: string): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    return fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), name), 'utf8')
  }

  function body(sfc: string, fn: string): string {
    return sfc.match(new RegExp(`function ${fn}[\\s\\S]*?\\n}`))?.[0] ?? ''
  }

  it('routes every SliderRoot mirror through a runOnMainThread setter', async () => {
    const sfc = await readSfc('SliderRoot.vue')
    // A watch that assigns `.current` straight from BG is the dead pattern.
    expect(sfc).not.toMatch(/watch\([\s\S]{0,80}?\{\s*\w+MT\.current\s*=/)
    for (const setter of ['_setMin', '_setMax', '_setStep', '_setDisabled', '_setValues'])
      expect(sfc).toMatch(new RegExp(`runOnMainThread\\(${setter} as any\\)`))
  })

  it('keeps SliderThumbImpl off the main-thread boundary entirely', async () => {
    // The thumb used to push its element handle into `thumbHandlesMT` on mount.
    const sfc = await readSfc('SliderThumbImpl.vue')
    expect(sfc).not.toMatch(/MainThreadRef|thumbHandlesMT|main-thread-ref/)
  })

  it('resolves thumb and range elements on the main thread from the track subtree', async () => {
    const sfc = await readSfc('SliderImplMTS.vue')
    const fn = sfc.match(/function _resolveEls[\s\S]*?\n}/)?.[0] ?? ''
    expect(fn).toMatch(/'main thread'/)
    expect(fn).toMatch(/querySelectorAll\('\.vyui-slider-thumb'\)/)
    expect(fn).toMatch(/querySelector\('\.vyui-slider-range'\)/)
    // The query must be guarded: Lynx web exposes `invoke` to the main-thread
    // realm but NOT `__QuerySelectorAll`, so the wrapper method passes a
    // `typeof` check and then throws `ReferenceError` when called.
    expect(fn).toMatch(/try \{/)
    expect(fn).toMatch(/catch/)
    // And it must never gate the gesture. Bailing on an empty registry stranded
    // the whole control on web: every press aborted before emitting a value.
    expect(body(sfc, '_dragStart')).not.toMatch(/thumbElsRef\.current\.length === 0\) return/)
    expect(body(sfc, '_dragStart')).toMatch(/runOnBackground\(_emitLive as any\)\(next\)/)
  })

  it('stamps the marker classes MT resolution selects on, alongside user classes', async () => {
    const { container } = mountSlider()
    // Both carry a consumer class from mountSlider's template too — the static
    // marker has to survive the `v-bind` / $attrs merge, not replace it.
    expect(container.querySelector('.vyui-slider-thumb')).not.toBeNull()
    expect(container.querySelector('.vyui-slider-range')).not.toBeNull()
  })

  // The BG only hears about the value on touchend, so the fill has to be
  // painted from the worklets too — otherwise it sits frozen for the whole
  // gesture and snaps on release while the thumb glides.
  // `layoutchange` reports top/left relative to the PAGE while a pointer
  // reports its position relative to the VIEWPORT, so an offset rebuilt as
  // `pageY - rect.top` is only correct until something scrolls — measured on
  // device at top 2805 against pageY 448. The origin has to come from
  // `boundingClientRect`, which is in the pointer's own frame.
  //
  // Both input types map the same way, off `clientX`/`clientY`: it is the only
  // pointer field Lynx reports on native AND web. `touches[0].x`/`.y` is
  // native-only — web touches are built from raw DOM `Touch`, which has no
  // `x`/`y`, so reading them stranded every touchscreen browser on `NaN`.
  it('maps every pointer through one viewport frame and a per-gesture origin', async () => {
    const sfc = await readSfc('SliderImplMTS.vue')
    // Element-local offsets are always `client* - rect origin`, never a raw
    // native-only field.
    expect(body(sfc, '_beginAt')).toMatch(/invoke\('boundingClientRect'\)/)
    expect(body(sfc, '_beginAt')).toMatch(/_dragStart\(clientX - r\.left, clientY - r\.top\)/)
    for (const fn of ['_onTouchStart', '_onTouchMove', '_onMouseDown', '_onMouseMove'])
      expect(body(sfc, fn)).not.toMatch(/\bt\.x\b|\bt\.y\b|pageX|pageY/)
    expect(body(sfc, '_onTouchStart')).toMatch(/_beginAt\(t\.clientX, t\.clientY\)/)
    expect(body(sfc, '_onTouchMove')).toMatch(/_dragMove\(t\.clientX - rectLeftRef\.current, t\.clientY - rectTopRef\.current\)/)
    expect(body(sfc, '_onMouseDown')).toMatch(/_beginAt\(e\.clientX, e\.clientY\)/)
    for (const core of ['_dragStart', '_dragMove'])
      expect(body(sfc, core)).toMatch(/_valueFromTouch\(localX, localY\)/)
    expect(body(sfc, '_valueFromTouch')).not.toMatch(/rectLeftRef|rectTopRef/)
    // Origin AND extent come from that one response. Sourcing the extent from
    // a BG `layoutchange` -> `runOnMainThread` hop instead stranded the whole
    // drag on Lynx web: the hop never delivered, so the zero-extent guard in
    // `_dragStart` swallowed every press and the value never moved.
    expect(body(sfc, '_beginAt')).toMatch(/rectWRef\.current = r\.width/)
    expect(body(sfc, '_beginAt')).toMatch(/rectHRef\.current = r\.height/)
    expect(sfc).not.toMatch(/@layoutchange=|useResizeObserver\(/)
  })

  // Forgiveness, per platform. Native loses the gesture to an ancestor
  // `<scroll-view>` on off-axis drift and hit-tests only the track's own
  // thickness; web re-targets pointer events by position, so a mouse drag that
  // leaves the element strands. The shield answers the web half and must exist
  // only there — a stuck full-screen view on native would eat every touch.
  it('is forgiving off-axis: native slop and slide claim, a web-only shield', async () => {
    const sfc = await readSfc('SliderImplMTS.vue')
    expect(sfc).toMatch(/hit-slop="\d+px"/)
    expect(sfc).toMatch(/:consume-slide-event="\[\[0, 360\]\]"/)
    expect(sfc).toMatch(/v-if="mtBound && isWeb\(\)"/)
    expect(body(sfc, 'isWeb')).toMatch(/SystemInfo\?\.platform\b[^\n]*=== 'web'/)
    expect(body(sfc, '_onMouseDown')).toMatch(/_setShield\(true\)/)
    // Lowered AHEAD of the early return: a press that never became a drag
    // (disabled, zero extent) would otherwise leave the shield over the page.
    expect(body(sfc, '_dragEnd')).toMatch(/_setShield\(false\)[\s\S]*?activeIndexRef\.current === -1\) return/)
  })

  it('keeps values sorted and re-tracks the active thumb every frame', async () => {
    const sfc = await readSfc('SliderImplMTS.vue')
    // Thumbs may cross mid-drag; the old BG path re-derived the active index
    // from the re-sorted array on every frame and this has to match, or the
    // commit lands on the wrong thumb.
    expect(body(sfc, '_applyValue')).toMatch(/next\.sort\(\(a, b\) => a - b\)/)
    for (const handler of ['_dragStart', '_dragMove']) {
      const fn = body(sfc, handler)
      expect(fn).toMatch(/_applyValue\(src, idx, value\)/)
      expect(fn).toMatch(/activeIndexRef\.current = next\.indexOf\(value\)/)
      // Gap violations drop the frame, so the thumb parks at the limit rather
      // than painting past it and snapping back at commit time.
      expect(fn).toMatch(/if \(!_hasMinGap\(next, root\.minGapMT\.current\)\) return/)
    }
  })

  it('leaves the range painted at the values it is about to commit', async () => {
    // `_resetActiveThumbTransform` hands the thumb back to its BG anchor, but
    // the range has no anchor to fall back to — its inline offsets persist, so
    // touchend has to leave them on the committed values.
    const fn = body(await readSfc('SliderImplMTS.vue'), '_dragEnd')
    expect(fn).toMatch(/_paintRange\(finalVals\)/)
  })

  it('repaints the range from the drag worklets, not just on commit', async () => {
    const sfc = await readSfc('SliderImplMTS.vue')
    for (const handler of ['_dragStart', '_dragMove']) {
      const fn = sfc.match(new RegExp(`function ${handler}[\\s\\S]*?\\n}`))?.[0] ?? ''
      expect(fn).toMatch(/_paintRange\(next\)/)
    }
    const paint = sfc.match(/function _paintRange[\s\S]*?\n}/)?.[0] ?? ''
    expect(paint).toMatch(/'main thread'/)
    // Same two edge offsets SliderRange's BG style writes, so the commit's
    // re-render lands on identical values and needs no reset.
    expect(paint).toMatch(/setStyleProperty\(startName, `\$\{lo\}%`\)/)
    expect(paint).toMatch(/setStyleProperty\(endName, `\$\{100 - hi\}%`\)/)
  })

  it('ignores an MT payload that does not match the live thumbs', async () => {
    // Shared by the live per-frame updates and the final commit, so a stale MT
    // mirror can't reach `writeModelValue` down either route.
    const fn = body(await readSfc('SliderRoot.vue'), 'isValidFromMT')
    expect(fn).toMatch(/nextValues\.length !== prev\.length[\s\S]*?return false/)
  })
})

// Regression — "the slider is permanently stuck on its initial value in the
// browser, but drags fine on device".
//
// The gesture reached `_dragStart` with everything it needed (mousedown fired,
// `invoke('boundingClientRect')` resolved a correct 1234x9 rect) and then
// aborted, because resolving the thumb elements to paint had thrown:
//
//   _dragStart 493.5 6.5  disabled false  w/h 1234 9  thumbs 0
//   ReferenceError: __QuerySelectorAll is not defined
//
// Two separate mistakes stacked, and each is worth pinning on its own:
//
//   1. A capability check that checks the wrong layer. `typeof
//      track.querySelectorAll === 'function'` is true on every platform — the
//      wrapper method always exists. What varies is whether the realm exposes
//      the `__QuerySelectorAll` PAPI it calls into, and Lynx web does not
//      (while still exposing `__InvokeUIMethod`, which is why the rect worked).
//      Only a try/catch can see that.
//   2. An optimisation allowed to gate correctness. Those elements exist only
//      to paint from the main thread, ahead of the background's own render.
//      Bailing when they're missing traded a smoothness win for the entire
//      control.
//
// The worklets can't execute under vitest, so these are asserted against the
// SFC source, same shape as the block above.
describe('Slider — a missing MT paint target must not strand the drag', () => {
  async function readSfc(name: string): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    return fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), name), 'utf8')
  }
  function body(sfc: string, fn: string): string {
    return sfc.match(new RegExp(`function ${fn}[\\s\\S]*?\\n}`))?.[0] ?? ''
  }

  it('emits the value even when no thumb element could be resolved', async () => {
    const fn = body(await readSfc('SliderImplMTS.vue'), '_dragStart')
    // The lookup may still be attempted...
    expect(fn).toMatch(/if \(thumbElsRef\.current\.length === 0\) _resolveEls\(\)/)
    // ...but an empty result must not short-circuit the gesture.
    expect(fn).not.toMatch(/thumbElsRef\.current\.length === 0\) return/)
    // The background round-trip is what makes the control work at all.
    expect(fn).toMatch(/runOnBackground\(_emitLive as any\)\(next\)/)
  })

  it('keeps both paints safe on an empty registry', async () => {
    // With the gate gone these run every frame on web, so they carry the
    // burden of bailing instead.
    const sfc = await readSfc('SliderImplMTS.vue')
    expect(body(sfc, '_paintActiveThumb')).toMatch(/idx >= els\.length\) return/)
    expect(body(sfc, '_paintRange')).toMatch(/!el\?\.setStyleProperty\) return/)
  })

  it('measures the track from the gesture rect, never a layoutchange hop', async () => {
    // The extent used to arrive via `@layoutchange` -> `runOnMainThread`, a
    // second web-fragile dependency in the same bail chain.
    const sfc = await readSfc('SliderImplMTS.vue')
    expect(body(sfc, '_beginAt')).toMatch(/rectWRef\.current = r\.width/)
    expect(body(sfc, '_beginAt')).toMatch(/rectHRef\.current = r\.height/)
    expect(sfc).not.toMatch(/@layoutchange=|useResizeObserver\(/)
  })

  it('arms the root gate against echoing a live update back into MT values', async () => {
    // `SliderImplMTS` set a private `draggingRef` of its own, so `_setValues`
    // in the root — which reads `draggingMT` — was never actually gated.
    const sfc = await readSfc('SliderImplMTS.vue')
    expect(body(sfc, '_dragStart')).toMatch(/root\.draggingMT\.current = true/)
    expect(body(sfc, '_dragEnd')).toMatch(/root\.draggingMT\.current = false/)
    expect(sfc).not.toMatch(/draggingRef/)
    expect(body(await readSfc('SliderRoot.vue'), '_setValues')).toMatch(/draggingMT\.current\) return/)
  })
})

// Canary for the class of bug above, not just the one instance of it.
//
// Lynx web hands the main-thread realm a PARTIAL element PAPI surface:
// `__InvokeUIMethod` resolves, `__QuerySelectorAll` does not. The wrapper
// methods exist regardless, so nothing about the call site looks unsafe and
// nothing fails until a real gesture runs in a real browser. Any worklet that
// reaches for the DOM-shaped element API has to assume the call can throw.
//
// Ceiling: this only covers the ELEMENT wrapper (`someEl.querySelector*`).
// The global `lynx.querySelector` used by List is the same hazard through a
// different API and is not checked here.
describe('core — MT worklets must guard element querySelector', () => {
  it('wraps every worklet-side element query in a try/catch', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

    const files: string[] = []
    for (const entry of fs.readdirSync(root, { recursive: true, encoding: 'utf8' })) {
      if (entry.endsWith('.vue')) files.push(path.join(root, entry))
    }
    expect(files.length).toBeGreaterThan(0)

    const offenders: string[] = []
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8')
      if (!src.includes('\'main thread\'')) continue
      for (const fn of src.match(/function \w+[\s\S]*?\n}/g) ?? []) {
        if (!fn.includes('\'main thread\'')) continue
        // Element-wrapper queries only — skip the `lynx.` global (see ceiling).
        if (!/(?<!lynx)\.querySelector(All)?\(/.test(fn)) continue
        if (!fn.includes('try {')) {
          offenders.push(`${path.relative(root, file)} :: ${fn.match(/function (\w+)/)?.[1]}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
