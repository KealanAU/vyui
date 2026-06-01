<script setup lang="ts">
import { computed, ref } from 'vue'
import { OverlayRoot } from '@vyui/core'
import { VyTabs } from '@vyui/kit'
import ThemeSection from './sections/ThemeSection.vue'
import FormSection from './sections/FormSection.vue'
import DisplaySection from './sections/DisplaySection.vue'
import IslandSection from './sections/IslandSection.vue'
import OverlaySection from './sections/OverlaySection.vue'

type PaletteName = 'green' | 'rose' | 'blue' | 'violet' | 'amber' | 'teal' | 'pink' | 'orange'
type NeutralName = 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'

// Theme palettes drive the root `<view>` class so they stay lifted here; the
// `ThemeSection` mutates them via `defineModel`.
const primaryPalette = ref<PaletteName>('green')
const secondaryPalette = ref<PaletteName>('blue')
const neutralPalette = ref<NeutralName>('slate')
const radius = ref<number>(0.25)

const tab = ref<string | number>('theme')
const allTabItems = [
  { value: 'theme',   label: 'Theme', icon: 'icon-park-outline:paint',            slot: 'theme' },
  { value: 'form',    label: 'Form',  icon: 'icon-park-outline:edit',             slot: 'form' },
  { value: 'display', label: 'View',  icon: 'icon-park-outline:layers',           slot: 'display' },
  { value: 'island',  label: 'Island', icon: 'icon-park-outline:pill',            slot: 'island' },
  { value: 'overlay', label: 'Modal', icon: 'icon-park-outline:application-menu', slot: 'overlay' },
]
const tabItems = computed(() => allTabItems)

// ActionSheet header trigger removed for now: ActionSheet wraps the core
// `Sheet*` primitives whose main-thread worklet currently throws "cannot read
// property 'bind' of undefined" (see SheetContent.vue header and wip commit
// 1403a97). Restore the trigger once the MT worklet target is sorted.
</script>

<template>
  <view
    :class="[
      'w-full h-full bg-slate-50',
      primaryPalette !== 'green' && `palette-${primaryPalette}`,
      secondaryPalette !== 'blue' && `secondary-${secondaryPalette}`,
      neutralPalette !== 'slate' && `neutral-${neutralPalette}`,
    ]"
    :style="{ '--ui-radius': `${radius}rem` }"
  >
    <OverlayRoot />

    <scroll-view class="w-full h-full" scroll-orientation="vertical">
      <view class="flex flex-col gap-4 px-5 pt-16 pb-10">
        <view class="flex flex-col gap-1">
          <text class="text-slate-900 text-2xl font-bold">@vyui/kit demo</text>
          <text class="text-slate-500 text-sm">Styled components on top of @vyui/core primitives.</text>
        </view>

        <VyTabs
          v-model="tab"
          :items="tabItems"
          variant="pill"
          size="sm"
          direction="stacked"
        >
          <template #theme>
            <ThemeSection
              v-model:primary-palette="primaryPalette"
              v-model:secondary-palette="secondaryPalette"
              v-model:neutral-palette="neutralPalette"
              v-model:radius="radius"
            />
          </template>

          <template #form>
            <FormSection />
          </template>

          <template #display>
            <DisplaySection />
          </template>

          <template #island>
            <IslandSection />
          </template>

          <template #overlay>
            <OverlaySection />
          </template>
        </VyTabs>

        <view class="flex flex-col items-center pt-4 pb-2">
          <text class="text-slate-400 text-xs">@vyui/kit · Vue-Lynx · Tailwind v3</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>
