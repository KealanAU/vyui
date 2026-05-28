<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '..'
import { OverlayRoot } from '../../OverlayRoot'

const props = defineProps<{
  modelValue?: string
  defaultValue?: string
  defaultOpen?: boolean
  disabled?: boolean
  itemDisabled?: string
}>()

const value = ref<string | undefined>(props.modelValue ?? props.defaultValue)
const fruits = ['Apple', 'Banana', 'Cherry']

// Omit undefined keys so SelectRoot's `useVModel(... passive: open === undefined)`
// stays in passive mode for the default case — see Toast story for the same
// pattern.
const rootBindings = computed(() => {
  const obj: Record<string, unknown> = {}
  if (props.defaultOpen !== undefined) obj.defaultOpen = props.defaultOpen
  if (props.disabled !== undefined) obj.disabled = props.disabled
  return obj
})
</script>

<template>
  <view>
    <SelectRoot v-model="value" v-bind="rootBindings">
      <SelectTrigger data-testid="trigger">
        <SelectValue placeholder="Pick one" data-testid="value" />
      </SelectTrigger>
      <SelectContent data-testid="content">
        <SelectGroup>
          <SelectLabel>
            <text>Fruits</text>
          </SelectLabel>
          <SelectItem
            v-for="fruit in fruits"
            :key="fruit"
            :value="fruit"
            :disabled="fruit === props.itemDisabled"
            :data-testid="`item-${fruit}`"
          >
            <SelectItemText>
              <text>{{ fruit }}</text>
            </SelectItemText>
            <SelectItemIndicator :data-testid="`indicator-${fruit}`">
              <text>x</text>
            </SelectItemIndicator>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
    <text data-testid="model">{{ value ?? '' }}</text>
    <OverlayRoot />
  </view>
</template>
