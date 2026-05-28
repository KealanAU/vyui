import { shallowRef } from 'vue'

export type OverlayRenderFn = () => any

export interface OverlayEntry {
  id: string
  render: OverlayRenderFn
  provides?: Record<any, any>
}

export const overlayEntries = shallowRef<OverlayEntry[]>([])

export function registerOverlay(id: string, render: OverlayRenderFn, provides?: Record<any, any>) {
  const idx = overlayEntries.value.findIndex(e => e.id === id)
  if (idx >= 0) {
    const next = [...overlayEntries.value]
    next[idx] = { id, render, provides }
    overlayEntries.value = next
  }
  else {
    overlayEntries.value = [...overlayEntries.value, { id, render, provides }]
  }
}

export function unregisterOverlay(id: string) {
  overlayEntries.value = overlayEntries.value.filter(e => e.id !== id)
}
