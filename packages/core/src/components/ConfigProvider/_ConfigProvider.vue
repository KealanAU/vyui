<script setup lang="ts">
import type { ConfigProviderProps } from './ConfigProvider.vue'
import DropdownMenu from '../DropdownMenu/story/_DropdownMenu.vue'
import ConfigProvider from './ConfigProvider.vue'

const props = defineProps<ConfigProviderProps>()
</script>

<template>
  <ConfigProvider v-bind="props">
    <DropdownMenu :default-open="true" />
  </ConfigProvider>
</template>
