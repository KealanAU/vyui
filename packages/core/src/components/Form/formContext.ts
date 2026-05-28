// Copyright 2026 The Lynx Authors. All rights reserved. Licensed under the Apache License Version 2.0. Adapted from lynx-family/lynx-ui (Apache 2.0).

import type { Ref } from 'vue'

import { createContext } from '@/shared'

/**
 * Synchronous validator. Return `null` (or `undefined`) when the value is
 * valid, or a non-empty `string` describing the error. Async validators are
 * out of scope for v1.
 */
export type FormFieldValidator = (value: unknown) => string | null | undefined

export interface FormRootContext {
  /** Whether the whole form is disabled. Propagated to fields. */
  disabled: Ref<boolean>
  /** Whether a submit pass is currently running. */
  submitting: Ref<boolean>
  /** Per-field error string keyed by name. `null` = no error. */
  errors: Ref<Record<string, string | null>>
  /** Per-field current value keyed by name. */
  values: Ref<Record<string, unknown>>
  /**
   * Register a field at mount. The field reports its initial value, its
   * default value, and the validators that should be run on submit.
   */
  registerField: (
    name: string,
    options: {
      defaultValue?: unknown
      validators?: FormFieldValidator[]
    },
  ) => void
  /** Unregister a field at unmount. Drops its value, error and validators. */
  unregisterField: (name: string) => void
  /** Update a field's value. Clears its current error eagerly. */
  setFieldValue: (name: string, value: unknown) => void
  /** Manually set a field's error (e.g. external server-side validation). */
  setFieldError: (name: string, error: string | null) => void
  /**
   * Run all sync validators, collect errors, and — if clean — fire the
   * `submit` event with the current values.
   */
  submit: () => void
}

export const [injectFormRootContext, provideFormRootContext]
  = createContext<FormRootContext>('FormRoot')

export interface FormFieldContext {
  /** Field name (matches the key in `values` / `errors`). */
  name: Ref<string>
  /** Current value of this field. */
  value: Ref<unknown>
  /** Current error string for this field, or `null`. */
  error: Ref<string | null>
  /** Whether this field is disabled (form-level disabled propagates). */
  disabled: Ref<boolean>
  /** Update this field's value. */
  setValue: (value: unknown) => void
}

export const [injectFormFieldContext, provideFormFieldContext]
  = createContext<FormFieldContext>('FormField')
