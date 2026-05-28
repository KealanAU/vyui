/**
 * useMtSmoke — disposable diagnostic. Tests whether a `'main thread'`
 * function defined inside a workspace-package `.ts` file gets registered
 * on the MT side. Phase5.vue's inline smoke test works; if this composable's
 * worklet doesn't fire when invoked, the worklet-loader-mt isn't running
 * on `.ts` files inside `packages/core/`.
 *
 * Delete after diagnosis.
 */
import { runOnMainThread, useMainThreadRef } from 'vue-lynx'

export function useMtSmoke() {
  const tickRef = useMainThreadRef<number>(0)

  function _bumpMT(n: number) {
    'main thread'
    tickRef.current = tickRef.current + n
    if (typeof console !== 'undefined') {
      console.log('[mt-smoke] composable worklet ran, tickRef=' + tickRef.current)
    }
  }

  function bump(n: number) {
    if (typeof console !== 'undefined') {
      console.log('[mt-smoke] BG dispatching, _wkltId=', (_bumpMT as any)._wkltId)
    }
    runOnMainThread(_bumpMT as any)(n)
  }

  return { bump }
}
