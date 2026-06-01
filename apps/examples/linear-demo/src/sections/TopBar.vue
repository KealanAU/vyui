<script setup lang="ts">
import { VyIsland } from '@vyui/kit'
import NewIssueDrawer from '../components/NewIssueDrawer.vue'
import AccountMenu from '../components/AccountMenu.vue'

// Open state and draft state are owned by the drawer + menu themselves —
// this section is purely layout.
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
      top: '49px',
      right: '12px',
      zIndex: 50,
    }"
  >
    <NewIssueDrawer />
    <AccountMenu />
  </VyIsland>
</template>
