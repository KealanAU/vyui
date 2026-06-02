<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { OverlayRoot } from '@vyui/core'
import { useColorMode, VyCard, VyColorModeSwitch, VyTabs } from '@vyui/kit'
import ThemeSection from './sections/ThemeSection.vue'
import FormSection from './sections/FormSection.vue'
import DisplaySection from './sections/DisplaySection.vue'
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

// Dark mode = toggle the `.dark` class on the root <view>. Every @vyui/kit
// component reads semantic tokens (`bg-default` / `text-muted` / …) whose CSS
// vars flip under `.dark` (see @vyui/kit `style.css`), so this one class swaps
// the whole tree — same mechanism as the palette pickers above. `VyColorModeSwitch`
// in the header flips this shared store; we bind it to the root class here.
const { isDark, style: colorModeStyle } = useColorMode()

// Root inline style: radius var + dark-mode var overrides. On Lynx the dark
// vars MUST ride inline `:style` (not the `.dark` class) to propagate live.
const rootStyle = computed(() => ({
  '--ui-radius': `${radius.value}rem`,
  ...colorModeStyle.value,
}))

// One `${color}-${palette}` class per entry (defined in index.css), plus the
// neutral class — a flat `string[]` so it satisfies the Lynx `<view>` class
// type (which rejects nested arrays). Applied to the root so every @vyui/kit
// component below picks up the swapped ramps.
const rootClass = computed(() => [
  'w-full h-full bg-default',
  ...Object.entries(colorPalettes).map(([color, palette]) => `${color}-${palette}`),
  `neutral-${neutralPalette.value}`,
].join(' '))

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
    :class="rootClass"
    :style="rootStyle"
  >
    <OverlayRoot />

    <scroll-view class="w-full h-full" scroll-orientation="vertical">
      <view class="flex flex-col gap-4 px-5 pt-16 pb-10">
        <view class="flex flex-row items-center justify-between gap-3">
          <view class="flex flex-col gap-1 min-w-0">
            <text class="text-highlighted text-2xl font-bold">@vyui/kit demo</text>
            <text class="text-muted text-sm">Styled components on top of @vyui/core primitives.</text>
          </view>
          <VyColorModeSwitch size="lg" />
        </view>

        <!-- Dark-mode flip check: whole surfaces swap. Outline/soft sit on
             `bg-default`/`bg-muted` (light→dark); solid is `bg-inverted`
             (dark→light) — they move in opposite directions, so a working
             toggle is unmistakable. -->
        <view class="flex flex-row gap-3">
          <VyCard variant="outline" class="flex-1">
            <template #header>
              <text class="text-highlighted text-sm font-semibold">Outline</text>
            </template>
            <text class="text-muted text-xs">bg-default · border-default</text>
          </VyCard>
          <VyCard variant="soft" class="flex-1">
            <template #header>
              <text class="text-highlighted text-sm font-semibold">Soft</text>
            </template>
            <text class="text-muted text-xs">bg-muted surface</text>
          </VyCard>
          <VyCard variant="solid" class="flex-1">
            <template #header>
              <text class="text-inverted text-sm font-semibold">Solid</text>
            </template>
            <text class="text-inverted text-xs">bg-inverted surface</text>
          </VyCard>
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

          <template #island>
            <IslandSection />
          </template>

          <template #overlay>
            <OverlaySection />
          </template>
        </VyTabs>

        <view class="flex flex-col items-center pt-4 pb-2">
          <text class="text-dimmed text-xs">@vyui/kit · Vue-Lynx · Tailwind v3</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>
