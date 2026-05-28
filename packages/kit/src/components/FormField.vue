<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/formField'
import type { AppConfig } from '../types'
import type { FormFieldValidator } from '@vyui/core'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.formField`.
 */
export const buildFormField = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).formField as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

type FormFieldVariants = VariantProps<ReturnType<typeof buildFormField>>

export interface FormFieldProps {
  /** Field name — must be unique within the parent `<VyForm>`. */
  name: string
  /** Initial value when the form's `defaultValues` doesn't supply one. */
  defaultValue?: unknown
  /** Synchronous validators (see `@vyui/core`). Stops at the first error. */
  validators?: FormFieldValidator[]
  /** Label text rendered above the control. Overridden by the `label` slot. */
  label?: string
  /** Description rendered between the label and the control. Overridden by the `description` slot. */
  description?: string
  /** Small auxiliary text rendered next to the label (right-aligned). Overridden by the `hint` slot. */
  hint?: string
  /** Helper text rendered below the control. Hidden when an error is showing. */
  help?: string
  /**
   * Manual error override. When provided, takes precedence over the
   * validator-derived error from the surrounding `<VyForm>`.
   */
  error?: string
  /** Marks the field as required — appends a red asterisk to the label. */
  required?: boolean
  size?: FormFieldVariants['size']
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildFormField>['slots'], any>>
}

export interface FormFieldSlots {
  default(props: {
    value: unknown
    error: string | null
    setValue: (value: unknown) => void
    disabled: boolean
  }): any
  label(props?: {}): any
  description(props?: {}): any
  hint(props?: {}): any
  help(props?: {}): any
  error(props: { error: string }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { FormField as CoreFormField } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<FormFieldProps>(), {
  required: false,
})
defineSlots<FormFieldSlots>()

const appConfig = useAppConfig()

const ui = computed(() => buildFormField(appConfig)({
  size: props.size,
  required: props.required,
}))
</script>

<template>
  <CoreFormField
    :name="name"
    :default-value="defaultValue"
    :validators="validators"
  >
    <template #default="field">
      <view :class="ui.root({ class: [props.class, props.ui?.root] })">
        <view :class="ui.wrapper({ class: props.ui?.wrapper })">
          <view
            v-if="label || hint || !!$slots.label || !!$slots.hint"
            :class="ui.labelWrapper({ class: props.ui?.labelWrapper })"
          >
            <text :class="ui.label({ class: props.ui?.label })">
              <slot name="label">{{ label }}</slot>
            </text>
            <text
              v-if="hint || !!$slots.hint"
              :class="ui.hint({ class: props.ui?.hint })"
            >
              <slot name="hint">{{ hint }}</slot>
            </text>
          </view>
          <text
            v-if="description || !!$slots.description"
            :class="ui.description({ class: props.ui?.description })"
          >
            <slot name="description">{{ description }}</slot>
          </text>
        </view>

        <view :class="ui.container({ class: props.ui?.container })">
          <slot
            :value="field.value"
            :error="props.error ?? field.error"
            :set-value="field.setValue"
            :disabled="field.disabled"
          />
        </view>

        <text
          v-if="props.error || field.error"
          :class="ui.error({ class: props.ui?.error })"
        >
          <slot name="error" :error="(props.error ?? field.error) as string">{{ props.error ?? field.error }}</slot>
        </text>
        <text
          v-else-if="help || !!$slots.help"
          :class="ui.help({ class: props.ui?.help })"
        >
          <slot name="help">{{ help }}</slot>
        </text>
      </view>
    </template>
  </CoreFormField>
</template>
