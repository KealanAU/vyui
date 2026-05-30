import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import { ProgressIndicator, ProgressRoot } from '.'

function mountProgress(props: Record<string, unknown> = {}) {
  return render({
    components: { ProgressRoot, ProgressIndicator },
    setup() {
      return { props }
    },
    template: `
      <ProgressRoot v-bind="props">
        <ProgressIndicator />
      </ProgressRoot>
    `,
  })
}

// Native Lynx a11y output (via useA11y). Behaviour lives in Progress.test.ts.
describe('Progress a11y', () => {
  it('exposes a progressbar with the updating trait', () => {
    const { container } = mountProgress({ modelValue: 25 })
    const root = container.querySelector('[accessibility-role-description="progressbar"]')!
    expect(root).not.toBeNull()
    expect(root.getAttribute('accessibility-traits')).toBe('updating')
    expect(root.getAttribute('accessibility-element')).toBe('true')
  })

  it('announces value as a percentage of max via accessibility-value', () => {
    const { container } = mountProgress({ modelValue: 25, max: 50 })
    const root = container.querySelector('[accessibility-role-description="progressbar"]')!
    // getValueLabel default: round((25 / 50) * 100) = 50%
    expect(root.getAttribute('accessibility-value')).toBe('50%')
  })

  it('uses getValueText when provided', () => {
    const { container } = mountProgress({
      modelValue: 3,
      max: 10,
      getValueText: (v: number) => `${v} files`,
    })
    const root = container.querySelector('[accessibility-role-description="progressbar"]')!
    expect(root.getAttribute('accessibility-value')).toBe('3 files')
  })
})
