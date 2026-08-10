<script setup lang="ts">
import { onUnmounted, reactive, ref, watch } from 'vue'
import { ToastProvider, ToastViewport } from '@vyui/core'
import {
  VyButton,
  VyCombobox,
  VyDrawer,
  VyDropdownMenu,
  VyInput,
  VyModal,
  VySelect,
  VyTextarea,
  VyToast,
  VyTray,
  VyTrayView,
} from '@vyui/kit'

const modalOpen = ref(false)
const trayOpen = ref(false)
const trayVariant = ref<'floating' | 'flush'>('floating')
function openTray(variant: 'floating' | 'flush') {
  trayVariant.value = variant
  trayOpen.value = true
}
// Keyboard-aware trays — device-only (the web preview has no software
// keyboard). Inputs self-register with the surrounding KeyboardAwareRoot, so
// nothing in this file wraps a KeyboardAwareTrigger. Scroll mode: the tray
// must NOT grow when the keyboard opens (morph freeze) — the focused field
// scrolls above it instead, and the footer lifts independently. Lift mode:
// the whole panel translates up.
const kbScrollOpen = ref(false)
const kbLiftOpen = ref(false)
const kbForm = reactive({
  name: '', handle: '', bio: '', city: '', website: '', note: '', reply: '',
})

// Stage probe: shows the last @keyboard payload the focused input emitted.
// If this chip updates on Cmd+K but nothing moves, the signal chain is fine
// and the failure is actuation (spacer setNativeProps / scrollTo / responder
// transform); if it stays "—", the element event isn't firing here at all.
const kbLast = ref('—')
function onKbProbe(info: { visible: boolean, height: number, safeAreaBottom: number }) {
  kbLast.value = `visible=${info.visible} height=${info.height} safeArea=${info.safeAreaBottom}`
}

const drawerOpen = ref(false)
const drawerFullOpen = ref(false)
const drawerRightOpen = ref(false)
const drawerLeftOpen = ref(false)
const drawerTopOpen = ref(false)
const dropdownOpen = ref(false)

// v-model (modelValue alias) + #header/#body/#footer slots — the nuxt.ui parity
// API. `v-model` (not `v-model:open`) binds `modelValue`; `#footer="{ close }"`
// gives the slot a programmatic dismiss helper. `handleOnly` restricts drag to
// the pill so form interactions inside the body don't fight the sheet drag.
const formDrawerOpen = ref(false)
const formDraft = reactive({ name: '', role: '', bio: '' })

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
// Sonner-style stack — multiple toasts coexist, collapsed into an overlapping
// pile that fans out under each other when you tap one (`stacked` on VyToast).
const stackedToasts = ref<Array<Notification & { key: number }>>([])
let stackKey = 0
function pushStackedToast() {
  const n = notifications[stackKey % notifications.length]
  stackedToasts.value = [...stackedToasts.value, { ...n, key: stackKey++ }]
}
function clearStackedToasts() {
  stackedToasts.value = []
}
function dismissStackedToast(key: number) {
  stackedToasts.value = stackedToasts.value.filter(t => t.key !== key)
}
// Progress-color demo — the countdown bar recolors as it drains. Bump the key
// to remount a fresh toast so its timer (and the bar) restart from full.
const progressToast = ref(0)
function showProgressToast() {
  progressToast.value += 1
}

