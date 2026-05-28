// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/mainThreadify.ts`.
//
// vue-lynx uses the same `main-thread:` event-name convention as ReactLynx, so
// this is a straight port with no behavioural changes.

/**
 * Rewrites a `{ eventName: handlerName }` mapping into its `main-thread:`
 * counterpart — every key and value gets the `main-thread:` prefix.
 *
 * Useful when a component accepts an event-mapping prop and you need to opt
 * the whole bag into the main-thread variant in one go.
 *
 * @example
 * ```ts
 * mainThreadifyEventsMapping({ tap: 'onTap', longpress: 'onHold' })
 * // => { 'main-thread:tap': 'main-thread:onTap',
 * //      'main-thread:longpress': 'main-thread:onHold' }
 * ```
 */
export const mainThreadifyEventsMapping = (
  rawEvents: Record<string, string>,
): Record<string, string> => {
  return Object.entries(rawEvents).reduce(
    (eventsWithMainThread: Record<string, string>, [key, value]) => {
      eventsWithMainThread[`main-thread:${key}`] = `main-thread:${value}`
      return eventsWithMainThread
    },
    {},
  )
}
