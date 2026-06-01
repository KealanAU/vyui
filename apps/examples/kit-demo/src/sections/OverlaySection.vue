<script setup lang="ts">
import { ref } from 'vue'
import {
  VyButton,
  VyCombobox,
  VyDrawer,
  VyDropdownMenu,
  VyModal,
  VyPlaceholder,
  VyPopover,
  VySelect,
} from '@vyui/kit'

const modalOpen = ref(false)
const drawerOpen = ref(false)
const dropdownOpen = ref(false)

// Notifications — each entry gets its own popover open state so tapping one
// reveals its "bit of info" without affecting the others. Replaces the
// retired Tooltip component (Lynx is touch-first; popover-on-tap is the
// idiomatic substitute for hover-only tooltip semantics).
const notifications = [
  {
    id: 'n1',
    icon: 'icon-park-outline:check-one',
    title: 'Deployment finished',
    summary: 'prod-eu-west-1 · 4m 12s',
    detail: 'All 24 services healthy. 0 rollbacks. Released by ci@vyui.dev.',
  },
  {
    id: 'n2',
    icon: 'icon-park-outline:caution',
    title: 'Disk usage 82%',
    summary: 'db-primary',
    detail: 'Approaching the 85% alert threshold. Next backup window in 2h will trim WAL by ~14GB.',
  },
  {
    id: 'n3',
    icon: 'icon-park-outline:bell-ring',
    title: 'New comment on PR #1284',
    summary: '@ada — "Looks good, just one nit…"',
    detail: 'Diff: packages/kit/src/components/Island.vue. Open the PR to view the inline thread.',
  },
]
const notificationOpen = ref<string | null>(null)
const dropdownItems = [
  [
    { label: 'Profile',  icon: 'icon-park-outline:user' },
    { label: 'Settings', icon: 'icon-park-outline:setting' },
  ],
  [
    { label: 'Sign out', icon: 'icon-park-outline:logout' },
  ],
]

// Select / Combobox content layer is rebuilt on top of `SheetRoot` — the
// dropdown opens as a bottom sheet (`[0.5]` snap for Select, `[0.9]` for
// Combobox so the in-sheet search input clears the keyboard).
const selectCountry = ref('us')
const comboboxFruit = ref('apple')
const countryItems = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'se', label: 'Sweden' },
  { value: 'jp', label: 'Japan' },
]
const fruitItems = [
  { value: 'apple',  label: 'Apple'  },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian' },
]
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Modal</text>
      <text class="text-slate-500 text-xs">Dialog with overlay backdrop.</text>
      <VyModal v-model:open="modalOpen" title="Modal title" description="Anchored over OverlayRoot.">
        <VyButton color="neutral" variant="subtle" label="Open modal" />
        <template #content>
          <VyPlaceholder class="h-48 m-4" />
        </template>
      </VyModal>
    </view>

    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Notifications</text>
      <text class="text-slate-500 text-xs">
        Tap a notification to reveal the full detail in a popover — touch
        analogue of a hover tooltip.
      </text>
      <view class="flex flex-col gap-2">
        <VyPopover
          v-for="n in notifications"
          :key="n.id"
          :open="notificationOpen === n.id"
          @update:open="(v) => { notificationOpen = v ? n.id : null }"
        >
          <view class="flex flex-row items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <view class="w-8 h-8 rounded-full bg-white border border-slate-200 flex flex-row items-center justify-center shrink-0">
              <text class="text-slate-700 text-base">•</text>
            </view>
            <view class="flex flex-col flex-1 min-w-0 gap-0.5">
              <text class="text-slate-900 text-sm font-medium truncate">{{ n.title }}</text>
              <text class="text-slate-500 text-xs truncate">{{ n.summary }}</text>
            </view>
          </view>
          <template #content>
            <view class="flex flex-col gap-1.5 p-3 max-w-72">
              <text class="text-slate-900 text-sm font-semibold">{{ n.title }}</text>
              <text class="text-slate-700 text-xs">{{ n.detail }}</text>
            </view>
          </template>
        </VyPopover>
      </view>
    </view>

    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Drawer</text>
      <text class="text-slate-500 text-xs">Bottom-sheet via SheetRoot.</text>
      <VyDrawer v-model:open="drawerOpen" title="Drawer title" description="Slide-up sheet.">
        <VyButton color="neutral" variant="subtle" label="Open drawer" />
      </VyDrawer>
    </view>

    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">DropdownMenu</text>
      <text class="text-slate-500 text-xs">Tap-anchored menu.</text>
      <VyDropdownMenu v-model:open="dropdownOpen" :items="dropdownItems">
        <VyButton color="neutral" variant="soft" label="Menu" trailing-icon="icon-park-outline:down" />
      </VyDropdownMenu>
    </view>

    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Select</text>
      <text class="text-slate-500 text-xs">Bottom-sheet picker — items pop up from below.</text>
      <VySelect v-model="selectCountry" :items="countryItems" placeholder="Pick a country" />
      <text class="text-slate-500 text-xs">Country: {{ selectCountry }}</text>
    </view>

    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Combobox / Autocomplete</text>
      <text class="text-slate-500 text-xs">Typeahead picker — the in-sheet search filters items as you type. This is the autocomplete pattern (no separate component).</text>
      <VyCombobox v-model="comboboxFruit" :items="fruitItems" placeholder="Pick a fruit" search-placeholder="Search fruits…" />
      <text class="text-slate-500 text-xs">Fruit: {{ comboboxFruit }}</text>
    </view>
  </view>
</template>
