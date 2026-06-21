<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import type { ComponentLayer } from '~/composables/useNavigation'

// The second header row: curated category tabs (Getting Started, Components,
// Composables, Styling) — each with an icon and an underline-active indicator.
// When the Components tab is active, a small Core/Kit sub-filter sits beside it.
// Sticky directly under <AppHeader>, only shown on documentation routes.
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const route = useRoute()

const { categoryLinks, isComponents, layer } = useNavigation(navigation!)

const layerOptions: { label: string, value: ComponentLayer }[] = [
  { label: 'All', value: 'all' },
  { label: 'Core', value: 'core' },
  { label: 'Kit', value: 'kit' },
]

// Reset to All when leaving the Components tab so it doesn't persist hidden.
watch(isComponents, (active) => {
  if (!active)
    layer.value = 'all'
})

// Hidden on the landing page; shown across the docs.
const visible = computed(() => route.path !== '/' && categoryLinks.value.length > 0)
</script>

<template>
  <div
    v-if="visible"
    class="sticky top-(--ui-header-height) z-40 hidden lg:block bg-default/75 backdrop-blur border-b border-default"
  >
    <UContainer class="flex items-center gap-3">
      <UNavigationMenu
        :items="categoryLinks"
        variant="link"
        highlight
        class="-mb-px"
        :ui="{ linkLabel: 'font-medium' }"
      />

      <div
        v-if="isComponents"
        class="flex items-center gap-1 rounded-full bg-elevated/60 p-0.5"
      >
        <button
          v-for="option in layerOptions"
          :key="option.value"
          type="button"
          class="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
          :class="layer === option.value
            ? 'bg-default text-highlighted shadow-sm'
            : 'text-muted hover:text-default'"
          @click="layer = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </UContainer>
  </div>
</template>
