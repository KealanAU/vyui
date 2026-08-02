/**
 * getViewportSize — the LynxView's size in logical px, from `SystemInfo`.
 *
 * Lynx has no `window.innerWidth`; the background thread exposes physical
 * pixels via `SystemInfo.pixelWidth` / `pixelHeight` plus `pixelRatio`.
 * Returns `null` off-Lynx (web / jsdom) or before `SystemInfo` resolves, so
 * callers choose their own fallback. Not reactive — re-read on a root
 * `layoutchange` (e.g. `VyApp`'s `viewport-change` emit) to track rotation.
 *
 * Main-thread worklets cannot call this (cross-file worklet calls don't
 * resolve); they keep their own inline `SystemInfo` reads.
 */

export interface ViewportSize {
  width: number
  height: number
}

export function getViewportSize(): ViewportSize | null {
  const sys: any = (globalThis as any).SystemInfo
  if (
    typeof sys?.pixelWidth === 'number'
    && typeof sys?.pixelHeight === 'number'
    && typeof sys?.pixelRatio === 'number'
    && sys.pixelRatio > 0
  ) {
    return { width: sys.pixelWidth / sys.pixelRatio, height: sys.pixelHeight / sys.pixelRatio }
  }
  return null
}
