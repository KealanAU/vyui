<script setup lang="ts">
const features = [
  {
    icon: 'i-simple-icons-apple',
    title: 'iOS',
    description: 'Native UIView rendering via Lynx Explorer or your own LynxView host.',
  },
  {
    icon: 'i-simple-icons-android',
    title: 'Android',
    description: 'Native View rendering — ship inside your Android app via the Lynx runtime.',
  },
  {
    icon: 'i-lucide-globe',
    title: 'Web',
    description: 'Lynx Web target compiles to a browser bundle. Full event parity with native (tap/hover vs click) is on the roadmap.',
  },
]
</script>

<template>
  <UPageSection
    class="border-t border-default"
    title="One codebase, three targets"
    description="Vue-Lynx is ByteDance's open-source native cross-platform framework — the same one powering parts of TikTok."
    :features="features"
  />
</template>
