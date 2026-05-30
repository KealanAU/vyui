import { describe, expect, it } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'
import Toast from './story/_Toast.vue'
import { ToastProvider, ToastRoot, ToastTitle } from '.'

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
    // role 'alert' → trait 'none' + role-description 'alert'. (Live announcing
    // a foreground toast needs the runtime accessibilityAnnounce API, tracked
    // separately — the 'updating' trait suppresses re-announcement, so it's wrong.)
    expect(toast.getAttribute('accessibility-traits')).toBe('none')
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

  it('exposes the title as a heading', async () => {
    const { container } = render({
      components: { ToastProvider, ToastRoot, ToastTitle },
      template: `
        <ToastProvider>
          <ToastRoot>
            <ToastTitle data-testid="title">Saved</ToastTitle>
          </ToastRoot>
        </ToastProvider>
      `,
    })
    await waitForUpdate()
    const title = container.querySelector('[data-testid="title"]')!
    expect(title).not.toBeNull()
    expect(title.getAttribute('accessibility-traits')).toBe('header')
    expect(title.getAttribute('accessibility-heading')).toBe('true')
  })

  it('labels the action from altText and exposes it as a button', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    const action = container.querySelector('[data-testid="action"]')!
    expect(action).not.toBeNull()
    expect(action.getAttribute('accessibility-label')).toBe('Undo')
    expect(action.getAttribute('accessibility-traits')).toBe('button')
  })
})
