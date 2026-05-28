<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VyIsland,
  VyIslandButton,
  VyIslandGroup,
} from '@vyui/kit'
import AiChatDrawer from '../components/AiChatDrawer.vue'

// Active tab is owned by the parent so it can swap the page contents (inbox
// vs notifications). Mode stays local — drives row morphing (default →
// search takeover) and doesn't affect routing.
const tab = defineModel<string | number | null>('tab', { default: 'inbox' })
const dockMode = ref<string>('default')
const dockOpen = ref<boolean>(false)

// Search takes over the bar (full viewport width). The actions dropup keeps
// the dock at its natural width and just sprouts a same-width panel above
// it. AI pill is hidden in either case so the takeover (or the dropup) reads
// as the focused surface.
const isSearchMode = computed(() => dockMode.value === 'fullisland')
const isTakeover = computed(() => isSearchMode.value || dockOpen.value)
</script>

<template>
  <!-- See TopBar.vue for the inline-style rationale — Lynx ignores tailwind
       `fixed` on IslandGroup so we pin via inline `style` instead. The `gap-2`
       :ui override tightens spacing between the main dock and trailing AI
       pill (default `lg` group gap reads as too airy here). -->
  <VyIslandGroup
    position="inline"
    size="lg"
    :ui="{ root: 'gap-2' }"
    :style="{
      position: 'fixed',
      bottom: '16px',
      left: '0',
      right: '0',
      zIndex: 50,
      justifyContent: 'center',
    }"
  >
    <VyIsland
      v-model:mode="dockMode"
      v-model:value="tab"
      v-model:open="dockOpen"
      position="inline"
      size="lg"
      expand-style="attached"
      :style="isSearchMode
        ? { flexGrow: 1, marginLeft: '16px', marginRight: '16px' }
        : undefined"
    >
      <VyIslandButton value="inbox"     icon="icon-park-outline:inbox-in" />
      <VyIslandButton mode="fullisland" icon="icon-park-outline:search" />
      <VyIslandButton value="bell"      icon="icon-park-outline:remind" />
      <VyIslandButton :expand="true" icon="icon-park-outline:expand-text-input" />

      <template #fullisland>
        <!-- Search pill stretches to fill the (now full-width) island; the
             close pill stays icon-sized so the row reads as "input + X". -->
        <VyIslandButton
          reset
          icon="icon-park-outline:search"
          label="Search issues…"
          :style="{ flexGrow: 1, justifyContent: 'flex-start' }"
        />
        <VyIslandButton reset icon="icon-park-outline:close" />
      </template>

      <template #expanded>
        <!-- Dropup menu — panel renders above the row (island default for
             non-`top` position). Each item dismisses the panel via `expand`,
             which toggles `open` (currently true → closes). Width follows the
             panel min-w override above; items left-align so labels read as a
             vertical list rather than centered chips. -->
        <VyIslandButton
          :expand="true"
          icon="icon-park-outline:add"
          label="New issue"
          class="w-full justify-start"
        />
        <VyIslandButton
          :expand="true"
          icon="icon-park-outline:filter"
          label="Filter"
          class="w-full justify-start"
        />
        <VyIslandButton
          :expand="true"
          icon="icon-park-outline:setting"
          label="Settings"
          class="w-full justify-start"
        />
      </template>
    </VyIsland>

    <!-- Trailing companion island: standalone AI action pill. `px-0` drops the
         horizontal padding so the chrome hugs the single 56px button (avoids
         the chunky look next to the dense main dock); `py-2` is kept so the
         overall pill height matches the main dock. Hidden in search-takeover
         and while the actions dropup is open so attention stays on the
         focused surface. -->
    <VyIsland
      v-if="!isTakeover"
      position="inline"
      size="lg"
      :ui="{ row: 'px-0 py-2' }"
    >
      <AiChatDrawer />
    </VyIsland>
  </VyIslandGroup>
</template>
