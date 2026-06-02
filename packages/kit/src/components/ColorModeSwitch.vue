<script lang="ts">
import type { SwitchProps } from './Switch.vue'

/**
 * A {@link Switch} pre-wired to {@link useColorMode}. Inherits the full Switch
 * API except `modelValue` (driven by color mode) and the thumb icons (sourced
 * from `appConfig.ui.icons.light` / `.dark`).
 *
 * Note (Lynx): this only flips the shared color-mode store. For the UI to
 * actually change, the consuming app must bind `useColorMode().isDark` to its
 * root `<view>` class (`'dark'`) — see `useColorMode` docs. There is no global
 * document class to toggle.
 */
export interface ColorModeSwitchProps extends Omit<SwitchProps, 'modelValue' | 'checkedIcon' | 'uncheckedIcon'> {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import VySwitch from './Switch.vue'
import { useColorMode } from '../composables/useColorMode'
import { useAppConfig } from '../composables/useAppConfig'

const props = defineProps<ColorModeSwitchProps>()

const { isDark } = useColorMode()
const appConfig = useAppConfig()

const checkedIcon = computed(() => appConfig.ui.icons?.dark || 'i-lucide-moon')
const uncheckedIcon = computed(() => appConfig.ui.icons?.light || 'i-lucide-sun')
</script>

<template>
  <VySwitch
    v-bind="props"
    v-model="isDark"
    :checked-icon="checkedIcon"
    :unchecked-icon="uncheckedIcon"
  />
</template>
