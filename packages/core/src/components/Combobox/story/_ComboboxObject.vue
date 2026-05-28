<script setup lang="ts">
import { ref } from 'vue'
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from '..'
import { OverlayRoot } from '../../OverlayRoot'

const props = defineProps<{
  displayValue?: (val: any) => string
}>()

const value = ref<any>(null)
const people = [
  { id: 1, name: 'Durward Reynolds' },
  { id: 2, name: 'Kenton Towne' },
  { id: 3, name: 'Therese Wunsch' },
]
</script>

<template>
  <view>
    <ComboboxRoot v-model="value">
      <ComboboxAnchor>
        <ComboboxInput
          placeholder="Placeholder..."
          :display-value="props.displayValue"
        />
        <ComboboxTrigger accessibility-label="Show options">
          <text>Open</text>
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxContent>
        <ComboboxViewport>
          <ComboboxItem
            v-for="person in people"
            :key="person.id"
            :value="person"
            :text-value="person.name"
          >
            <text>{{ person.name }}</text>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxRoot>
    <OverlayRoot />
  </view>
</template>
