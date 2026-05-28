// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import type { Ref } from 'vue'

import { createContext } from '@/shared'

export interface ButtonContext {
  /** True while the user is pressing the button (and it's not disabled). */
  active: Ref<boolean>
  /** Mirrors the `disabled` prop. */
  disabled: Ref<boolean>
}

export const [injectButtonContext, provideButtonContext] =
  createContext<ButtonContext>('Button')
