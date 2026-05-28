<script setup lang="ts">
import { ref } from 'vue'
import {
  ComboboxAnchor,
  ComboboxCancel,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxRoot,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxViewport,
} from '..'
import { OverlayRoot } from '../../OverlayRoot'

const props = defineProps<{
  multiple?: boolean
  disabled?: boolean
  ignoreFilter?: boolean
}>()

const value = ref<any>(props.multiple ? [] : '')
const fruits = ['Apple', 'Banana', 'Blueberry', 'Grapes', 'Pineapple']
</script>

<template>
  <view>
    <ComboboxRoot
      v-model="value"
      :multiple="props.multiple"
      :disabled="props.disabled"
      :ignore-filter="props.ignoreFilter"
    >
      <ComboboxAnchor>
        <ComboboxInput placeholder="Placeholder..." />
        <ComboboxTrigger accessibility-label="Show options">
          <text>Open</text>
        </ComboboxTrigger>
        <ComboboxCancel>
          <text>Clear</text>
        </ComboboxCancel>
      </ComboboxAnchor>
      <ComboboxContent>
        <ComboboxViewport>
          <ComboboxEmpty>
            <text>No options</text>
          </ComboboxEmpty>
          <ComboboxGroup>
            <ComboboxLabel>
              <text>Fruits</text>
            </ComboboxLabel>
            <ComboboxSeparator />
            <ComboboxItem
              v-for="fruit in fruits"
              :key="fruit"
              :value="fruit"
            >
              <text>{{ fruit }}</text>
              <ComboboxItemIndicator>
                <text>x</text>
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxRoot>
    <OverlayRoot />
  </view>
</template>
