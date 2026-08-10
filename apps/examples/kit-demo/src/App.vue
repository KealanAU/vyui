<script setup lang="ts">
import { computed, provide, reactive, ref } from 'vue'
import { runOnBackground } from 'vue-lynx'
import { OverlayRoot } from '@vyui/core'
import { APP_CONFIG_KEY, type AppConfig, useAppConfig, useColorMode, VyButton, VyTabs } from '@vyui/kit'
import SectionScroll from './sections/SectionScroll.vue'
import ThemeSection from './sections/ThemeSection.vue'
import DarkModeSection from './sections/DarkModeSection.vue'
import FormSection from './sections/FormSection.vue'
import DisplaySection from './sections/DisplaySection.vue'
import GesturesSection from './sections/GesturesSection.vue'
import SwipeDeckSection from './sections/SwipeDeckSection.vue'
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

// Baked icon fills (toast icon, Select/Combobox selection tick) resolve their
// hex from `appConfig.ui.*` — unlike class-based `text-primary-*`, an <svg>
// can't read the CSS var the root palette classes swap at runtime. Re-provide
// the config with the swatches as live getters so those baked colors track the
// theme too. Identity stays stable, so the tv factory cache isn't invalidated.
const themeConfig = reactive({
  ui: {
    ...useAppConfig().ui,
    get primary() { return colorPalettes.primary },
    get secondary() { return colorPalettes.secondary },
    get success() { return colorPalettes.success },
    get info() { return colorPalettes.info },
    get warning() { return colorPalettes.warning },
    get error() { return colorPalettes.error },
    get tertiary() { return colorPalettes.tertiary },
    get gray() { return neutralPalette.value },
  },
}) as AppConfig
provide(APP_CONFIG_KEY, themeConfig)
const isLandscape = ref(false)

// App-level color mode. The singleton drives the root `<view>` (below), so a
// toggle anywhere flips the WHOLE app. `mode` values order: light | dark | system.
const { mode, isDark, setMode } = useColorMode()
const modeItems = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const

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
//
// The PAGE rides `bg-default` (the base surface token): white in light,
// slate-900 in dark. It flips on its own — no `dark:` needed — because the
// single `dark` class appended below flips every semantic `--ui-*` token in the
// tree at once (see `@vyui/kit/style.css`). The `neutral-${palette}` swatch only
// re-tints the fixed ramp + neutral `solid` fill; the semantic tokens stay slate.
const rootClass = computed(() => [
  'w-full h-full bg-default',
  ...Object.entries(colorPalettes).map(([color, palette]) => `${color}-${palette}`),
  `neutral-${neutralPalette.value}`,
  ...(isDark.value ? ['dark'] : []),
].join(' '))

const tab = ref<string | number>('theme')
// The gesture tabs (Gestures / Swipe / Scroll) opt back into unmounting: their
// sections write styles from MT worklets (`setStyleProperty`,
// `animate(fill: 'forwards')`), which land on the native style object and keep
// painting through the kept-alive `display: none` on device — ghost cards over
// other tabs. Content tabs stay kept-alive.
const tabItems = [
  { value: 'theme',   label: 'Theme', icon: 'icon-park-outline:paint',            slot: 'theme' },
  { value: 'dark',    label: 'Dark',  icon: 'icon-park-outline:moon',             slot: 'dark' },
  { value: 'form',    label: 'Form',  icon: 'icon-park-outline:edit',             slot: 'form' },
  { value: 'display', label: 'View',  icon: 'icon-park-outline:layers',           slot: 'display' },
  { value: 'gestures', label: 'Gestures', icon: 'icon-park-outline:hand-up',      slot: 'gestures', unmountOnHide: true },
  { value: 'swipe',   label: 'Swipe',  icon: 'icon-park-outline:check-one',       slot: 'swipe',    unmountOnHide: true },
  { value: 'scroll',  label: 'Scroll', icon: 'icon-park-outline:swipe',           slot: 'scroll',   unmountOnHide: true },
  { value: 'island',  label: 'Island', icon: 'icon-park-outline:pill',            slot: 'island' },
  { value: 'overlay', label: 'Modal', icon: 'icon-park-outline:application-menu', slot: 'overlay' },
]

