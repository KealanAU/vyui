import { defineComponent, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import SheetRoot from './SheetRoot.vue'
import SheetTrigger from './SheetTrigger.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Sheet.test.ts.
// SheetContent can't mount under vitest (its main-thread touch worklets crash —
// see issue #6), so its dialog/exclusive-focus mapping is covered by the
// "modal subtrees" case in useA11y.test.ts. Here we render the trigger only,
// without SheetContent, to exercise both open states.
function mountTrigger(open: boolean) {
  const openRef = ref(open)
  const Wrapper = defineComponent({
    setup: () => ({ openRef }),
    components: { SheetRoot, SheetTrigger },
    template: `
      <SheetRoot v-model:open="openRef" :viewport-height="800" :snap-points="[0.4, 0.9]">
        <SheetTrigger data-testid="trigger"><text>open</text></SheetTrigger>
      </SheetRoot>
    `,
  })
  return render(Wrapper).container
}

describe('Sheet a11y', () => {
  it('trigger is a focusable button', () => {
    const trigger = mountTrigger(false).querySelector('[data-testid="trigger"]')!
    expect(trigger.getAttribute('accessibility-traits')).toBe('button')
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
  })

  it('trigger announces collapsed/expanded via accessibility-value', () => {
    expect(mountTrigger(false).querySelector('[data-testid="trigger"]')!
      .getAttribute('accessibility-value')).toBe('collapsed')
    expect(mountTrigger(true).querySelector('[data-testid="trigger"]')!
      .getAttribute('accessibility-value')).toBe('expanded')
  })
})
