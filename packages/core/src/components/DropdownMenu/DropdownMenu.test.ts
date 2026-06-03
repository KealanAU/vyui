import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { overlayEntries } from '@/components/OverlayRoot/overlayStore'
import DropdownMenu from './story/_DropdownMenu.vue'

afterEach(() => {
  overlayEntries.value = []
})

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

describe('dropdownMenu', () => {
  it('renders the trigger', () => {
    const { container } = render(DropdownMenu)
    expect(q(container, 'trigger')).not.toBeNull()
  })

  it('does not render content while closed', () => {
    const { container } = render(DropdownMenu)
    expect(q(container, 'content')).toBeNull()
  })

  it('opens on trigger tap', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    expect(q(container, 'trigger')!.getAttribute('data-state')).toBe('open')
  })

  it('content carries the Presence animation hook + reaches open state', async () => {
    // Proves the Impl is animated: `DropdownMenuContent` bridges its
    // `PresenceContextKey` through the overlay portal, so the menu surface
    // gets the `vyui-dropdown-content` hook + presence-derived `data-state`
    // the enter/leave keyframes rely on. (A missing bridge would default the
    // injected state to `Entered`; instead the live Presence lifecycle drives
    // it Initial → Entering → Entered as the rAF frames advance.)
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')!.className).toContain('vyui-dropdown-content')
    await vi.waitFor(
      () => expect(q(container, 'content')!.getAttribute('data-state')).toBe('open'),
      { timeout: 1000, interval: 20 },
    )
  })

  it('toggles closed on a second trigger tap', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('disabled trigger does nothing', async () => {
    const { container } = render(DropdownMenu, { triggerDisabled: true })
    const trigger = q(container, 'trigger')!
    expect(trigger.getAttribute('data-disabled')).toBe('')
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('item tap closes the menu and emits select', async () => {
    const events: string[] = []
    const { container } = render({
      components: { DropdownMenu },
      setup() {
        return { onSelect: () => events.push('select') }
      },
      template: '<DropdownMenu @select="onSelect" />',
    })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'item-1')!)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
    expect(events).toEqual(['select'])
  })

  it('disabled item is inert', async () => {
    const { container } = render(DropdownMenu, { itemDisabled: true })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const item = q(container, 'item-disabled')!
    expect(item.getAttribute('data-disabled')).toBe('')
    fireEvent.tap(item)
    await waitForUpdate()
    // Menu stays open because the disabled item didn't close.
    expect(q(container, 'content')).not.toBeNull()
  })

  it('backdrop tap dismisses the menu', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const backdrop = q(container, 'content')!.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('tap on the menu surface does not dismiss', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    fireEvent.tap(content)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  // --- sub-menu (regression-critical) ----------------------------------------
  it('sub-menu trigger opens the sub-content through the portal', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'sub-content')).toBeNull()
    fireEvent.tap(q(container, 'sub-trigger')!)
    await waitForUpdate()
    expect(q(container, 'sub-content')).not.toBeNull()
    expect(q(container, 'sub-trigger')!.getAttribute('data-state')).toBe('open')
  })

  it('sub-content paints through the OverlayRoot portal (regression check)', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'sub-trigger')!)
    await waitForUpdate()
    // Two overlays registered: outer content + sub-content.
    expect(overlayEntries.value.length).toBeGreaterThanOrEqual(2)
  })

  it('sub-menu items inject DropdownMenuSubContext via the captured-provides bridge', async () => {
    // If the captured-provides bridge didn't work, the sub-item would fail to
    // render entirely (its parent SubContent injects sub-context). The sub-item
    // appearing in the DOM proves the inject chain works.
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'sub-trigger')!)
    await waitForUpdate()
    expect(q(container, 'sub-item')).not.toBeNull()
  })

  it('disabled sub-trigger does not open the sub-menu', async () => {
    const { container } = render(DropdownMenu, { subTriggerDisabled: true })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const subTrigger = q(container, 'sub-trigger')!
    expect(subTrigger.getAttribute('data-disabled')).toBe('')
    fireEvent.tap(subTrigger)
    await waitForUpdate()
    expect(q(container, 'sub-content')).toBeNull()
  })

  it('backdrop tap on the sub-menu dismisses it', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'sub-trigger')!)
    await waitForUpdate()
    const subBackdrop = q(container, 'sub-content')!.parentElement!
    fireEvent.tap(subBackdrop)
    await waitForUpdate()
    expect(q(container, 'sub-content')).toBeNull()
  })

  // --- checkbox / radio ------------------------------------------------------
  it('checkbox item toggles its checked state', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const cb = q(container, 'checkbox-item')!
    expect(cb.getAttribute('data-state')).toBe('unchecked')
    fireEvent.tap(cb)
    await waitForUpdate()
    // Re-open the menu to re-query the item from the new render.
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'checkbox-item')!.getAttribute('data-state')).toBe('checked')
  })

  it('radio group marks the default selection', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'radio-one')!.getAttribute('data-state')).toBe('checked')
    expect(q(container, 'radio-two')!.getAttribute('data-state')).toBe('unchecked')
  })

  it('tapping a radio item updates the selection', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'radio-two')!)
    await waitForUpdate()
    expect(q(container, 'radio-two')!.getAttribute('data-state')).toBe('checked')
    expect(q(container, 'radio-one')!.getAttribute('data-state')).toBe('unchecked')
  })

  // --- mount/unmount ---------------------------------------------------------
  it('forceMount keeps the content registered while closed', async () => {
    const { container } = render(DropdownMenu, { forceMount: true })
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('unregisters content overlay on unmount', async () => {
    const { container, unmount } = render(DropdownMenu, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    expect(overlayEntries.value.length).toBeGreaterThan(0)
    unmount()
    await waitForUpdate()
    expect(overlayEntries.value.length).toBe(0)
  })

  it('unregisters sub-content overlay when the sub-menu closes', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'sub-trigger')!)
    await waitForUpdate()
    const withSub = overlayEntries.value.length
    expect(withSub).toBeGreaterThanOrEqual(2)
    const subBackdrop = q(container, 'sub-content')!.parentElement!
    fireEvent.tap(subBackdrop)
    await waitForUpdate()
    expect(overlayEntries.value.length).toBe(withSub - 1)
  })

  it('emits update:open on toggling', async () => {
    const events: boolean[] = []
    const { container } = render({
      components: { DropdownMenu },
      setup() {
        return { rootProps: { open: false }, onUpdate: (v: boolean) => events.push(v) }
      },
      template: '<DropdownMenu :rootProps="rootProps" @update:open="onUpdate" />',
    })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(events).toEqual([true])
  })
})
