// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/version.ts`.
//
// Adapted for vyui: the `nativeLynxSDKVersion*` helpers tolerate a missing
// `SystemInfo` global (jsdom / SSR) by treating the runtime version as `0.0.0`
// — every comparison resolves deterministically without throwing.

function getRuntimeVersion(): string {
  if (typeof SystemInfo !== 'undefined' && SystemInfo.lynxSdkVersion) {
    return SystemInfo.lynxSdkVersion
  }
  return '0.0.0'
}

function getMainThreadRuntimeVersion(): string {
  'main thread'
  if (typeof SystemInfo !== 'undefined') {
    return SystemInfo.engineVersion ?? SystemInfo.lynxSdkVersion ?? '0.0.0'
  }
  return '0.0.0'
}

/**
 * Pack a dotted Lynx SDK version (`'1.2.3'`) into a comparable integer
 * (`10203`). Missing segments are treated as `0`.
 */
export function lynxSDKVersionStringToNumber(lynxSDKVersion: string): number {
  const ver: string[] = lynxSDKVersion.split('.')
  const major: number = Number(ver[0] ? ver[0] : 0) * 10000
  const minor: number = Number(ver[1] ? ver[1] : 0) * 100
  const patch = Number(ver[2] ? ver[2] : 0)
  return major + minor + patch
}

/** Main-thread variant of {@link lynxSDKVersionStringToNumber}. */
export function mtsLynxSDKVersionStringToNumber(
  lynxSDKVersion: string,
): number {
  'main thread'
  const ver: string[] = lynxSDKVersion.split('.')
  const major: number = Number(ver[0] ? ver[0] : 0) * 10000
  const minor: number = Number(ver[1] ? ver[1] : 0) * 100
  const patch = Number(ver[2] ? ver[2] : 0)
  return major + minor + patch
}

/** `true` when the host runtime's `lynxSdkVersion` is strictly greater than `lynxSDKVersion`. */
export function nativeLynxSDKVersionGreaterThan(
  lynxSDKVersion: string,
): boolean {
  return (
    lynxSDKVersionStringToNumber(getRuntimeVersion())
      > lynxSDKVersionStringToNumber(lynxSDKVersion)
  )
}

/** `true` when the host runtime's `lynxSdkVersion` is strictly less than `lynxSDKVersion`. */
export function nativeLynxSDKVersionLessThan(lynxSDKVersion: string): boolean {
  return (
    lynxSDKVersionStringToNumber(getRuntimeVersion())
      < lynxSDKVersionStringToNumber(lynxSDKVersion)
  )
}

/** Main-thread variant of {@link nativeLynxSDKVersionLessThan}. */
export function mtsNativeLynxSDKVersionLessThan(
  lynxSDKVersion: string,
): boolean {
  'main thread'
  return (
    mtsLynxSDKVersionStringToNumber(getMainThreadRuntimeVersion())
      < mtsLynxSDKVersionStringToNumber(lynxSDKVersion)
  )
}

/**
 * Whether the native `<refresh>` / `<refresh-header>` UI elements are
 * registered in the host Lynx runtime.
 *
 * These are *legacy* built-in UI classes from older internal Lynx (Lark/TT)
 * native runtimes. The open-source LynxExplorer build (and the engine that
 * `@lynx-js/react` / `vue-lynx` target) does **not** register them: mounting a
 * `<refresh>` element there hard-crashes the create-UI pass with
 * `LynxCreateUIException: refresh ui not found when create UI`. There is no
 * runtime element-registry query API to feature-detect this directly, so the
 * only crash-safe default is to treat `<refresh>` as **unsupported** unless the
 * host explicitly advertises it.
 *
 * Detection order:
 * 1. `SystemInfo.supportRefreshUI === true` — explicit positive signal a custom
 *    native runtime can set when it does register the refresh UI. Honoured first
 *    so embedders that ship the legacy elements still get native PTR.
 * 2. Otherwise `false` — the safe default for stock LynxExplorer / OSS engines.
 *
 * Consumers that know their host registers the elements can override per-call
 * via the FeedList `refreshSupported` prop.
 */
export function isNativeRefreshSupported(): boolean {
  if (typeof SystemInfo === 'undefined') return false
  // `supportRefreshUI` is a vyui/embedder convention, not a standard Lynx
  // field — cast through `unknown` so we don't widen the typed SystemInfo.
  const info = SystemInfo as unknown as { supportRefreshUI?: boolean }
  return info.supportRefreshUI === true
}
