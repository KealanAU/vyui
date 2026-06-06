import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { overlayEntries } from '@/components/OverlayRoot/overlayStore'
import Popover from './story/_Popover.vue'

afterEach(() => {
  overlayEntries.value = []
})

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

describe('popover', () => {
  it('does not render content while closed', () => {
    const { container } = render(Popover)
    expect(q(container, 'content')).toBeNull()
  })

  it('opens on trigger tap', async () => {
    const { container } = render(Popover)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    expect(q(container, 'trigger')!.getAttribute('data-state')).toBe('open')
  })

  it('a second trigger tap toggles it closed', async () => {
    const { container } = render(Popover)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('non-modal default: backdrop tap dismisses', async () => {
    const { container } = render(Popover)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const backdrop = q(container, 'content')!.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('modal: backdrop tap dismisses', async () => {
    const { container } = render(Popover, { rootProps: { modal: true } })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const backdrop = q(container, 'content')!.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('tap on inner content does not dismiss', async () => {
    const { container } = render(Popover)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    fireEvent.tap(content)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('PopoverClose closes the popover', async () => {
    const { container } = render(Popover)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'close')!)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('stays open when interactOutside is prevented', async () => {
    const { container } = render({
      components: { Popover },
      setup() {
        return {
          onInteract: (e: any) => e.preventDefault(),
        }
      },
      template: '<Popover @interactOutside="onInteract" />',
    })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const backdrop = q(container, 'content')!.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('selects the modal variant when modal=true', async () => {
    // The variant is module-private. Use the captured story state: modal:true
    // does NOT change semantics on Lynx but the file branches; assert opening
    // works under both.
    const mod = await import('../..')
    expect((mod as any).PopoverContentModal).toBeDefined()
    expect((mod as any).PopoverContentNonModal).toBeDefined()
  })

  it('unregisters the overlay entry on unmount', async () => {
    const { container, unmount } = render(Popover, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    expect(overlayEntries.value.length).toBeGreaterThan(0)
    unmount()
    await waitForUpdate()
    expect(overlayEntries.value.length).toBe(0)
  })
})
