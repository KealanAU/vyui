// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { defineComponent, h, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

// MTS template attrs (`:main-thread-bindtouch*`) crash under vitest's renderer
// because the BG worklet-loader SWC transform isn't running. The full drag /
// snap / dismiss flow is verified manually in LynxExplorer. See
// plans/mobile-first-pivot.md §3D for the test-infra gap.
//
// We *can* still mount SheetRoot in isolation — it's a render-less wrapper
// that just provides context and slots. The MT crash only happens when
// SheetContent (with `:main-thread:bind*`) renders, so tests below stay at
// the root level + injected context.

vi.mock('vue-lynx', async () => {
  const actual = await vi.importActual<typeof import('vue-lynx')>('vue-lynx')
  return {
    ...actual,
    runOnMainThread: (fn: (...args: any[]) => any) =>
      (...args: any[]) => Promise.resolve(fn(...args)),
    runOnBackground: (fn: (...args: any[]) => any) =>
      (...args: any[]) => { fn(...args) },
    useMainThreadRef: <T>(init: T) => ({ current: init }),
  }
})

describe('Sheet — exports', () => {
  it('exports the full Sheet family', async () => {
    const mod = await import('.')
    expect(mod.SheetRoot).toBeDefined()
    expect(mod.SheetTrigger).toBeDefined()
    expect(mod.SheetContent).toBeDefined()
    expect(mod.SheetBackdrop).toBeDefined()
    expect(mod.SheetHandle).toBeDefined()
    expect(mod.SheetView).toBeDefined()
    expect(mod.injectSheetRootContext).toBeDefined()
  })
})

