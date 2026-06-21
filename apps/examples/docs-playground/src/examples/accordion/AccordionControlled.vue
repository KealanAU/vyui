<script setup lang="ts">
import { ref } from 'vue'
import { VyAccordion } from '@vyui/kit'

const items = [
  { value: 'icons', label: 'Icons', content: 'The icon set is resolved automatically.' },
  { value: 'colors', label: 'Colors', content: 'Choose a primary and a neutral color from your theme.' },
  { value: 'components', label: 'Components', content: 'Customize components with the class / ui props.' },
]

const active = ref('colors')
</script>

<template>
  <view class="flex flex-col gap-3 w-[320px]">
    <view class="flex flex-row gap-2">
      <view
        v-for="item in items"
        :key="item.value"
        class="px-3 py-1 rounded-md border border-neutral-200"
        @tap="active = item.value"
      >
        <text class="text-xs text-neutral-700">{{ item.label }}</text>
      </view>
    </view>

    <VyAccordion v-model="active" :collapsible="true" :items="items" />
  </view>
</template>
