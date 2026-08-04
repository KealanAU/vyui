// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

// Mock vue-lynx the same way Swiper / Sheet / Draggable tests do — run
// worklets synchronously, stub MT refs. The BG worklet-loader SWC transform
// doesn't run under vitest, so `:main-thread-bind*` template attrs would
// otherwise crash via `applySetWorkletEvent` with a null ctx.
import { describe, expect, it, vi } from 'vitest'

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

describe('Sortable — exports', () => {
  it('exports SortableRoot, SortableItem, and inject helper', async () => {
    const mod = await import('.')
    expect(mod.SortableRoot).toBeDefined()
    expect(mod.SortableItem).toBeDefined()
    expect(mod.injectSortableRootContext).toBeDefined()
  })
})

async function readSfc(name: string): Promise<string> {
  const fs = await import('node:fs')
  const path = await import('node:path')
  return fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), name), 'utf8')
}

function body(sfc: string, fn: string): string {
  return sfc.match(new RegExp(`function ${fn}[\\s\\S]*?\\n}`))?.[0] ?? ''
}

// The drop target math (`sortableDropTarget`) is unit-tested against the real
// implementation in `shared/gesture/physics.test.ts`. Worklets can't call
// across files, so `_gestureEnd` carries a hand-copied mirror, and the guards
// on the background-side commit run where no test can reach them.
describe('Sortable — commitReorder guards', () => {
  it('rejects a no-op or out-of-range reorder before touching the model', async () => {
    // A drop that never moved, or a target past the end, would otherwise
    // splice `undefined` into the list and emit a phantom reorder.
    const fn = body(await readSfc('SortableRoot.vue'), 'commitReorder')
    expect(fn).toMatch(/if \(from === to \|\| from < 0 \|\| to < 0\) return/)
    expect(fn).toMatch(/if \(from >= list\.length \|\| to >= list\.length\) return/)
  })

  it('moves on a copy, then publishes and emits', async () => {
    // Splicing `items.value` in place would mutate the consumer's array before
    // the range guard had a say, and emitting first would report a reorder the
    // model has not taken yet.
    const fn = body(await readSfc('SortableRoot.vue'), 'commitReorder')
    expect(fn).toMatch(/const list = \[\.\.\.items\.value\][\s\S]*items\.value = list[\s\S]*emits\('reorder', \{ from, to \}\)/)
  })
})

describe('Sortable — drop settle contract in the SFC source', () => {
  it('keeps the velocity bias and range clamp in the drop target math', async () => {
    const fn = body(await readSfc('SortableItem.vue'), '_gestureEnd')
    expect(fn).toMatch(/if \(dir > 0 && target >= startIdx\) target \+= 1/)
    expect(fn).toMatch(/else if \(dir < 0 && target <= startIdx\) target -= 1/)
    expect(fn).toMatch(/if \(target < 0\) target = 0/)
    expect(fn).toMatch(/if \(target > count - 1\) target = count - 1/)
  })

  it('settles the lifted row into its target slot instead of clearing on release', async () => {
    // Clearing on the main thread at release repaints the PRE-DRAG order for
    // however many frames the background commit takes to round-trip — the list
    // snapping back and then reordering.
    const fn = body(await readSfc('SortableItem.vue'), '_gestureEnd')
    expect(fn).toMatch(/_shiftOthers\(startIdx, target\)/)
    expect(fn).toMatch(/_setTransform\(/)
    expect(fn).not.toMatch(/_clearAll\(/)
  })

  it('clears the settle transforms only after the reorder has rendered', async () => {
    const fn = body(await readSfc('SortableItem.vue'), '_emitDragEnd')
    expect(fn).toMatch(/nextTick\([\s\S]*_clearAll/)
    expect(fn).toMatch(/nextTick\([\s\S]*notifyDragEnd/)
  })

  it('defaults longPressMs to 150', async () => {
    // 250 felt like the row refused to lift; the value is mirrored to MT and
    // read by the activation poller, so it is easy to change in one place only.
    expect(await readSfc('SortableRoot.vue')).toMatch(/longPressMs: 150/)
  })

  // Lynx web re-targets pointer events by paint position, so a row dragged
  // downward slid UNDER the rows it passed; those rows then swallowed its
  // mousemove/mouseup and the gesture stranded mid-drag.
  it('raises the lifted row from the background render, never from a worklet', async () => {
    // A worklet-set zIndex does not survive the style patch that follows
    // dragStart, so the raise has to ride the re-render `isDragging` triggers.
    const sfc = await readSfc('SortableItem.vue')
    const style = sfc.match(/const rowStyle = computed\([\s\S]*?\n\}\)/)?.[0] ?? ''
    expect(style).toMatch(/style\.zIndex = isDragging\.value \? 1 : 0/)
    expect(sfc).not.toMatch(/setStyleProperty\(\s*'z-?index'/i)
  })

  it('keeps the raise off native, where z-index jumps the row out of layout', async () => {
    const style = (await readSfc('SortableItem.vue'))
      .match(/const rowStyle = computed\([\s\S]*?\n\}\)/)?.[0] ?? ''
    expect(style).toMatch(/SystemInfo\)?\??\.?\w*\?\.platform === 'web'/)
  })
})
