<script setup lang="ts">
import { ref } from 'vue'

import {
  FormField,
  FormRoot,
  FormSubmitButton,
  type FormRootExposed,
} from '..'

const submitted = ref<Record<string, unknown> | null>(null)
const rootRef = ref<FormRootExposed | null>(null)

function required(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0)
    return 'Required'
  return null
}

function onSubmit(values: Record<string, unknown>) {
  submitted.value = values
}
</script>

<template>
  <view>
    <FormRoot
      ref="rootRef"
      :default-values="{ name: '' }"
      @submit="onSubmit"
    >
      <template #default="{ values, errors, submitting }">
        <view data-testid="values">
          <text>{{ JSON.stringify(values) }}</text>
        </view>
        <view data-testid="submitting-flag">
          <text>{{ submitting ? 'busy' : 'idle' }}</text>
        </view>

        <FormField name="name" :validators="[required]">
          <template #default="{ value, error, setValue, disabled }">
            <view data-testid="field" :data-disabled="disabled ? '' : undefined">
              <text data-testid="field-value">{{ value ?? '' }}</text>
              <text data-testid="field-error">{{ error ?? '' }}</text>
              <view
                data-testid="set-foo"
                bindtap="() => setValue('foo')"
                @tap="() => setValue('foo')"
              >
                <text>set</text>
              </view>
            </view>
          </template>
        </FormField>

        <FormSubmitButton data-testid="submit">
          <template #default="{ submitting: s, disabled }">
            <text data-testid="submit-label">
              {{ s ? '...' : (disabled ? 'disabled' : 'submit') }}
            </text>
          </template>
        </FormSubmitButton>

        <view data-testid="submitted">
          <text>{{ submitted ? JSON.stringify(submitted) : '' }}</text>
        </view>
      </template>
    </FormRoot>
  </view>
</template>
