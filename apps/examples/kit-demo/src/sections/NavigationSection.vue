<script setup lang="ts">
import { ref } from 'vue'
import { VyAccordion, VyTabs } from '@vyui/kit'

const accordionOpen = ref<string | number>('q1')
const accordionItems = [
  { value: 'q1', label: 'What is Vy UI?',           content: 'A styled component library for Vue-Lynx, modelled on Nuxt UI v3.' },
  { value: 'q2', label: 'Which engine does it run?', content: 'Lynx runs PrimJS natively and renders via a Vue-Lynx bridge.' },
  { value: 'q3', label: 'Does it support theming?',  content: 'Yes — semantic colors are wired through CSS variables.' },
]

const innerTab = ref<string | number>('overview')
const innerTabItems = [
  { value: 'overview', label: 'Overview', icon: 'icon-park-outline:list-view',    slot: 'overview' },
  { value: 'specs',    label: 'Specs',    icon: 'icon-park-outline:doc-detail',   slot: 'specs' },
  { value: 'reviews',  label: 'Reviews',  icon: 'icon-park-outline:comments',     slot: 'reviews' },
]
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- Accordion -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Accordion</text>
      <VyAccordion v-model="accordionOpen" :items="accordionItems" type="single" />
    </view>

    <!-- Tabs (nested) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Tabs (pill variant)</text>
      <VyTabs v-model="innerTab" :items="innerTabItems" variant="pill" size="sm">
        <template #overview>
          <text class="text-slate-700 text-sm pt-3">High-level overview of the product.</text>
        </template>
        <template #specs>
          <text class="text-slate-700 text-sm pt-3">Technical specifications and dimensions.</text>
        </template>
        <template #reviews>
          <text class="text-slate-700 text-sm pt-3">Customer feedback and ratings.</text>
        </template>
      </VyTabs>
    </view>
  </view>
</template>