describe('SheetRoot — v-model:open / v-model:snapIndex', () => {
  async function mountRoot(props: Record<string, unknown> = {}) {
    const { render } = await import('@vyui/testing-utils')
    const { default: SheetRoot } = await import('./SheetRoot.vue')
    const { injectSheetRootContext } = await import('./sheetContext')

    let captured: any = null
    const Probe = defineComponent({
      setup() {
        captured = injectSheetRootContext()
        return () => null
      },
    })

    const Wrapper = defineComponent({
      setup() {
        return () => h(SheetRoot, props as any, {
          default: () => h(Probe),
        })
      },
    })

    render(Wrapper)
    if (!captured) throw new Error('sheet context not provided')
    return { ctx: captured }
  }

  it('starts closed by default at snapIndex 0', async () => {
    const { ctx } = await mountRoot()
    expect(ctx.open.value).toBe(false)
    expect(ctx.snapIndex.value).toBe(0)
  })

  // `setOpen` runs through vueuse `useVModel`, which under vue-lynx's
  // dual-thread `render()` doesn't sync `open.value = next` back to the
  // captured probe within a single microtask. The flow is exercised at
  // runtime by SheetTrigger; the snapIndex direct-write path below covers
  // the equivalent ref-mutation surface synchronously.

  it('setSnap clamps into the snapPoints range', async () => {
    const { ctx } = await mountRoot({ snapPoints: [0.25, 0.5, 0.9] })
    ctx.setSnap(99)
    expect(ctx.snapIndex.value).toBe(2)
    ctx.setSnap(-5)
    expect(ctx.snapIndex.value).toBe(0)
  })

  it('sorts and clamps snapPoints into 0.01..1', async () => {
    const { ctx } = await mountRoot({ snapPoints: [0.8, 2, -1, 0.4] })
    // -1 and 2 clamp to 0.01 and 1; result is sorted ascending.
    expect(ctx.snapPoints.value).toEqual([0.01, 0.4, 0.8, 1])
  })

  it('falls back to [1] when snapPoints prop is empty', async () => {
    const { ctx } = await mountRoot({ snapPoints: [] })
    expect(ctx.snapPoints.value).toEqual([1])
  })

  it('viewportHeight prop wins over runtime SystemInfo', async () => {
    const { ctx } = await mountRoot({ viewportHeight: 999 })
    expect(ctx.viewportHeight.value).toBe(999)
  })

  it('viewportWidth prop wins over runtime SystemInfo', async () => {
    const { ctx } = await mountRoot({ viewportWidth: 444 })
    expect(ctx.viewportWidth.value).toBe(444)
  })

  it('defaults side to bottom and exposes side from props', async () => {
    const bottom = await mountRoot()
    expect(bottom.ctx.side.value).toBe('bottom')

    const left = await mountRoot({ side: 'left' })
    expect(left.ctx.side.value).toBe('left')
  })

  // SheetContent's release worklets read these via MT refs synced from the
  // context — assert the context carries the prop values (and defaults)
  // rather than hardcoded physics.
  it('exposes drag physics config (dismissVelocity, duration) from props', async () => {
    const { ctx } = await mountRoot({ dismissVelocity: 900, duration: 400 })
    expect(ctx.dismissVelocity.value).toBe(900)
    expect(ctx.duration.value).toBe(400)
  })

  it('defaults dismissVelocity to 600 and duration to 280', async () => {
    const { ctx } = await mountRoot()
    expect(ctx.dismissVelocity.value).toBe(600)
    expect(ctx.duration.value).toBe(280)
  })

  it('provides MT refs for drag progress and the backdrop element', async () => {
    const { ctx } = await mountRoot()
    // Drag worklets write progress on touchmove and paint opacity through
    // the backdrop handle; both must exist on context even with no drag yet.
    expect(ctx.progressMTRef).toBeDefined()
    expect(ctx.backdropElRef).toBeDefined()
    expect(ctx.backdropElRef.current).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// Presence wiring on SheetBackdrop. SheetContent still can't be mounted
// here (its `:main-thread-bindtouch*` attrs crash vitest's renderer — see
// the file-level comment up top), but the backdrop only carries `@tap` plus
// the new `@animationstart` / `@animationend` bindings, so we can mount it
// end-to-end and exercise the Presence state machine through DOM events.

// `usePresence` chains rAF through `delayFrames`; jsdom rAF is a 16ms
// setTimeout. Wait `n` frames + a margin so all scheduled callbacks settle.
function wait(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}
function frames(n: number) {
  return wait(n * 16 + 32)
}

async function mountBackdrop(initialOpen: boolean) {
  const { render } = await import('@vyui/testing-utils')
  const { default: SheetRoot } = await import('./SheetRoot.vue')
  const { default: SheetBackdrop } = await import('./SheetBackdrop.vue')
  const { OverlayRoot, overlayEntries } = await import('@/components/OverlayRoot')
  const { injectSheetRootContext } = await import('./sheetContext')
  overlayEntries.value = []

  let ctx: any = null
  const Probe = defineComponent({
    setup() {
      ctx = injectSheetRootContext()
      return () => null
    },
  })

  const open = ref(initialOpen)
  // `OverlayRoot` is where the backdrop actually paints — SheetBackdrop only
  // registers a portal entry (#12). Mirrors the app-root shell every consumer
  // mounts (`<VyApp>` / the demo `App.vue`s).
  const Wrapper = defineComponent({
    setup() {
      return { open }
    },
    template: `
      <SheetRoot v-model:open="open" :viewport-height="800">
        <Probe />
        <SheetBackdrop data-testid="backdrop" />
      </SheetRoot>
      <OverlayRoot />
    `,
    components: { SheetRoot, SheetBackdrop, OverlayRoot, Probe },
  })

  const { container } = render(Wrapper)
  return {
    container,
    open,
    get ctx() {
      return ctx
    },
    findBackdrop: () =>
      container.querySelector('[data-vyui-sheet-backdrop]') as HTMLElement | null,
  }
}

describe('SheetBackdrop — Presence wiring', () => {
  it('does not render the backdrop while closed', async () => {
    const { findBackdrop } = await mountBackdrop(false)
    const { waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    expect(findBackdrop()).toBeNull()
  })

  it('renders the backdrop with ui-entering on open and exposes the animation bindings', async () => {
    const { findBackdrop } = await mountBackdrop(true)
    const { waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    const backdrop = findBackdrop()!
    expect(backdrop).not.toBeNull()
    // CSS-driven enter: state has flipped to Entering ≈ 8 frames after mount,
    // so the painted backdrop should carry `ui-entering`.
    await frames(10)
    await waitForUpdate()
    const cls = backdrop.getAttribute('class') ?? ''
    expect(cls).toContain('vyui-sheet__backdrop')
    expect(cls.includes('ui-entering') || cls.includes('ui-open')).toBe(true)
    expect(backdrop.getAttribute('data-state')).toBe('open')
  })

  it('firing animationend on the backdrop advances Presence to Entered (ui-open, no ui-entering)', async () => {
    const { findBackdrop } = await mountBackdrop(true)
    const { fireEvent, waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    await frames(10)
    await waitForUpdate()
    const backdrop = findBackdrop()!
    // Drive the entering animation to End — Presence should advance Entering
    // → Entered, dropping `ui-entering` and keeping only `ui-open`.
    fireEvent.animationend(backdrop)
    await waitForUpdate()
    const cls = backdrop.getAttribute('class') ?? ''
    expect(cls).toContain('ui-open')
    expect(cls).not.toContain('ui-entering')
  })

  it('flipping open=false triggers ui-leaving and unmounts after animationend', async () => {
    const { findBackdrop, open } = await mountBackdrop(true)
    const { fireEvent, waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    // Settle into Entered so the close path exercises the Leaving phase
    // (not the Initial → Left short-circuit inside `usePresence#handleDismiss`).
    await frames(40)
    await waitForUpdate()
    const backdrop = findBackdrop()!
    expect(backdrop).not.toBeNull()
    open.value = false
    await waitForUpdate()
    // Still painted, but the state machine has moved to Leaving.
    expect(findBackdrop()).not.toBeNull()
    const leavingCls = backdrop.getAttribute('class') ?? ''
    expect(leavingCls).toContain('ui-leaving')
    expect(backdrop.getAttribute('data-state')).toBe('closed')
    // Drive the leaving animation to End → state goes Left → mount=false.
    fireEvent.animationend(backdrop)
    await waitForUpdate()
    expect(findBackdrop()).toBeNull()
  })

  it('falls back to unmount after MAX_WAIT_FRAMES if no animationend fires', async () => {
    const { findBackdrop, open } = await mountBackdrop(true)
    const { waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    await frames(40)
    await waitForUpdate()
    expect(findBackdrop()).not.toBeNull()
    open.value = false
    await waitForUpdate()
    // No animation events at all — the 24-frame fallback in `usePresence`
    // force-progresses Leaving → Left.
    await frames(40)
    await waitForUpdate()
    expect(findBackdrop()).toBeNull()
  })

  it('tapping the backdrop sets open=false (still gated by Presence for unmount)', async () => {
    const { findBackdrop, open } = await mountBackdrop(true)
    const { fireEvent, waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    await frames(40)
    await waitForUpdate()
    const backdrop = findBackdrop()!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(open.value).toBe(false)
  })
})

// Regression: the panel's inline `height` (and any viewport-sized CSS) MUST use
// `vh`, never `dvh`. Lynx native silently drops the dynamic-viewport unit, which
// collapses the sheet to its content height — the drawer "won't open fully" bug
// (#79). SheetContentImpl can't mount under vitest (MTS touch bindings crash the
// renderer — see the file header), so guard the unit at the source level.
describe('SheetContentImpl — viewport height unit (no dvh)', () => {
  async function readImpl(): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const here = path.dirname(new URL(import.meta.url).pathname)
    return fs.readFileSync(path.join(here, 'SheetContentImpl.vue'), 'utf8')
  }

  it('sizes the panel with vh, never the unsupported dvh', async () => {
    const sfc = await readImpl()
    expect(sfc).toMatch(/\$\{maxSnap\.value \* 100\}\$\{axis\.value === 'x' \? 'vw' : 'vh'\}/)
    // Match `dvh` only where it's used as a unit (after a digit or `}`), so the
    // explanatory comment that names the forbidden unit doesn't trip this.
    expect(sfc).not.toMatch(/[\d}]dvh/)
  })

  it('includes side-specific slide keyframes', async () => {
    const sfc = await readImpl()
    expect(sfc).toContain('vyui-sheet-slide-in-from-top')
    expect(sfc).toContain('vyui-sheet-slide-out-to-top')
    expect(sfc).toContain('vyui-sheet-slide-in-from-right')
    expect(sfc).toContain('vyui-sheet-slide-out-to-right')
    expect(sfc).toContain('vyui-sheet-slide-in-from-left')
    expect(sfc).toContain('vyui-sheet-slide-out-to-left')
  })
})

// Portal (#12): SheetContent / SheetBackdrop paint through the app-root
// `<OverlayRoot>` so they escape an ancestor's `overflow: hidden` on Lynx
// native. Registration is mount-scoped, so with no OverlayRoot rendered the
// impls never mount — which is also why this can assert without tripping the
// MTS-binding crash the rest of this file works around.
describe('Sheet — OverlayRoot portal', () => {
  async function mountSheet(open: boolean) {
    const { render } = await import('@vyui/testing-utils')
    const { default: SheetRoot } = await import('./SheetRoot.vue')
    const { default: SheetContent } = await import('./SheetContent.vue')
    const { default: SheetBackdrop } = await import('./SheetBackdrop.vue')

    return render(defineComponent({
      setup() {
        return () => h(SheetRoot, { open }, {
          default: () => [h(SheetBackdrop), h(SheetContent)],
        })
      },
    }))
  }

  it('registers backdrop + content while open and clears on unmount', async () => {
    const { overlayEntries } = await import('@/components/OverlayRoot')
    const { waitForUpdate } = await import('@vyui/testing-utils')
    overlayEntries.value = []

    const { unmount } = await mountSheet(true)
    await waitForUpdate()
    expect(overlayEntries.value.length).toBe(2)

    unmount()
    await waitForUpdate()
    expect(overlayEntries.value.length).toBe(0)
  })

  it('registers nothing while closed', async () => {
    const { overlayEntries } = await import('@/components/OverlayRoot')
    const { waitForUpdate } = await import('@vyui/testing-utils')
    overlayEntries.value = []

    await mountSheet(false)
    await waitForUpdate()
    expect(overlayEntries.value.length).toBe(0)
  })
})

// A drag that dismisses the sheet is painted entirely by the release worklet's
// inline transition. If Presence ALSO puts `ui-leaving` on the panel/backdrop,
// the keyframe drives the same close a second time — and because it starts
// from the fully-open underlying value, the sheet snaps back up and replays
// its exit. Inline `animation: 'none'` does not suppress a class-driven
// keyframe on the Lynx style path, so the class itself has to go.
describe('Sheet — drag-dismiss does not double-drive the close', () => {
  it('drops ui-leaving from the backdrop while a drag release owns the close', async () => {
    const { findBackdrop, open, ctx } = await mountBackdrop(true)
    const { waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    await frames(40)
    await waitForUpdate()
    const backdrop = findBackdrop()!

    // What `_emitClose` does on the background side, in order.
    ctx.dragClosing.value = true
    open.value = false
    await waitForUpdate()

    const cls = backdrop.getAttribute('class') ?? ''
    expect(cls).not.toContain('ui-leaving')
    expect(cls).not.toContain('ui-animating')
    // Still leaving as far as the state machine is concerned — only the
    // keyframe class is suppressed, so the element stays mounted until the
    // inline transition ends.
    expect(cls).toContain('ui-closed')
    expect(backdrop.getAttribute('data-state')).toBe('closed')
    expect(findBackdrop()).not.toBeNull()
  })

  it('restores the keyframe classes on reopen', async () => {
    const { findBackdrop, open, ctx } = await mountBackdrop(true)
    const { waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    await frames(40)
    await waitForUpdate()

    ctx.dragClosing.value = true
    open.value = false
    await waitForUpdate()
    // Reopen while still leaving — the flag must clear or the next close
    // (a plain tap, with no worklet painting it) would never animate out.
    open.value = true
    await waitForUpdate()
    expect(ctx.dragClosing.value).toBe(false)

    await frames(40)
    await waitForUpdate()
    open.value = false
    await waitForUpdate()
    expect(findBackdrop()!.getAttribute('class') ?? '').toContain('ui-leaving')
  })

  it('leaves a non-drag close on the keyframe path', async () => {
    // Guards the inverse regression: suppressing the class unconditionally
    // would kill the exit animation for backdrop taps and programmatic closes.
    const { findBackdrop, open, ctx } = await mountBackdrop(true)
    const { waitForUpdate } = await import('@vyui/testing-utils')
    await waitForUpdate()
    await frames(40)
    await waitForUpdate()
    expect(ctx.dragClosing.value).toBe(false)
    open.value = false
    await waitForUpdate()
    expect(findBackdrop()!.getAttribute('class') ?? '').toContain('ui-leaving')
  })
})

// SheetContentImpl can't mount here — its `:main-thread-bind*` attrs crash the
// vitest renderer (see the header). Its half of the same contract is asserted
// against the source, the way Slider's worklet invariants are.
describe('Sheet — drag-close contract in the SFC sources', () => {
  async function readSfc(name: string): Promise<string> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    return fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), name), 'utf8')
  }

  it('sets dragClosing before setOpen so the class computed sees it in the same tick', async () => {
    const sfc = await readSfc('SheetContentImpl.vue')
    const fn = sfc.match(/function _emitClose[\s\S]*?\n}/)?.[0] ?? ''
    expect(fn).toMatch(/ctx\.dragClosing\.value = true[\s\S]*ctx\.setOpen\(false\)/)
  })

  it('gates the panel and backdrop keyframe classes on dragClosing', async () => {
    for (const file of ['SheetContentImpl.vue', 'SheetBackdropImpl.vue'])
      expect(await readSfc(file), file).toMatch(/transition: !ctx\.dragClosing\.value/)
  })

  it('clears dragClosing on reopen from the root', async () => {
    const sfc = await readSfc('SheetRoot.vue')
    expect(sfc).toMatch(/watch\(open, \(isOpen\) => \{[\s\S]*?dragClosing\.value = false/)
  })
})
