export { render, cleanup, waitForUpdate } from './render.js'
export type { RenderResult } from './render.js'
export { fireEvent, eventMap } from './fire-event.js'
export { screen, within, getQueriesForElement } from '@testing-library/dom'

import { cleanup } from './render.js'

if (typeof afterEach === 'function') {
  afterEach(() => {
    cleanup()
    ;(globalThis as any).lynxTestingEnv?.reset()
  })
}
