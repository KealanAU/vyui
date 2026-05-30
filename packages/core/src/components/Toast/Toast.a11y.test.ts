import { describe, expect, it } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'
import { ToastProvider, ToastRoot } from '.'

// The story's _Toast.vue does not forward `type` to ToastRoot, so render the
// provider + root directly to exercise both importance levels.
function mountToast(type?: 'foreground' | 'background') {
  return render({
    components: { ToastProvider, ToastRoot },
    setup() {
      return { type }
    },
    template: `
      <ToastProvider>
        <ToastRoot :type="type" data-testid="toast" />
      </ToastProvider>
    `,
  })
}

// Native Lynx a11y output (via useA11y). Behaviour lives in Toast.test.ts.
describe('Toast a11y', () => {
  it('exposes a foreground toast with a valid trait (no invalid "alert")', async () => {
    const { container } = mountToast('foreground')
    await waitForUpdate()
    const toast = container.querySelector('[data-testid="toast"]')!
    expect(toast).not.toBeNull()
    // role 'alert' → valid trait 'updating' + role-description 'alert'.
    expect(toast.getAttribute('accessibility-traits')).toBe('updating')
    expect(toast.getAttribute('accessibility-role-description')).toBe('alert')
    expect(toast.getAttribute('accessibility-element')).toBe('true')
  })

  it('uses the "summary" trait for a background toast', async () => {
    const { container } = mountToast('background')
    await waitForUpdate()
    const toast = container.querySelector('[data-testid="toast"]')!
    expect(toast.getAttribute('accessibility-traits')).toBe('summary')
    expect(toast.getAttribute('accessibility-role-description')).toBeNull()
  })
})
