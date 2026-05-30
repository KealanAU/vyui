<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import { createContext } from '@/shared'

export interface SelectItemProps extends PrimitiveProps {
  /** The value given when this item is selected. Must not be an empty string. */
  value: string
  /** When `true`, prevents the user from selecting this item. */
  disabled?: boolean
}

export interface SelectItemContext {
  value: string
  isSelected: Ref<boolean>
  disabled: Ref<boolean>
  onItemTextRegister: (text: string) => void
}

export const [injectSelectItemContext, provideSelectItemContext]
  = createContext<SelectItemContext>('SelectItem')
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRefs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { injectSelectRootContext } from './SelectRoot.vue'

if (__DEV__) {
  // value must not be empty string
}

const props = withDefaults(defineProps<SelectItemProps>(), {
  as: 'view',
  disabled: false,
})

const { disabled } = toRefs(props)

const rootContext = injectSelectRootContext()

const isSelected = computed(() => rootContext.modelValue.value === props.value)

const a11y = useA11y(() => ({
  role: 'option',
  disabled: disabled.value,
  selected: isSelected.value,
}))

const itemText = ref('')

function handleSelect() {
  if (!disabled.value) {
    rootContext.onValueChange(props.value)
  }
}

onMounted(() => {
  // label will be set by SelectItemText via onItemTextRegister
  rootContext.onItemRegister(props.value, itemText.value)
})

onUnmounted(() => {
  rootContext.onItemUnregister(props.value)
})

provideSelectItemContext({
  value: props.value,
  isSelected,
  disabled,
  onItemTextRegister: (text) => {
    itemText.value = text
    rootContext.onItemRegister(props.value, text)
  },
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-state="isSelected ? 'checked' : 'unchecked'"
    :data-disabled="disabled ? '' : undefined"
    v-bind="{ ...$attrs, ...a11y }"
    @tap="handleSelect"
  >
    <slot />
  </Primitive>
</template>
