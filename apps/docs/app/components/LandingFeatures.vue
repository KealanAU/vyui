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
    description: '47 styled components on top of @vyui/core — VyButton, VyDrawer, VyModal, VyToast, VyIsland, and more. Themeable via Tailwind Variants and an app-config object.',
  },
  {
    icon: 'i-lucide-blocks',
    title: 'Mix them freely',
    description: 'Import styled Vy* components from kit and reach for raw @vyui/core primitives in the same file wherever you need bespoke styling.',
  },
  {
    icon: 'i-lucide-terminal',
    title: '@vyui/cli — Own the code',
    description: 'shadcn-style CLI. vyui add button copies the styled component source into your project — you own and edit it, while headless @vyui/core stays an npm dependency.',
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
