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
    icon: 'i-lucide-terminal',
    title: '@vyui/cli — Own the code',
    description: 'shadcn-style CLI. vyui add button copies the styled component source into your project — you own and edit it, while headless @vyui/core stays an npm dependency.',
  },
]
</script>

<template>
  <UPageSection
    class="features-wash border-t border-default"
    title="Two layers, one ecosystem"
    description="Pick the level of opinion you want, and mix them freely — import styled Vy* components from the kit and reach for raw @vyui/core primitives in the same file wherever you need bespoke styling."
    :features="features"
  />
</template>

<style scoped>
/* Carries the hero's green wash down over the seam so the two sections read as
   one surface. Same recipe as .hero-beams::after, pulled to the top edge. */
.features-wash {
  position: relative;
  isolation: isolate;
}

.features-wash::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    ellipse 70% 55% at 50% 0%,
    color-mix(in srgb, var(--color-vue-200) 32%, transparent),
    transparent 70%
  );
}

.dark .features-wash::before {
  background: radial-gradient(
    ellipse 70% 55% at 50% 0%,
    color-mix(in srgb, var(--color-vue-300) 9%, transparent),
    transparent 70%
  );
}
</style>
