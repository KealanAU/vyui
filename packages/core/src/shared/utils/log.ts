// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-common/src/utils/log.ts`.

/** Background-thread `console.info` gated on a debug flag. */
export const log = (showLog: boolean, ...data: unknown[]): void => {
  if (showLog) {
    console.info(...data)
  }
}
