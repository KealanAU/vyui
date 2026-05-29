<script setup lang="ts">
const features = [
  {
    icon: 'i-lucide-box',
    title: '@vyui/core — Headless',
    description: '47 behavioral primitives — Dialog, Sheet, Popover, Combobox, Slider, Swiper, Sortable, and more. State, focus, keyboard, gestures. You bring the styles.',
  },
  {
    icon: 'i-lucide-layers',
    title: '@vyui/kit — Styled',
    description: '44 styled components on top of @vyui/core — VyButton, VyDrawer, VyModal, VyToast, VyIsland, and more. Themeable via Tailwind Variants and an app-config object.',
  },
  {
    icon: 'i-lucide-blocks',
    title: 'Mix them freely',
    description: 'Kit re-exports everything you need from core. Start with kit, drop down to primitives anywhere you need bespoke styling.',
  },
]
</script>

<template>
  <UPageSection
    class="border-t border-default"
    title="Two layers, one ecosystem"
    description="Pick the level of opinion you want. Drop down to primitives whenever you need to."
    :features="features"
  />
</template>
