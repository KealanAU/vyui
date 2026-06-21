<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { useWindowScroll } from '@vueuse/core'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { header } = useAppConfig()
const { desktopLinks, mobileLinks } = useHeader()

// Grouped section nav for the mobile menu body. Top-level section tabs live in
// the separate <AppDocsNav> bar below the header.
const { navigationByCategory } = useNavigation(navigation!)

const linkClass = 'hover:bg-transparent! active:bg-transparent! focus-visible:bg-transparent! hover:text-highlighted'

const { y } = useWindowScroll()
const headerStyle = computed(() => {
  const opacity = Math.min(Math.max(y.value - 16, 0) / 96, 1)
  return {
    backgroundColor: `color-mix(in srgb, var(--ui-bg) ${opacity * 100}%, transparent)`,
    boxShadow: opacity > 0
      ? `0 1px 2px 0 rgba(4, 23, 43, ${opacity * 0.04})`
      : 'none',
    transition: 'background-color 200ms ease-out, box-shadow 200ms ease-out',
  }
})
</script>

<template>
  <UHeader
    :to="header?.to || '/'"
    :style="headerStyle"
    :ui="{
      root: 'bg-transparent backdrop-blur-none backdrop-filter-none border-b-0 h-(--ui-header-height) sticky top-0 z-50',
      center: 'hidden lg:flex items-center',
    }"
  >
    <template #title>
      <span class="inline-flex items-center gap-2">
        <AppLogo />
        <span
          class="badge-aurora text-(--color-ink) inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-tight"
        >
          pre-alpha
        </span>
      </span>
    </template>

    <UNavigationMenu
      :items="desktopLinks"
      variant="link"
      :ui="{
        link: linkClass,
        linkLabel: 'font-medium',
      }"
    />

    <template #right>
      <UColorModeButton
        v-if="header?.colorMode"
        :class="linkClass"
      />

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
          :class="linkClass"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu
        :items="mobileLinks"
        orientation="vertical"
        class="-mx-2.5"
      />

      <USeparator class="my-4" />

      <UContentNavigation
        highlight
        :navigation="navigationByCategory"
      />
    </template>
  </UHeader>
</template>
