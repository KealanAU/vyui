// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/selector.ts`.
//
// Adapted for vyui:
//   - The upstream module typed refs as React's `RefObject<NodesRef>`. vyui has
//     no React dependency, so the public shape here is a structurally-typed
//     `NodeRef<T>` ( `{ current: T | null | undefined }` ) that works equally
//     well with React refs, Vue's `useTemplateRef`/`ref` wrappers (callers pass
//     `{ current: theRef.value }`), or any plain object with a `current` slot.
//   - `lynx`, `NodesRef`, `MainThread`, `AnyObject` are imported from
//     `@lynx-js/types` (the same global types vyui already depends on).

import type { AnyObject, MainThread, NodesRef } from '@lynx-js/types'

/**
 * Structural ref shape — mirrors React's `RefObject<T>` so call sites that
 * already produce such an object (the ReactLynx port, our own tests) keep
 * working without an adapter. Vue callers can pass `{ current: theRef.value }`.
 */
export interface NodeRef<T> {
  current: T | null | undefined
}

/** Error thrown when an `invoke()` selector-query call rejects. */
export class InvokeRejectError extends Error {
  errorCode: number
  detail?: object | string
  constructor(errorCode: number, errorMsg?: string) {
    super(typeof errorMsg === 'string' ? errorMsg : 'unknown error')
    this.errorCode = errorCode
    this.detail = errorMsg
  }
}

export const setNativePropsByRef = (
  ref: NodeRef<NodesRef> | undefined,
  props: Record<string, any>,
): void => {
  ref?.current?.setNativeProps(props).exec()
}

export const setNativePropsById = (
  id: string,
  props: Record<string, any>,
): void => {
  lynx.createSelectorQuery().select(`#${id}`).setNativeProps(props).exec()
}

export const setNativeProps = (
  target: {
    ref?: NodeRef<NodesRef>
    id?: string
  },
  props: Record<string, any>,
): void =>
  target.id
    ? setNativePropsById(target.id, props)
    : setNativePropsByRef(target.ref, props)

export const invokeByRef = (
  ref: NodeRef<NodesRef> | undefined,
  method: string,
  params?: AnyObject,
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    if (!ref?.current) {
      reject(new InvokeRejectError(2, 'no node found for the ref'))
      return
    }
    ref.current
      .invoke({
        method,
        params,
        success: (res) => {
          resolve(res)
        },
        fail: (res: { code: number, data?: any }) => {
          reject(new InvokeRejectError(res.code, JSON.stringify(res.data)))
        },
      })
      .exec()
  })

export const invokeById = (
  id: string,
  method: string,
  params?: AnyObject,
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    lynx
      .createSelectorQuery()
      .select(`#${id}`)
      .invoke({
        method,
        params,
        success: (res) => {
          resolve(res)
        },
        fail: (res: { code: number, data?: any }) => {
          reject(new InvokeRejectError(res.code, JSON.stringify(res.data)))
        },
      })
      .exec()
  })

export const invoke = (
  target: {
    ref?: NodeRef<NodesRef>
    id?: string
  },
  method: string,
  params?: AnyObject,
): Promise<unknown> =>
  target.id
    ? invokeById(target.id, method, params)
    : invokeByRef(target.ref, method, params)

export interface GetRectPromise {
  left: number
  top: number
  width: number
  height: number
  bottom: number
  right: number
}

export const getRectByRef = (
  ref?: NodeRef<NodesRef>,
  relativeToScreen = false,
  relativeTo = '',
): Promise<GetRectPromise> =>
  new Promise((resolve, reject) => {
    invokeByRef(ref, 'boundingClientRect', {
      relativeTo: relativeToScreen ? 'screen' : relativeTo,
      // Match the standard getBoundingClientRect behavior: transforms are
      // included in the returned rect. Keep this enabled by default across
      // platforms to avoid incorrect bounds for transformed nodes, such as
      // scaled views. A few animation-related cases may opt out explicitly.
      androidEnableTransformProps: true,
      iosEnableTransformProps: true,
      harmonyEnableTransformProps: true,
    })
      .then((res) => {
        resolve(res as GetRectPromise)
      })
      .catch((error: InvokeRejectError) => {
        reject(error)
      })
  })

export const getRootRect = (
  relativeToScreen = false,
  relativeTo = '',
): Promise<GetRectPromise> =>
  new Promise((resolve, reject) => {
    lynx
      .createSelectorQuery()
      .selectRoot()
      .invoke({
        method: 'boundingClientRect',
        params: {
          relativeTo: relativeToScreen ? 'screen' : relativeTo,
          androidEnableTransformProps: true,
          iosEnableTransformProps: true,
          harmonyEnableTransformProps: true,
        },
        success: (res) => {
          resolve(res as GetRectPromise)
        },
        fail: (res: { code: number, data?: object }) => {
          reject(new InvokeRejectError(res.code, JSON.stringify(res.data)))
        },
      })
      .exec()
  })

export const getRectById = (
  id: string,
  relativeToScreen = false,
  relativeTo = '',
): Promise<GetRectPromise> =>
  new Promise((resolve, reject) => {
    invokeById(id, 'boundingClientRect', {
      relativeTo: relativeToScreen ? 'screen' : relativeTo,
      androidEnableTransformProps: true,
      iosEnableTransformProps: true,
      harmonyEnableTransformProps: true,
    })
      .then((res) => {
        resolve(res as GetRectPromise)
      })
      .catch((error: InvokeRejectError) => {
        reject(error)
      })
  })

export const getRect = (
  target: {
    ref?: NodeRef<NodesRef>
    id?: string
  },
  relativeToScreen = false,
): Promise<GetRectPromise> =>
  target.id
    ? getRectById(target.id, relativeToScreen)
    : getRectByRef(target.ref, relativeToScreen)

export const selectorMT: (selector: string) => MainThread.Element | null = (
  selector: string,
) => {
  'main thread'
  // @ts-expect-error `lynx.querySelector` exists at runtime on the main thread
  // but isn't part of the public `Lynx` type yet.
  return lynx.querySelector(`#${selector}`)
}