const showChrome = computed(() => !isLandscape.value)

// The page itself never scrolls: content tabs bring their own `<scroll-view>`
// (see `SectionScroll.vue`) and gesture tabs own their touch stream directly.
// One stable page element — the previous per-tab `scroll-view`/`view` swap
// remounted the whole tree (header, tab bar, section) on those switches, and
// would now also discard every kept-alive panel.
const pageClass = computed(() =>
  isLandscape.value
    ? 'flex flex-col w-full h-[100vh] min-h-0 p-3'
    : 'flex flex-col gap-4 w-full h-[100vh] min-h-0 px-5 pt-16 pb-6')

// Rail/content sizing only — scrolling is the sections' business.
const tabsUi = computed(() =>
  isLandscape.value
    ? {
        root: 'flex-1 min-h-0',
        list: 'w-36 shrink-0 self-start',
        content: 'flex-1 min-w-0 min-h-0 ps-3 overflow-hidden',
      }
    : {
        root: 'flex-1 min-h-0',
        content: 'flex-1 min-h-0 overflow-hidden',
      })
</script>

<template>
  <view
    :key="mode"
    :class="rootClass"
    :style="{ '--ui-radius': `${radius}rem` }"
    :main-thread-bindlayoutchange="onViewportLayoutChange"
  >
    <OverlayRoot />

    <view :class="pageClass">
      <view v-if="showChrome" class="flex flex-col gap-2">
        <text class="text-highlighted text-2xl font-bold">@vyui/kit demo</text>
        <text class="text-muted text-sm">Styled components on top of @vyui/core primitives.</text>
        <!-- App-root color-mode toggle: flips the WHOLE app (drives the root
             `<view>`'s `dark` class + `:key` remount). -->
        <view class="flex flex-row gap-1 pt-1">
          <VyButton
            v-for="m in modeItems"
            :key="m.value"
            size="xs"
            color="neutral"
            :variant="mode === m.value ? 'solid' : 'soft'"
            :label="m.label"
            @tap="setMode(m.value)"
          />
        </view>
      </view>

      <!-- `unmount-on-hide=false`: a section mounts on first visit and is kept
           (hidden) after, so revisits are a style flip. `defer-content`: the
           trigger/indicator flush lands before the section mount, so the bar
           responds instantly. Content sections scroll themselves via
           `SectionScroll`; gesture tabs (Gestures/Swipe/Scroll) render bare so
           their inner surfaces own the touch stream, and opt back into
           unmounting per-item (see tabItems). -->
      <VyTabs
        v-model="tab"
        :items="tabItems"
        variant="pill"
        size="sm"
        :orientation="isLandscape ? 'vertical' : 'horizontal'"
        :direction="isLandscape ? 'inline' : 'stacked'"
        :ui="tabsUi"
        :unmount-on-hide="false"
        defer-content
      >
        <template #theme>
          <SectionScroll>
            <ThemeSection
              v-model:color-palettes="colorPalettes"
              v-model:neutral-palette="neutralPalette"
              v-model:radius="radius"
            />
          </SectionScroll>
        </template>

        <template #dark>
          <SectionScroll><DarkModeSection /></SectionScroll>
        </template>

        <template #form>
          <SectionScroll><FormSection /></SectionScroll>
        </template>

        <template #display>
          <SectionScroll><DisplaySection /></SectionScroll>
        </template>

        <template #gestures>
          <GesturesSection />
        </template>

        <template #swipe>
          <SwipeDeckSection />
        </template>

        <template #scroll>
          <ScrollViewSection />
        </template>

        <template #island>
          <SectionScroll><IslandSection /></SectionScroll>
        </template>

        <template #overlay>
          <SectionScroll><OverlaySection /></SectionScroll>
        </template>
      </VyTabs>
    </view>
  </view>
</template>
