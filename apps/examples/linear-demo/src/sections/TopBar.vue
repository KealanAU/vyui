<script setup lang="ts">
import { computed } from 'vue'
import { VyIsland } from '@vyui/kit'
import NewIssueDrawer from '../components/NewIssueDrawer.vue'
import AccountMenu from '../components/AccountMenu.vue'

// Open state and draft state are owned by the drawer + menu themselves —
// this section is purely layout.
const props = defineProps<{ landscape?: boolean }>()

// Landscape has no tall status bar to clear and far less height to spare, so
// pin the island closer to the top edge to free up feed space.
const topOffset = computed(() => props.landscape ? '12px' : '49px')
</script>

<template>
  <!-- Single island, pinned via inline style. We skip VyIslandGroup since
       there's only one — pinning the island itself lets us offset it from
       the top-right corner exactly. Adjust `top` / `right` here to nudge. -->
  <VyIsland
    layer="inline"
    size="sm"
    :style="{
      position: 'fixed',
      top: topOffset,
      right: '12px',
      zIndex: 50,
    }"
  >
    <NewIssueDrawer />
    <AccountMenu />
  </VyIsland>
</template>
