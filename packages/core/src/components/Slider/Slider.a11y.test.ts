import { describe, expect, it, vi } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'
import { ref } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '.'

vi.mock('@/shared/composables', async () => {
  const actual = await vi.importActual<typeof import('@/shared/composables')>('@/shared/composables')
  return {
    ...actual,
    useElementRect: () => Promise.resolve({ width: 200, height: 20, top: 0, left: 0, right: 200, bottom: 20 }),
  }
})

function mountSlider(value: number[] = [0]) {
  return render({
    components: { SliderRoot, SliderTrack, SliderRange, SliderThumb },
    setup() {
      return { model: ref<number[]>(value) }
    },
    template: `
      <SliderRoot :model-value="model">
        <SliderTrack><SliderRange /></SliderTrack>
        <SliderThumb />
      </SliderRoot>
    `,
  })
}

// Native Lynx a11y output (via useA11y). Behaviour lives in Slider.test.ts.
describe('Slider a11y', () => {
  it('exposes the thumb as an adjustable element', () => {
    const { container } = mountSlider()
    const thumb = container.querySelector('[accessibility-traits="adjustable"]')!
    expect(thumb).not.toBeNull()
    expect(thumb.getAttribute('accessibility-element')).toBe('true')
  })

  it('composes accessibility-value as "{now} of {max}"', async () => {
    // The thumb index resolves from the Collection ref after mount, so the
    // value only populates once Vue has flushed.
    const { container } = mountSlider([0])
    await waitForUpdate()
    const thumb = container.querySelector('[accessibility-traits="adjustable"]')!
    expect(thumb.getAttribute('accessibility-value')).toBe('0 of 100')
  })

  it('reflects the current value in accessibility-value', async () => {
    const { container } = mountSlider([50])
    await waitForUpdate()
    const thumb = container.querySelector('[accessibility-traits="adjustable"]')!
    expect(thumb.getAttribute('accessibility-value')).toBe('50 of 100')
  })
})
