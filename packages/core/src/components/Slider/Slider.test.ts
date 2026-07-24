// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
//
// Clean-room rewrite against the Lynx Slider rebuild. The drag lives entirely
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
  const seen: { commitFromMT?: (values: number[]) => void } = {}
  const Probe = defineComponent({
    name: 'ContextProbe',
    setup() {
      seen.commitFromMT = injectSliderRootContext().commitFromMT
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
  return { ...result, updates, commits, commit: (v: number[]) => seen.commitFromMT!(v) }
}

describe('SliderRoot rendering & a11y traits', () => {
  it('renders thumb with adjustable trait', () => {
    const { container } = mountSlider()
    const thumb = container.querySelector('[accessibility-traits="adjustable"]')
    expect(thumb).not.toBeNull()
  })

  it('marks root and thumb data-disabled when disabled', () => {
    const { container } = mountSlider({ disabled: true })
    // SliderRoot stamps data-disabled="" on the horizontal track wrapper
    // and the thumb (`SliderThumbImpl`).
    const disabledNodes = container.querySelectorAll('[data-disabled=""]')
    expect(disabledNodes.length).toBeGreaterThanOrEqual(1)
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

  it('stays silent when the values did not actually change', async () => {
    const { commit, updates, commits } = mountSlider({ modelValue: [40] })

    commit([40])
    await waitForUpdate()

    expect(updates).toEqual([])
    expect(commits).toEqual([])
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

  it('enforces minStepsBetweenThumbs, which the per-thumb MT math cannot', async () => {
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
    // Unresolvable thumbs must abort the gesture, not drag an empty registry.
    expect(sfc).toMatch(/if \(thumbElsRef\.current\.length === 0\) return/)
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
  it('repaints the range from the drag worklets, not just on commit', async () => {
    const sfc = await readSfc('SliderImplMTS.vue')
    for (const handler of ['_onTouchStart', '_onTouchMove']) {
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

  it('ignores an MT commit whose payload does not match the live thumbs', async () => {
    const fn = (await readSfc('SliderRoot.vue')).match(/function commitFromMT[\s\S]*?\n}/)?.[0] ?? ''
    expect(fn).toMatch(/nextValues\.length !== prev\.length[\s\S]*?return/)
  })
})
