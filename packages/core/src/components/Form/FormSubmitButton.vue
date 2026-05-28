<!-- Copyright 2026 The Lynx Authors. All rights reserved. Licensed under the Apache License Version 2.0. Adapted from lynx-family/lynx-ui (Apache 2.0). -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface FormSubmitButtonProps extends PrimitiveProps {
  /**
   * When `true`, the button is disabled regardless of form state. When
   * `false` (default), the button is disabled only while the form is
   * submitting OR there is at least one validation error.
   */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

import { Primitive } from '@/components/Primitive'

import { injectFormRootContext } from './formContext'

const props = withDefaults(defineProps<FormSubmitButtonProps>(), {
  as: 'view',
  disabled: false,
})

defineSlots<{
  default?: (props: { submitting: boolean, disabled: boolean }) => any
}>()

const root = injectFormRootContext()

// "Invalid" = at least one non-null error string. Errors are populated by
// `submit()` and cleared on field change, so the button is enabled until the
// first submission attempt — matching the lynx-ui React behavior.
const invalid = computed(() =>
  Object.values(root.errors.value).some(e => e != null && e !== ''))

const isDisabled = computed(() =>
  props.disabled || root.submitting.value || root.disabled.value || invalid.value)

function onTap() {
  if (isDisabled.value) return
  root.submit()
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    accessibility-traits="button"
    :data-disabled="isDisabled ? '' : undefined"
    :data-submitting="root.submitting.value ? '' : undefined"
    @tap="onTap"
  >
    <slot :submitting="root.submitting.value" :disabled="isDisabled" />
  </Primitive>
</template>
