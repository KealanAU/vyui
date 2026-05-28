<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Install', to: '#install' },
  { label: 'Packages', to: '#packages' },
  { label: 'Theming', to: '#theming' },
  { label: 'Icons', to: '#icons' },
  { label: 'Roadmap', to: '#roadmap' },
  { label: 'GitHub', to: 'https://github.com/KealanAU/vyui', target: '_blank' },
])
</script>

<template>
  <UApp>
    <UBanner
      id="prealpha-banner"
      icon="i-lucide-flask-conical"
      color="warning"
      title="Vy UI is pre-alpha. Vue-Lynx is pre-alpha. APIs will change. Not production-ready."
      close
    />

    <UHeader>
      <template #title>
        <span class="inline-flex items-center gap-2">
          <span class="inline-flex size-6 items-center justify-center rounded-md bg-primary text-inverted font-semibold">
            V
          </span>
          <span class="text-lg font-semibold tracking-tight">Vy UI</span>
        </span>
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UColorModeButton />
        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/KealanAU/vyui"
          target="_blank"
          aria-label="GitHub"
        />
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-muted text-sm">
          MIT &copy; {{ new Date().getFullYear() }} &middot; Built for Vue-Lynx
        </p>
      </template>
      <template #right>
        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/KealanAU/vyui"
          target="_blank"
        />
        <UButton
          icon="i-lucide-book-open"
          color="neutral"
          variant="ghost"
          to="https://lynxjs.org"
          target="_blank"
        />
      </template>
    </UFooter>
  </UApp>
</template>
