<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider, ToastViewport } from '@vyui/core'
import {
  VyButton,
  VyCombobox,
  VyDrawer,
  VyDropdownMenu,
  VyModal,
  VySelect,
  VyToast,
} from '@vyui/kit'

const modalOpen = ref(false)
const drawerOpen = ref(false)
const dropdownOpen = ref(false)

// Notifications — each entry has a "Show" button that surfaces its detail as a
// transient Toast (one at a time, auto-dismissing).
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
// Each notification surfaces its detail as a transient Toast — tapping a row's
// button shows it, and it auto-dismisses. Only one toast is shown at a time.
type Notification = (typeof notifications)[number]
const activeToast = ref<Notification | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showNotification(n: Notification) {
  activeToast.value = n
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    activeToast.value = null
  }, 3200)
}
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
      <VyModal v-model:open="modalOpen" title="Modal title" description="A centered dialog with an overlay backdrop.">
        <VyButton color="neutral" variant="subtle" label="Open modal" />
        <template #content>
          <view class="flex flex-col gap-3 p-4">
            <text class="text-slate-600 text-sm">
              Modal content goes here. Tap the backdrop or the close control to dismiss.
            </text>
          </view>
        </template>
      </VyModal>
    </view>

    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">Notifications</text>
      <text class="text-slate-500 text-xs">
        Tap a notification's button to surface its detail as a transient toast.
      </text>
      <view class="flex flex-col gap-2">
        <view
          v-for="n in notifications"
          :key="n.id"
          class="flex flex-row items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg"
        >
          <view class="w-8 h-8 rounded-full bg-white border border-slate-200 flex flex-row items-center justify-center shrink-0">
            <text class="text-slate-700 text-base">•</text>
          </view>
          <view class="flex flex-col flex-1 min-w-0 gap-0.5">
            <text class="text-slate-900 text-sm font-medium truncate">{{ n.title }}</text>
            <text class="text-slate-500 text-xs truncate">{{ n.summary }}</text>
          </view>
          <VyButton color="neutral" variant="soft" size="sm" label="Show" @tap="showNotification(n)" />
        </view>
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
      <text class="text-slate-500 text-xs">Bottom-sheet picker — items pop up from below. This covers the listbox pattern too (no separate Listbox component).</text>
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

  <!-- Transient toast for the tapped notification. Kept OUTSIDE the section's
       gapped flex column (a second template root) so its placeholder doesn't add
       a `gap-4` slot. `ToastViewport` paints through the app-root OverlayRoot
       portal and owns the fixed positioning; `ToastProvider` gives ToastRoot its
       context. Bindings are null-safe — the portal can re-render the captured
       slot once `activeToast` flips back to null, before the v-if unmounts. -->
  <ToastProvider v-if="activeToast">
    <ToastViewport position="top" :style="{ paddingTop: '16px', zIndex: 60 }">
      <VyToast
        :title="activeToast?.title"
        :description="activeToast?.detail"
        :icon="activeToast?.icon"
        :close="false"
      />
    </ToastViewport>
  </ToastProvider>
</template>
