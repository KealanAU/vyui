<!-- Copyright 2026 The Lynx Authors. All rights reserved. Licensed under the Apache License Version 2.0. Adapted from lynx-family/lynx-ui (Apache 2.0). -->
<script lang="ts">
import type { FormFieldValidator } from './formContext'

export interface FormFieldProps {
  /** Field name — must be unique within the form. */
  name: string
  /**
   * Synchronous validators. Each returns `null` (or `undefined`) for valid,
   * or a non-empty string describing the error. Stops at the first error.
   */
  validators?: FormFieldValidator[]
  /**
   * Initial value when the form's `defaultValues` doesn't supply one.
   * Form-level `defaultValues` takes precedence.
   */
  defaultValue?: unknown
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

import {
  injectFormRootContext,
  provideFormFieldContext,
} from './formContext'

const props = defineProps<FormFieldProps>()

defineSlots<{
  default?: (props: {
    value: unknown
    error: string | null
    setValue: (value: unknown) => void
    disabled: boolean
  }) => any
}>()

const root = injectFormRootContext()

// `name` is treated as effectively static: changing it would orphan the
// registration with the old name. We register once with the initial value;
// callers shouldn't swap names at runtime.
const name = ref(props.name)

root.registerField(props.name, {
  defaultValue: props.defaultValue,
  validators: props.validators,
})

onBeforeUnmount(() => {
  root.unregisterField(props.name)
})

const value = computed(() => root.values.value[props.name])
const error = computed(() => root.errors.value[props.name] ?? null)
const disabled = computed(() => root.disabled.value)

function setValue(next: unknown) {
  if (root.disabled.value) return
  root.setFieldValue(props.name, next)
}

provideFormFieldContext({
  name,
  value,
  error,
  disabled,
  setValue,
})
</script>

<template>
  <slot
    :value="value"
    :error="error"
    :set-value="setValue"
    :disabled="disabled"
  />
</template>
