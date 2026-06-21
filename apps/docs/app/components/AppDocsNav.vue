<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

// The second header row: curated category tabs (Getting Started, Components,
// Composables, Styling) — each with an icon and an underline-active indicator.
// Sticky directly under <AppHeader>, only shown on documentation routes.
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const route = useRoute()

const { categoryLinks } = useNavigation(navigation!)

// Hidden on the landing page; shown across the docs.
const visible = computed(() => route.path !== '/' && categoryLinks.value.length > 0)
</script>

<template>
  <div
    v-if="visible"
    class="sticky top-(--ui-header-height) z-40 hidden lg:block bg-default/75 backdrop-blur border-b border-default"
  >
    <UContainer class="flex items-center">
      <UNavigationMenu
        :items="categoryLinks"
        variant="link"
        highlight
        class="-mb-px"
        :ui="{ linkLabel: 'font-medium' }"
      />
    </UContainer>
  </div>
</template>