// Ghost-close regression rig (usePresence MAX_LEAVING_FRAMES hard cap +
// SheetContentImpl's mt-close keyframe gate). The 100ms ticker inside the
// drawer body keeps BG re-renders flowing through the Leaving window — the
// style-patch aggravator that un-suppressed the slide-out keyframe — and the
// tap probe proves the panel really unmounted: a stuck-Leaving panel sits
// invisible over the lower part of the screen and eats the taps.
const ghostOpen = ref(false)
const ghostTicks = ref(0)
const ghostTaps = ref(0)
let ghostTicker: ReturnType<typeof setInterval> | undefined
watch(ghostOpen, (isOpen) => {
  if (isOpen) {
    if (ghostTicker) clearInterval(ghostTicker)
    ghostTicks.value = 0
    ghostTicker = setInterval(() => { ghostTicks.value += 1 }, 100)
    return
  }
  // Keep ticking ~2s past close so patches land DURING the leave, then stop.
  setTimeout(() => {
    if (!ghostOpen.value && ghostTicker) {
      clearInterval(ghostTicker)
      ghostTicker = undefined
    }
  }, 2000)
})
onUnmounted(() => {
  if (ghostTicker) clearInterval(ghostTicker)
})

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
    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Modal</text>
      <text class="text-muted text-xs">Dialog with overlay backdrop.</text>
      <VyModal v-model:open="modalOpen" title="Modal title" description="A centered dialog with an overlay backdrop.">
        <VyButton color="neutral" variant="subtle" label="Open modal" />
        <template #content>
          <view class="flex flex-col gap-3 p-4">
            <text class="text-toned text-sm">
              Modal content goes here. Tap the backdrop or the close control to dismiss.
            </text>
          </view>
        </template>
      </VyModal>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Tray</text>
      <text class="text-muted text-xs">
        Morphing multi-view sheet — the panel grows/shrinks to fit each view.
        Navigate forward, then Back; the footer stays put across views.
        <text class="font-medium">Floating</text> hovers with a gap + border on
        all sides; <text class="font-medium">flush</text> anchors to the edges.
      </text>
      <view class="flex flex-row gap-2">
        <VyButton color="neutral" variant="subtle" label="Open floating" @tap="openTray('floating')" />
        <VyButton color="neutral" variant="subtle" label="Open flush" @tap="openTray('flush')" />
      </view>
      <VyTray v-model:open="trayOpen" :variant="trayVariant" default-view="menu">
        <template #default="{ setView, goBack, canGoBack }">
          <VyTrayView id="menu">
            <view class="flex flex-col gap-2">
              <text class="text-highlighted text-base font-semibold">Quick actions</text>
              <VyButton color="neutral" variant="soft" label="Share" @tap="setView('share')" />
              <VyButton color="neutral" variant="soft" label="Rename" @tap="setView('share')" />
              <VyButton color="error" variant="soft" label="Delete" @tap="setView('confirm')" />
            </view>
          </VyTrayView>

          <VyTrayView id="share">
            <view class="flex flex-col gap-2">
              <VyButton v-if="canGoBack" color="neutral" variant="ghost" size="sm" label="← Back" @tap="goBack()" />
              <text class="text-highlighted text-base font-semibold">Share</text>
              <text class="text-muted text-sm">A taller view — the tray grows to fit it.</text>
              <text class="text-toned text-sm">Anyone with the link can view. Toggle access, copy the URL, or invite by email — plenty of room here so the panel is noticeably taller than the confirm view.</text>
            </view>
          </VyTrayView>

          <VyTrayView id="confirm">
            <view class="flex flex-col gap-2">
              <VyButton v-if="canGoBack" color="neutral" variant="ghost" size="sm" label="← Back" @tap="goBack()" />
              <text class="text-highlighted text-base font-semibold">Delete item?</text>
              <text class="text-muted text-sm">A short view — the tray shrinks down.</text>
            </view>
          </VyTrayView>
        </template>

        <template #footer="{ close }">
          <VyButton color="neutral" variant="solid" label="Close" block @tap="close()" />
        </template>
      </VyTray>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Keyboard-aware tray</text>
      <text class="text-muted text-xs">
        Device-only — the web preview has no software keyboard. Focus a field,
        then Cmd+K: the whole panel should rise above the keyboard (bottom
        padding grows, so the panel extends up while its background fills in
        behind the keyboard). Inputs register themselves; no per-input
        wrapping anywhere here.
        <text class="font-medium">Scroll</text>: tall body — it becomes a
        bounded scroll region that keeps the focused field in view.
        <text class="font-medium">Lift</text>: short tray — rise only.
      </text>
      <view class="flex flex-row gap-2">
        <VyButton color="neutral" variant="subtle" label="Open scroll tray" @tap="kbScrollOpen = true" />
        <VyButton color="neutral" variant="subtle" label="Open lift tray" @tap="kbLiftOpen = true" />
      </view>

      <!-- `bodyScroll` caps the scroll region — without a bound the tray hugs
           content and nothing scrolls. -->
      <VyTray v-model:open="kbScrollOpen" keyboard-aware :ui="{ bodyScroll: 'max-h-80' }">
        <view class="flex flex-col gap-3">
          <text class="text-highlighted text-base font-semibold">Edit profile</text>
          <text class="text-dimmed text-xs">@keyboard: {{ kbLast }}</text>
          <VyInput v-model="kbForm.name" placeholder="Name" @keyboard="onKbProbe" />
          <VyInput v-model="kbForm.handle" placeholder="Handle" @keyboard="onKbProbe" />
          <VyTextarea v-model="kbForm.bio" placeholder="Bio — a few lines" @keyboard="onKbProbe" />
          <VyInput v-model="kbForm.city" placeholder="City" @keyboard="onKbProbe" />
          <VyInput v-model="kbForm.website" placeholder="Website — focus me last" @keyboard="onKbProbe" />
        </view>
        <template #footer="{ close }">
          <view class="flex flex-col gap-2">
            <VyInput v-model="kbForm.note" placeholder="Footer note — lifts with the footer" @keyboard="onKbProbe" />
            <VyButton color="neutral" variant="solid" label="Done" block @tap="close()" />
          </view>
        </template>
      </VyTray>

      <VyTray v-model:open="kbLiftOpen" keyboard-aware="lift">
        <view class="flex flex-col gap-2">
          <text class="text-highlighted text-base font-semibold">Quick reply</text>
          <text class="text-dimmed text-xs">@keyboard: {{ kbLast }}</text>
          <VyInput v-model="kbForm.reply" placeholder="Type a reply…" @keyboard="onKbProbe" />
        </view>
        <template #footer="{ close }">
          <VyButton color="neutral" variant="solid" label="Send" block @tap="close()" />
        </template>
      </VyTray>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Notifications</text>
      <text class="text-muted text-xs">
        Tap a notification's button to surface its detail as a transient toast.
      </text>
      <view class="flex flex-col gap-2">
        <view
          v-for="n in notifications"
          :key="n.id"
          class="flex flex-row items-center gap-3 px-3 py-2.5 bg-muted border border-default rounded-lg"
        >
          <view class="w-8 h-8 rounded-full bg-default border border-default flex flex-row items-center justify-center shrink-0">
            <text class="text-default text-base">•</text>
          </view>
          <view class="flex flex-col flex-1 min-w-0 gap-0.5">
            <text class="text-highlighted text-sm font-medium truncate">{{ n.title }}</text>
            <text class="text-muted text-xs truncate">{{ n.summary }}</text>
          </view>
          <VyButton color="neutral" variant="soft" size="sm" label="Show" @tap="showNotification(n)" />
        </view>
      </view>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Stacked toasts (Sonner)</text>
      <text class="text-muted text-xs">
        Add a few — they collapse into a pile pinned to the top. Tap any toast
        to fan them out under each other, tap again to collapse. Swipe a toast
        sideways to dismiss it.
      </text>
      <view class="flex flex-row gap-2">
        <VyButton color="primary" variant="soft" size="sm" label="Add toast" @tap="pushStackedToast" />
        <VyButton color="neutral" variant="ghost" size="sm" label="Clear" @tap="clearStackedToasts" />
      </view>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Progress color</text>
      <text class="text-muted text-xs">
        The countdown bar can be colored independently of the toast — pass
        `progress.color` a function of the remaining fraction and it recolors as
        it drains: green → amber → red.
      </text>
      <view class="flex flex-row gap-2">
        <VyButton color="neutral" variant="soft" size="sm" label="Show progress toast" @tap="showProgressToast" />
      </view>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Drawer</text>
      <text class="text-muted text-xs">
        Bottom-sheet via SheetRoot with multi-snap: opens at 90%, drag down
        to catch the 40% snap, drag up to return, fling down to dismiss.
      </text>
      <VyDrawer
        v-model:open="drawerOpen"
        title="Drawer title"
        description="Drag me between the 40% and 90% snaps."
        :snap-points="[0.4, 0.9]"
        :default-snap-index="1"
      >
        <VyButton color="neutral" variant="subtle" label="Open drawer" />
      </VyDrawer>
      <!-- Single-snap full-screen control case: takes the classic
           keyframe open/close path (no intermediate snaps, no inline
           animation override) — useful for comparing against the
           multi-snap drawer above. -->
      <VyDrawer
        v-model:open="drawerFullOpen"
        title="Full-screen drawer"
        description="Single snap at 100% — drag the handle down, or use Close below."
        :snap-points="[1]"
      >
        <VyButton color="neutral" variant="subtle" label="Open full-screen drawer" />
        <!-- A full-screen drawer covers the backdrop, so there's nothing to tap
             outside it to dismiss. Give the body an explicit close affordance. -->
        <template #body="{ close }">
          <view class="flex flex-col gap-3 px-4 py-2">
            <text class="text-toned text-sm">
              This drawer fills the viewport. Drag the handle down to dismiss, or tap Close.
            </text>
            <VyButton color="neutral" variant="solid" label="Close" block @tap="close()" />
          </view>
        </template>
      </VyDrawer>

      <!-- Side + top drawers: same core Sheet primitive, `side` switches the
           anchor edge, slide axis, and drag direction. Right/left slide on x;
           top slides down on y. Drag off-edge or fling to dismiss. -->
      <VyDrawer
        v-model:open="drawerRightOpen"
        side="right"
        title="Right drawer"
        description="Slides in from the right. Drag right to dismiss."
        :snap-points="[0.85]"
      >
        <VyButton color="neutral" variant="subtle" label="Open right drawer" />
      </VyDrawer>

      <VyDrawer
        v-model:open="drawerLeftOpen"
        side="left"
        title="Left drawer"
        description="Slides in from the left. Drag left to dismiss."
        :snap-points="[0.85]"
      >
        <VyButton color="neutral" variant="subtle" label="Open left drawer" />
      </VyDrawer>

      <VyDrawer
        v-model:open="drawerTopOpen"
        side="top"
        title="Top drawer"
        description="Slides down from the top. Drag up to dismiss."
        :snap-points="[0.5]"
      >
        <VyButton color="neutral" variant="subtle" label="Open top drawer" />
      </VyDrawer>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Drawer — v-model + slots</text>
      <text class="text-muted text-xs">
        nuxt.ui parity: <text class="font-medium">v-model</text> (not
        <text class="font-medium">v-model:open</text>) binds <text class="font-medium">modelValue</text>;
        <text class="font-medium">#header</text>, <text class="font-medium">#body</text>, and
        <text class="font-medium">#footer</text> slots shape the panel. The footer receives a
        <text class="font-medium">close()</text> helper. <text class="font-medium">handleOnly</text>
        restricts drag to the pill so form fields don't fight the sheet drag.
      </text>
      <view class="flex flex-row gap-2">
        <VyButton color="neutral" variant="subtle" label="Open form drawer" @tap="formDrawerOpen = true" />
        <VyButton
          color="neutral"
          variant="ghost"
          size="sm"
          :label="formDrawerOpen ? 'open ✓' : 'closed'"
          @tap="formDrawerOpen = !formDrawerOpen"
        />
      </view>
      <text class="text-muted text-xs">
        v-model state: {{ formDrawerOpen }} · draft: {{ formDraft.name || '—' }}
      </text>
      <VyDrawer
        v-model="formDrawerOpen"
        handle-only
        :snap-points="[0.9]"
      >
        <VyButton color="neutral" variant="soft" label="Open (trigger slot)" />
        <template #header="{ close }">
          <view class="flex flex-row items-center justify-between px-4 py-3">
            <view class="flex flex-col">
              <text class="text-highlighted text-base font-semibold">Edit profile</text>
              <text class="text-muted text-xs">Changes save when you tap Save.</text>
            </view>
            <VyButton color="neutral" variant="ghost" size="sm" label="✕" @tap="close()" />
          </view>
        </template>
        <template #body>
          <view class="flex flex-col gap-3 px-4">
            <VyInput v-model="formDraft.name" placeholder="Name" />
            <VyInput v-model="formDraft.role" placeholder="Role" />
            <VyTextarea v-model="formDraft.bio" placeholder="Bio" />
          </view>
        </template>
        <template #footer="{ close }">
          <view class="flex flex-row gap-2 px-4 py-3">
            <VyButton color="neutral" variant="ghost" label="Cancel" @tap="close()" />
            <VyButton color="primary" label="Save" @tap="close()" />
          </view>
        </template>
      </VyDrawer>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">Ghost-close regression</text>
      <text class="text-muted text-xs">
        A ticker re-renders the panel every 100ms, including while it closes
        (the style-wipe aggravator). Try each close path — the moment the
        panel is off screen, the tap probe must respond and must never come
        back as an invisible tap-eater:
        1) drag to the 40% snap, then tap the backdrop (MT slide-off path);
        2) flick down hard from anywhere (drag-dismiss path);
        3) close from 90% via backdrop (plain keyframe path — should still
        slide out smoothly).
        Scroll this card toward the bottom of the screen so the probe sits
        where the panel was.
      </text>
      <VyDrawer
        v-model:open="ghostOpen"
        title="Ghost repro"
        description="Ticking every 100ms. Drag to 40% + backdrop-tap, or flick down."
        :snap-points="[0.4, 0.9]"
        :default-snap-index="1"
      >
        <VyButton color="neutral" variant="subtle" label="Open ghost repro drawer" />
        <template #body>
          <view class="flex flex-col gap-2 px-4 py-2">
            <text class="text-highlighted text-2xl font-semibold">Ticks: {{ ghostTicks }}</text>
            <text class="text-muted text-xs">
              Keeps BG patches flowing through the close — before the fix
              these could wipe the worklets' inline animation suppression
              and restart the slide-out keyframe.
            </text>
          </view>
        </template>
      </VyDrawer>
      <VyButton color="primary" variant="soft" :label="`Tap probe: ${ghostTaps}`" block @tap="ghostTaps++" />
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-2">
      <text class="text-highlighted text-base font-semibold">DropdownMenu</text>
      <text class="text-muted text-xs">Tap-anchored menu.</text>
      <VyDropdownMenu v-model:open="dropdownOpen" :items="dropdownItems">
        <VyButton color="neutral" variant="soft" label="Menu" trailing-icon="icon-park-outline:down" />
      </VyDropdownMenu>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-3">
      <text class="text-highlighted text-base font-semibold">Select</text>
      <text class="text-muted text-xs">Bottom-sheet picker — items pop up from below. This covers the listbox pattern too (no separate Listbox component).</text>
      <VySelect v-model="selectCountry" :items="countryItems" placeholder="Pick a country" />
      <text class="text-muted text-xs">Country: {{ selectCountry }}</text>
    </view>

    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-3">
      <text class="text-highlighted text-base font-semibold">Combobox / Autocomplete</text>
      <text class="text-muted text-xs">Typeahead picker — the in-sheet search filters items as you type. This is the autocomplete pattern (no separate component).</text>
      <VyCombobox v-model="comboboxFruit" :items="fruitItems" placeholder="Pick a fruit" search-placeholder="Search fruits…" />
      <text class="text-muted text-xs">Fruit: {{ comboboxFruit }}</text>
    </view>
  </view>

  <!-- Transient toast for the tapped notification. Kept OUTSIDE the section's
       gapped flex column (a second template root) so its placeholder doesn't add
       a `gap-4` slot. `ToastViewport` paints through the app-root OverlayRoot
       portal and owns the fixed positioning; `ToastProvider` gives ToastRoot its
       context. Bindings are null-safe — the portal can re-render the captured
       slot once `activeToast` flips back to null, before the v-if unmounts. -->
  <ToastProvider v-if="activeToast">
    <ToastViewport position="top" :style="{ top: '60px', zIndex: 60 }">
      <VyToast
        :title="activeToast?.title"
        :description="activeToast?.detail"
        :icon="activeToast?.icon"
        :close="false"
      />
    </ToastViewport>
  </ToastProvider>

  <!-- Sonner stack: one provider owns the shared order/expanded state; every
       toast opts in with `stacked` and matches the viewport edge via
       `stack-from`. Tapping a toast toggles the provider's expanded state. -->
  <ToastProvider v-if="stackedToasts.length">
    <ToastViewport position="top" :style="{ top: '60px', zIndex: 60 }">
      <VyToast
        v-for="t in stackedToasts"
        :key="t.key"
        stacked
        stack-from="top"
        swipe
        progress
        :title="t.title"
        :description="t.detail"
        :icon="t.icon"
        :close="false"
        @update:open="dismissStackedToast(t.key)"
      />
    </ToastViewport>
  </ToastProvider>

  <!-- Progress-color toast: `progress.color` is a function of the remaining
       fraction, so the draining bar recolors green → amber → red. `:key`
       remounts a fresh toast (and timer) on each tap. -->
  <ToastProvider v-if="progressToast" :duration="6000">
    <ToastViewport position="top" :style="{ top: '60px', zIndex: 60 }">
      <VyToast
        :key="progressToast"
        color="neutral"
        title="Saving changes…"
        description="Closes on its own — watch the bar go green → amber → red."
        icon="icon-park-outline:check-one"
        :progress="{ color: (p) => p > 0.5 ? 'success' : p > 0.25 ? 'warning' : 'error' }"
        :close="false"
      />
    </ToastViewport>
  </ToastProvider>
</template>
