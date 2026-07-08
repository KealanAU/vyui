<script lang="ts">
import theme from '../theme/app'
import type { ThemeTV } from '../composables/useStyledComponent'
import type { ColorMode } from '../composables/useColorMode'

type AppTV = ThemeTV<typeof theme>

export interface AppProps {
  /**
   * Mount the overlay host (`OverlayRoot`) as the first child of the root so
   * teleported surfaces (Modal, Tray, Toast, …) work without hand-wiring.
   * Opt out when placing `<OverlayRoot />` yourself.
   * @defaultValue true
   */
  overlays?: boolean
  /**
   * Corner radius in rem — sets `--ui-radius` on the root. Omit to keep the
   * `@vyui/kit/style.css` default.
   */
  radius?: number
  class?: any
  ui?: Partial<Record<keyof AppTV['slots'], any>>
}

export interface AppEmits {
  /**
   * Root layout size, from the background-thread `layoutchange` event — fires
   * on mount and whenever the root resizes (rotation, split screen). Replaces
   * hand-wiring a binding on the root; `main-thread-*` attrs do not reliably
   * fall through onto it.
   */
  (e: 'viewport-change', size: { width: number, height: number }): void
}

export interface AppSlots {
  default(props: { mode: ColorMode, isDark: boolean }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { OverlayRoot } from '@vyui/core'
import { useColorMode } from '../composables/useColorMode'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<AppProps>(), {
  overlays: true,
})
const emit = defineEmits<AppEmits>()
defineSlots<AppSlots>()

// Consumes the module singleton — a toggle anywhere in the tree (calling the
// same `useColorMode()`) re-skins the whole app through this root.
const { mode, isDark } = useColorMode()

const { ui } = useStyledComponent('app', theme, () => ({}))

// String form — the Lynx view style type has no custom-property index key.
const rootStyle = computed(() =>
  props.radius !== undefined ? `--ui-radius: ${props.radius}rem` : undefined,
)

function onLayoutChange(event: any): void {
  const width = event?.detail?.width ?? event?.params?.width
  const height = event?.detail?.height ?? event?.params?.height
  if (typeof width === 'number' && typeof height === 'number')
    emit('viewport-change', { width, height })
}
</script>

<template>
  <view
    :key="mode"
    :class="ui.root({ class: [isDark ? 'dark' : undefined, props.class, props.ui?.root] })"
    :style="rootStyle"
    @layoutchange="onLayoutChange"
  >
    <!--
      This root <view> owns the app-root contract documented on `useColorMode`:
      the single `dark` class (custom-property inheritance flows the dark ramp
      to every descendant) plus the `:key="mode"` remount (Lynx native applies
      class changes only to freshly mounted nodes). Encapsulated here so the
      mechanism can change (e.g. a seamless setNativeProps toggle) without
      consumer churn. A template-root comment would compile to a sibling vnode
      and turn the component into a fragment, so it lives inside the view.
      OverlayRoot must live INSIDE this view: teleported overlay content
      inherits the palette/dark tokens from it and must be covered by the
      remount.
    -->
    <OverlayRoot v-if="overlays" />
    <slot :mode="mode" :is-dark="isDark" />
  </view>
</template>
