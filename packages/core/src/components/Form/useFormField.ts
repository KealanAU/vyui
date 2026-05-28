// Copyright 2026 The Lynx Authors. All rights reserved. Licensed under the Apache License Version 2.0. Adapted from lynx-family/lynx-ui (Apache 2.0).

import {
  type FormFieldContext,
  injectFormFieldContext,
} from './formContext'

/**
 * Returns the nearest `FormField` context. Throws if used outside a
 * `<FormField>`. Wraps `injectFormFieldContext` so consumer call-sites read
 * a little cleaner.
 */
export function useFormField(): FormFieldContext {
  return injectFormFieldContext()
}
