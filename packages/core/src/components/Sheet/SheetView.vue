<!-- Copyright 2026 The Lynx Authors. All rights reserved. -->
<!-- Content body inside SheetContent. v1 is a thin wrapper; SheetView exists
     so apps can opt into scroll-view or other layout containers later. -->
<script setup lang="ts">
</script>

<template>
  <view
    class="vyui-sheet__view"
    data-vyui-sheet-view
    :style="{ flex: 1, display: 'flex', flexDirection: 'column' }"
  >
    <slot />
  </view>
</template>
