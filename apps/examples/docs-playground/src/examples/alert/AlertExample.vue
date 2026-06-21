<script setup lang="ts">
import { VyAlert } from '@vyui/kit'
</script>

<template>
  <VyAlert
    title="Update available"
    description="Restart the app to install the latest version."
    icon="i-lucide-download"
    color="info"
    variant="soft"
    class="w-[320px]"
  />
</template>
