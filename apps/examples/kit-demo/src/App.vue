<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { runOnBackground } from 'vue-lynx'
import { OverlayRoot } from '@vyui/core'
import { VyTabs } from '@vyui/kit'
import ThemeSection from './sections/ThemeSection.vue'
import FormSection from './sections/FormSection.vue'
import DisplaySection from './sections/DisplaySection.vue'
import GesturesSection from './sections/GesturesSection.vue'
import FeedListSection from './sections/FeedListSection.vue'
import ScrollViewSection from './sections/ScrollViewSection.vue'
import IslandSection from './sections/IslandSection.vue'
import OverlaySection from './sections/OverlaySection.vue'

// Each configurable semantic color → the Tailwind palette it currently renders
// as. Lifted here so they drive the root `<view>` class; `ThemeSection` mutates
// the entries via its swatch pickers. `tertiary` is a custom color added via
// the "add a color" flow (see index.ts / tailwind.config.ts / index.css).
const colorPalettes = reactive<Record<string, string>>({
  primary: 'green',
  secondary: 'blue',
  success: 'teal',
  info: 'violet',
  warning: 'amber',
  error: 'rose',
  tertiary: 'pink',
})
const neutralPalette = ref<string>('slate')
const radius = ref<number>(0.25)
const isLandscape = ref(false)

function updateViewport(width: number, height: number): void {
  isLandscape.value = width > height
}

function onViewportLayoutChange(event: any): void {
  'main thread'
  const width = event?.detail?.width ?? event?.params?.width
  const height = event?.detail?.height ?? event?.params?.height
  if (typeof width === 'number' && typeof height === 'number') {
    runOnBackground(updateViewport as any)(width, height)
  }
}

// One `${color}-${palette}` class per entry (defined in index.css), plus the
// neutral class — a flat `string[]` so it satisfies the Lynx `<view>` class
// type (which rejects nested arrays). Applied to the root so every @vyui/kit
// component below picks up the swapped ramps.
const rootClass = computed(() => [
  'w-full h-full bg-slate-50',
  ...Object.entries(colorPalettes).map(([color, palette]) => `${color}-${palette}`),
  `neutral-${neutralPalette.value}`,
].join(' '))

const tab = ref<string | number>('theme')
const allTabItems = [
  { value: 'theme',   label: 'Theme', icon: 'icon-park-outline:paint',            slot: 'theme' },
  { value: 'form',    label: 'Form',  icon: 'icon-park-outline:edit',             slot: 'form' },
  { value: 'display', label: 'View',  icon: 'icon-park-outline:layers',           slot: 'display' },
  { value: 'gestures', label: 'Gestures', icon: 'icon-park-outline:hand-up',      slot: 'gestures' },
  { value: 'feed',    label: 'Feed',  icon: 'icon-park-outline:list-two',         slot: 'feed' },
  { value: 'scroll',  label: 'Scroll', icon: 'icon-park-outline:swipe',           slot: 'scroll' },
  { value: 'island',  label: 'Island', icon: 'icon-park-outline:pill',            slot: 'island' },
  { value: 'overlay', label: 'Modal', icon: 'icon-park-outline:application-menu', slot: 'overlay' },
]
const tabItems = computed(() => allTabItems)

// Tabs whose content is itself a gesture surface or its own scroller (a native
// `<list>` / bounce `<scroll-view>`). The outer page `<scroll-view>` consumes
// the vertical touch/pan stream for its own scrolling, which starves those
// inner gestures (drag-to-reorder, swipe rows, pull a list) — the symptom is
// "the whole page scrolls instead of the thing under my finger". For these tabs
// we disable the outer scroll so the inner surface owns the gesture.
const FULL_BLEED_TABS = ['gestures', 'feed', 'scroll']
const pageScrolls = computed(() => !FULL_BLEED_TABS.includes(String(tab.value)))
const pageClass = computed(() => {
  if (isLandscape.value) {
    return pageScrolls.value
      ? 'flex flex-col w-full min-h-[100dvh] p-3'
      : 'flex flex-col w-full h-[100dvh] min-h-0 p-3'
  }
  return pageScrolls.value
    ? 'flex flex-col gap-4 px-5 pt-16 pb-10'
    : 'flex flex-col w-full h-[100dvh] min-h-0 gap-2 px-3 pt-2 pb-2'
})
const tabsUi = computed(() => {
  if (isLandscape.value) {
    // Vertical rail (fixed width, pinned to the top via `self-start`) + content
    // filling the rest of the width. A scrolling tab lets the whole rail+content
    // block grow past the viewport (the outer `<scroll-view>` owns the scroll);
    // a full-bleed tab caps to the viewport so its inner surface owns gestures.
    return {
      root: pageScrolls.value ? 'min-h-[calc(100dvh-1.5rem)]' : 'flex-1 min-h-0',
      list: 'w-36 shrink-0 self-start',
      content: pageScrolls.value
        ? 'flex-1 min-w-0 ps-3'
        : 'flex-1 min-w-0 min-h-0 ps-3 overflow-hidden',
    }
  }
  return pageScrolls.value
    ? {}
    : {
        root: 'flex-1 min-h-0',
        content: 'flex-1 min-h-0 overflow-hidden',
      }
})

// ActionSheet header trigger removed for now: ActionSheet wraps the core
// `Sheet*` primitives whose main-thread worklet currently throws "cannot read
// property 'bind' of undefined" (see SheetContent.vue header and wip commit
// 1403a97). Restore the trigger once the MT worklet target is sorted.
</script>

<template>
  <view
    :class="rootClass"
    :style="{ '--ui-radius': `${radius}rem` }"
    :main-thread-bindlayoutchange="onViewportLayoutChange"
  >
    <OverlayRoot />

    <!-- Swap the outer element by tab rather than toggling `enable-scroll` on a
         single instance: a content tab gets a real (scrolling) `<scroll-view>`;
         a full-bleed tab gets a plain non-scrolling `<view>` so its inner
         gesture surface / native `<list>` / bounce `<scroll-view>` owns the
         touch stream. Swapping the element type forces a fresh mount, avoiding
         a `<scroll-view>` getting stuck non-scrollable after a prop flip. -->
    <component
      :is="pageScrolls ? 'scroll-view' : 'view'"
      class="w-full h-full min-h-0"
      scroll-orientation="vertical"
    >
      <view :class="pageClass">
        <view v-if="pageScrolls && !isLandscape" class="flex flex-col gap-1">
          <text class="text-slate-900 text-2xl font-bold">@vyui/kit demo</text>
          <text class="text-slate-500 text-sm">Styled components on top of @vyui/core primitives.</text>
        </view>

        <VyTabs
          v-model="tab"
          :items="tabItems"
          variant="pill"
          size="sm"
          :orientation="isLandscape ? 'vertical' : 'horizontal'"
          :direction="isLandscape || !pageScrolls ? 'inline' : 'stacked'"
          :ui="tabsUi"
        >
          <template #theme>
            <ThemeSection
              v-model:color-palettes="colorPalettes"
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

          <template #gestures>
            <GesturesSection />
          </template>

          <template #feed>
            <FeedListSection />
          </template>

          <template #scroll>
            <ScrollViewSection />
          </template>

          <template #island>
            <IslandSection />
          </template>

          <template #overlay>
            <OverlaySection />
          </template>
        </VyTabs>

        <view v-if="pageScrolls && !isLandscape" class="flex flex-col items-center pt-4 pb-2">
          <text class="text-slate-400 text-xs">@vyui/kit · Vue-Lynx · Tailwind v3</text>
        </view>
      </view>
    </component>
  </view>
</template>
