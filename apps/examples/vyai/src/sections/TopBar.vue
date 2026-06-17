<script setup lang="ts">
import { VyIsland, VyIslandButton } from '@vyui/kit'
import { useChat } from '../composables/useChat'
import { useDrawer } from '../composables/useDrawer'

const { newChat } = useChat()
const { toggle: toggleDrawer } = useDrawer()
</script>

<template>
  <!-- Burger pill, pinned top-left — slides the app over to reveal the
       under-sheet menu (see App.vue). These islands are fixed inside the
       sliding shell, so they travel with it when it opens. -->
  <VyIsland
    layer="inline"
    size="sm"
    :ui="{ row: 'vyai-float' }"
    :style="{ position: 'fixed', top: '40px', left: '12px', zIndex: 50 }"
  >
    <VyIslandButton icon="i-tabler-menu-2" @tap="toggleDrawer" />
  </VyIsland>

  <!-- New-chat pill, pinned top-right. -->
  <VyIsland
    layer="inline"
    size="sm"
    :ui="{ row: 'vyai-float' }"
    :style="{ position: 'fixed', top: '40px', right: '12px', zIndex: 50 }"
  >
    <VyIslandButton icon="i-tabler-edit" @tap="newChat" />
  </VyIsland>
</template>
