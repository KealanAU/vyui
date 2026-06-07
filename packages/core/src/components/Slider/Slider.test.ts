// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
//
// Clean-room rewrite against the Lynx Slider rebuild. The implementation now
// drives drag via `touchstart` / `touchmove` / `touchend` plus a one-shot
// `useElementRect` measurement at slide-start (see SliderHorizontal.vue). The
// rect is mocked to a fixed 0,0,200,20 so touch clientX maps linearly to a
// model value: linearScale([0,200], [0,100])(clientX) === clientX/2.
//
// Assertions are on the emitted `update:modelValue` / `valueCommit` contract
// (and a couple of static a11y traits), not on rendered thumb geometry — the
// component renders absolute-positioned thumbs but jsdom does not paint, and
// the contract is the value emitted to consumers.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { ref } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '.'

vi.mock('@/shared/composables', async () => {
  const actual = await vi.importActual<typeof import('@/shared/composables')>('@/shared/composables')
  return {
    ...actual,
    // 200px horizontal track at origin — touch clientX directly maps to a
    // 0..100 model value (default min/max) for `step:1` math.
    useElementRect: () => Promise.resolve({ width: 200, height: 20, top: 0, left: 0, right: 200, bottom: 20 }),
  }
})

function mountSlider(props: Record<string, unknown> = {}) {
  const updates: number[][] = []
  const commits: number[][] = []
  const result = render({
    components: { SliderRoot, SliderTrack, SliderRange, SliderThumb },
    setup() {
      const model = ref<number[]>((props.defaultValue as number[]) ?? [0])
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
        @update:model-value="onUpdate"
        @value-commit="onCommit"
      >
        <SliderTrack><SliderRange /></SliderTrack>
        <SliderThumb />
      </SliderRoot>
    `,
  })
  return { ...result, updates, commits }
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

describe('SliderRoot touch drag → value', () => {
  it('emits update:modelValue on touchstart at the touched position', async () => {
    const { container, updates } = mountSlider()
    const slider = container.querySelector('[data-vyui-slider-impl]')!

    fireEvent.touchstart(slider, { touches: [{ clientX: 50, clientY: 10 }] })
    await waitForUpdate()
    // 50/200 of [0,100] = 25
    expect(updates[updates.length - 1]).toEqual([25])
  })

  it('emits another update on touchmove', async () => {
    const { container, updates } = mountSlider()
    const slider = container.querySelector('[data-vyui-slider-impl]')!

    fireEvent.touchstart(slider, { touches: [{ clientX: 0, clientY: 10 }] })
    await waitForUpdate()
    fireEvent.touchmove(slider, { touches: [{ clientX: 150, clientY: 10 }] })
    await waitForUpdate()

    // last emitted value reflects the move position (150/200 → 75)
    expect(updates[updates.length - 1]).toEqual([75])
  })

  it('emits valueCommit on touchend when the value changed', async () => {
    const { container, commits } = mountSlider()
    const slider = container.querySelector('[data-vyui-slider-impl]')!

    fireEvent.touchstart(slider, { touches: [{ clientX: 100, clientY: 10 }] })
    await waitForUpdate()
    fireEvent.touchend(slider)
    await waitForUpdate()
    expect(commits.length).toBe(1)
    expect(commits[0]).toEqual([50])
  })

  it('does not emit updates while disabled', async () => {
    const { container, updates, commits } = mountSlider({ disabled: true })
    const slider = container.querySelector('[data-vyui-slider-impl]')!

    fireEvent.touchstart(slider, { touches: [{ clientX: 100, clientY: 10 }] })
    await waitForUpdate()
    fireEvent.touchend(slider)
    await waitForUpdate()

    expect(updates).toEqual([])
    expect(commits).toEqual([])
  })
})
