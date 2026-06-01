<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from '.'
</script>

<template>
  <Story
    title="Avatar/Demo"
    :layout="{ type: 'single', iframe: true }"
  >
    <Variant title="With image">
      <AvatarRoot class="inline-flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-black/20">
        <AvatarImage src="https://github.com/vuejs.png" />
        <AvatarFallback class="text-white text-sm">
          <text>VU</text>
        </AvatarFallback>
      </AvatarRoot>
    </Variant>

    <Variant title="Fallback (no src)">
      <AvatarRoot class="inline-flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-black/20">
        <AvatarImage />
        <AvatarFallback class="text-white text-sm">
          <text>AB</text>
        </AvatarFallback>
      </AvatarRoot>
    </Variant>

    <Variant title="Fallback (broken src) with delay">
      <AvatarRoot class="inline-flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-black/20">
        <AvatarImage src="https://example.com/does-not-exist.png" />
        <AvatarFallback :delay-ms="600" class="text-white text-sm">
          <text>CD</text>
        </AvatarFallback>
      </AvatarRoot>
    </Variant>
  </Story>
</template>
