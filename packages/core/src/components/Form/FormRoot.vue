<!-- Copyright 2026 The Lynx Authors. All rights reserved. Licensed under the Apache License Version 2.0. Adapted from lynx-family/lynx-ui (Apache 2.0). -->
<script lang="ts">
import type { FormFieldValidator } from './formContext'

export interface FormRootProps {
  /** Initial values, keyed by field name. Used by `reset()`. */
  defaultValues?: Record<string, unknown>
  /** When `true`, the form (and all fields) is disabled. */
  disabled?: boolean
}

export type FormRootEmits = {
  /** Emitted by `submit()` only when every validator passes. */
  submit: [values: Record<string, unknown>]
  /** Emitted whenever any field value changes. */
  'update:values': [values: Record<string, unknown>]
}

export interface FormRootExposed {
  /** Run sync validators and emit `submit` when clean. */
  submit: () => void
  /** Clear errors and restore field values to `defaultValues`. */
  reset: () => void
}
</script>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue'

import {
  type FormRootContext,
  provideFormRootContext,
} from './formContext'

const props = withDefaults(defineProps<FormRootProps>(), {
  disabled: false,
})
const emits = defineEmits<FormRootEmits>()

defineSlots<{
  default?: (props: {
    values: Record<string, unknown>
    errors: Record<string, string | null>
    submitting: boolean
  }) => any
}>()

const disabled = toRef(props, 'disabled')
const submitting = ref(false)
const errors = ref<Record<string, string | null>>({})
const values = ref<Record<string, unknown>>({ ...(props.defaultValues ?? {}) })

// Validators are kept out of the reactive `values` blob — stable per-field, and
// they don't need to retrigger renders.
const validatorsByField = new Map<string, FormFieldValidator[]>()

function registerField(
  name: string,
  options: {
    defaultValue?: unknown
    validators?: FormFieldValidator[]
  },
) {
  // Defer to the form's `defaultValues`, then the field's own `defaultValue`.
  if (!(name in values.value)) {
    const seeded = props.defaultValues?.[name] ?? options.defaultValue
    values.value = { ...values.value, [name]: seeded }
  }
  validatorsByField.set(name, options.validators ?? [])
  if (!(name in errors.value))
    errors.value = { ...errors.value, [name]: null }
}

function unregisterField(name: string) {
  validatorsByField.delete(name)
  if (name in values.value) {
    const { [name]: _v, ...rest } = values.value
    values.value = rest
  }
  if (name in errors.value) {
    const { [name]: _e, ...rest } = errors.value
    errors.value = rest
  }
}

function setFieldValue(name: string, value: unknown) {
  values.value = { ...values.value, [name]: value }
  // Eagerly clear the error — the next submit will recompute it.
  if (errors.value[name])
    errors.value = { ...errors.value, [name]: null }
}

function setFieldError(name: string, error: string | null) {
  errors.value = { ...errors.value, [name]: error }
}

function runValidators(): Record<string, string | null> {
  const next: Record<string, string | null> = {}
  for (const [name, validators] of validatorsByField) {
    const value = values.value[name]
    let err: string | null = null
    for (const validator of validators) {
      const result = validator(value)
      if (typeof result === 'string' && result.length > 0) {
        err = result
        break
      }
    }
    next[name] = err
  }
  return next
}

function submit() {
  if (submitting.value)
    return
  submitting.value = true
  try {
    const nextErrors = runValidators()
    errors.value = nextErrors
    const hasError = Object.values(nextErrors).some(e => e != null && e !== '')
    if (!hasError)
      emits('submit', { ...values.value })
  }
  finally {
    submitting.value = false
  }
}

function reset() {
  values.value = { ...(props.defaultValues ?? {}) }
  // Re-seed any registered field missing from defaultValues so its own
  // `defaultValue` is retained after reset.
  for (const name of validatorsByField.keys()) {
    if (!(name in values.value))
      values.value = { ...values.value, [name]: undefined }
  }
  const cleared: Record<string, string | null> = {}
  for (const name of validatorsByField.keys()) cleared[name] = null
  errors.value = cleared
}

watch(
  values,
  (next) => {
    emits('update:values', { ...next })
  },
  { deep: false },
)

const context: FormRootContext = {
  disabled,
  submitting,
  errors,
  values,
  registerField,
  unregisterField,
  setFieldValue,
  setFieldError,
  submit,
}
provideFormRootContext(context)

defineExpose<FormRootExposed>({ submit, reset })
</script>

<template>
  <slot
    :values="values"
    :errors="errors"
    :submitting="submitting"
  />
</template>
