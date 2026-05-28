// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/common.ts`.

function _basePath(path: unknown[] | string) {
  if (Array.isArray(path)) {
    return path
  }
  return path.replace(/\[/g, '.').replace(/\]/g, '').split('.')
}

/**
 * Lodash-like `get`, accessing object by path. Otherwise return `defaultValue`.
 * Path can be `'a[0].b.c'`, `'a.0.b.c'` or `['a','0','b','c']`.
 * @param obj Object to get property from
 * @param path Path of property
 * @param defaultValue Optional. Default value
 */
export function get(obj: unknown, path: string, defaultValue?: unknown) {
  if (typeof obj !== 'object') {
    return defaultValue
  }
  // @ts-expect-error o is unknown
  return _basePath(path).reduce((o: unknown, k: string) => o?.[k], obj)
    ?? defaultValue
}

/**
 * Empty function that does nothing.
 * Useful as a default callback or placeholder function.
 */
export const noop = (): void => {
  // Intentionally empty
}
