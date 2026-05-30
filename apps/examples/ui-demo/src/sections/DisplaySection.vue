<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider } from '@vyui/core'
import {
  VyAccordion,
  VyAlert,
  VyAvatar,
  VyAvatarGroup,
  VyBadge,
  VyButton,
  VyCard,
  VyChip,
  VyIsland,
  VyIslandButton,
  VyIslandGroup,
  VyProgress,
  VySeparator,
  VySkeleton,
  VySwiper,
  VyTabs,
  VyToast,
} from '@vyui/kit'
import vyuiIcon from '../assets/vyui-icon.png'

// Navigation widgets (Accordion + nested Tabs) — consolidated here from the
// retired NavigationSection so View covers display + nav + feedback in one tab.
const accordionOpen = ref<string | number>('q1')
const accordionItems = [
  { value: 'q1', label: 'What is Vy UI?',           content: 'A styled component library for Vue-Lynx, modelled on Nuxt UI v3.' },
  { value: 'q2', label: 'Which engine does it run?', content: 'Lynx runs PrimJS natively and renders via a Vue-Lynx bridge.' },
  { value: 'q3', label: 'Does it support theming?',  content: 'Yes — semantic colors are wired through CSS variables.' },
]
// Swiper — exercises the shared `useDragGesture` controller (drag / snap /
// velocity flick). The index text + dots let you confirm settle behaviour.
const swiperIndex = ref(0)
const swiperSlides = [
  { label: 'Slide 1', tint: 'bg-sky-500' },
  { label: 'Slide 2', tint: 'bg-violet-500' },
  { label: 'Slide 3', tint: 'bg-emerald-500' },
  { label: 'Slide 4', tint: 'bg-amber-500' },
]

const innerTab = ref<string | number>('overview')
const innerTabItems = [
  { value: 'overview', label: 'Overview', icon: 'icon-park-outline:list-view',  slot: 'overview' },
  { value: 'specs',    label: 'Specs',    icon: 'icon-park-outline:doc-detail', slot: 'specs' },
  { value: 'reviews',  label: 'Reviews',  icon: 'icon-park-outline:comments',   slot: 'reviews' },
]

// Linear-style bottom dock. With the new declarative API, the three island
// state axes (`value` for active tab, `mode` for row mode, `open` for the
// expanded panel) are v-model'd from a single set of refs — buttons opt
// into each axis via props (`value=…`, `mode=…`, `expand`, `reset`).
const dockTab = ref<string | number | null>('inbox')
const dockMode = ref<string>('default')
const dockOpen = ref(false)
const floatingDockVisible = ref(true)

// Mock inbox content — revealed on tap of the Inbox tab in the dock. Each
// issue is an accordion row that opens to show the detail body that the
// retired tooltip used to host. Active / inactive grouped via the `status`
// flag rendered as an inline badge in the label.
const inboxOpen = ref<string | number>('iss-431')
const inboxIssues = [
  {
    value: 'iss-431',
    label: 'iss-431 · API /users returns 500 on limit=0',
    content: 'Repro: GET /users?limit=0 → 500. Stack trace points to the pagination middleware not guarding against zero. Triaged to backend, ETA today. Owner: api-team. Severity: high. Affects: production EU + US.',
  },
  {
    value: 'iss-428',
    label: 'iss-428 · Mobile nav misaligned on iOS 17',
    content: 'Safe-area inset is mis-applied when the keyboard is dismissed. Reproducible on iPhone 14 Pro / iOS 17.4. Workaround: rotate twice. Owner: mobile-team. Severity: medium.',
  },
  {
    value: 'iss-419',
    label: 'iss-419 · Email digest sending twice',
    content: 'Two cron entries enqueueing the same job at 09:00 UTC. Removed the duplicate from infra/cron.yaml; backfill not needed (Mailgun dedupe absorbed it). Verified clean run on the 09:00 + 12:00 ticks.',
  },
  {
    value: 'iss-389',
    label: 'iss-389 · Old caching layer key collisions',
    content: 'Closed: superseded by the new Redis namespacing rolled out in PR #1204. Verified across all four services; cache hit rate up 3%.',
  },
  {
    value: 'iss-355',
    label: 'iss-355 · Deprecated auth flow still in mobile',
    content: 'Closed: shipped v5.2 of the mobile client; deprecated path now returns 410. Server-side route scheduled for removal in v5.4.',
  },
]
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- Avatar / AvatarGroup -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Avatar</text>
      <view class="flex flex-row flex-wrap items-center gap-3">
        <VyAvatar :src="vyuiIcon" alt="Vy" />
        <VyAvatar alt="Kealan Clarke" />
        <VyAvatar icon="icon-park-outline:user" />
        <VyAvatar size="xl" alt="Big Avatar" />
      </view>
      <text class="text-slate-900 text-sm font-medium pt-1">Group</text>
      <VyAvatarGroup :max="3" size="md">
        <VyAvatar :src="vyuiIcon" alt="Vy" />
        <VyAvatar alt="Kealan Clarke" />
        <VyAvatar alt="Ada Lovelace" />
        <VyAvatar alt="Grace Hopper" />
        <VyAvatar alt="Linus Torvalds" />
      </VyAvatarGroup>
    </view>

    <!-- Badge -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Badge</text>
      <view class="flex flex-row flex-wrap items-center gap-2">
        <VyBadge label="Default" />
        <VyBadge color="success" label="Success" />
        <VyBadge color="error" variant="soft" label="Error" />
        <VyBadge color="warning" variant="outline" label="Warning" />
        <VyBadge color="info" variant="subtle" label="Info" />
      </view>
      <view class="flex flex-row flex-wrap items-center gap-2">
        <VyBadge size="sm" label="sm" />
        <VyBadge size="md" label="md" />
        <VyBadge size="lg" label="lg" />
        <VyBadge size="xl" label="xl" />
        <VyBadge leading-icon="icon-park-outline:check" label="Verified" />
      </view>
    </view>

    <!-- Chip -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Chip</text>
      <view class="flex flex-row flex-wrap items-center gap-4">
        <VyChip color="success">
          <VyAvatar :src="vyuiIcon" alt="Vy" />
        </VyChip>
        <VyChip color="error" position="top-left">
          <VyAvatar alt="Ada Lovelace" />
        </VyChip>
        <VyChip color="info" :text="3">
          <VyAvatar icon="icon-park-outline:bell-ring" />
        </VyChip>
        <VyChip standalone color="warning" size="lg" />
      </view>
    </view>

    <!-- Progress -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-4">
      <text class="text-slate-900 text-base font-semibold">Progress</text>
      <view class="flex flex-col gap-2">
        <VyProgress :model-value="20" />
        <VyProgress :model-value="55" color="success" />
        <VyProgress :model-value="85" color="warning" />
      </view>
    </view>

    <!-- Swiper (shared useDragGesture) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-center justify-between">
        <text class="text-slate-900 text-base font-semibold">Swiper</text>
        <text class="text-slate-500 text-xs">Active: {{ swiperIndex + 1 }} / {{ swiperSlides.length }}</text>
      </view>
      <VySwiper
        v-model="swiperIndex"
        :items="swiperSlides"
        :item-width="280"
        show-indicators
      >
        <template #item="{ item }">
          <view :class="['h-32 rounded-lg flex items-center justify-center', item.tint]" :style="{ width: '264px' }">
            <text class="text-white text-lg font-bold">{{ item.label }}</text>
          </view>
        </template>
      </VySwiper>
      <text class="text-slate-500 text-xs">Drag to swipe · flick to advance · dots reflect settle.</text>
    </view>

    <!-- Separator -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Separator</text>
      <text class="text-slate-700 text-sm">Top section</text>
      <VySeparator />
      <text class="text-slate-700 text-sm">Bottom section</text>
    </view>
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Separator (label)</text>
      <text class="text-slate-700 text-sm">Top section</text>
      <VySeparator label="OR" />
      <text class="text-slate-700 text-sm">Bottom section</text>
    </view>

    <!-- Skeleton -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Skeleton</text>
      <view class="flex flex-row items-center gap-3">
        <VySkeleton class="w-12 h-12 rounded-full shrink-0" />
        <VySkeleton class="h-3 flex-1" />
      </view>
    </view>

    <!-- Card -->
    <view class="flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold px-1">Card</text>
      <VyCard>
        <template #header>
          <text class="text-slate-900 text-sm font-semibold">Card header</text>
        </template>
        <text class="text-slate-700 text-sm">Cards group related content. Header, body, and footer slots stack vertically.</text>
        <template #footer>
          <view class="flex flex-row gap-2">
            <VyButton size="sm" variant="soft" color="neutral" label="Cancel" />
            <VyButton size="sm" label="Confirm" />
          </view>
        </template>
      </VyCard>
    </view>

    <!-- Accordion -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Accordion</text>
      <VyAccordion v-model="accordionOpen" :items="accordionItems" type="single" />
    </view>

    <!-- Tabs (nested) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Tabs (pill variant)</text>
      <VyTabs v-model="innerTab" :items="innerTabItems" variant="pill" size="sm">
        <template #overview>
          <text class="text-slate-700 text-sm pt-3">High-level overview of the product.</text>
        </template>
        <template #specs>
          <text class="text-slate-700 text-sm pt-3">Technical specifications and dimensions.</text>
        </template>
        <template #reviews>
          <text class="text-slate-700 text-sm pt-3">Customer feedback and ratings.</text>
        </template>
      </VyTabs>
    </view>

    <!-- Alert -->
    <view class="flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold px-1">Alert</text>
      <VyAlert
        color="info"
        icon="icon-park-outline:info"
        title="Heads up"
        description="Vy UI mirrors Nuxt UI v3's component API for Vue-Lynx."
      />
      <VyAlert
        color="success"
        variant="soft"
        icon="icon-park-outline:check-one"
        title="All set"
        description="Your changes have been saved."
      />
      <VyAlert
        color="warning"
        variant="outline"
        icon="icon-park-outline:caution"
        title="Watch out"
        description="This action cannot be undone."
      />
      <VyAlert
        color="error"
        variant="subtle"
        icon="icon-park-outline:close-one"
        title="Something went wrong"
        description="Try again in a moment."
      />
    </view>

    <!-- Toast (static showcase — ToastProvider lets ToastRoot inject context) -->
    <ToastProvider>
      <view class="flex flex-col gap-3">
        <text class="text-slate-900 text-base font-semibold px-1">Toast</text>
        <text class="text-slate-500 text-xs px-1">
          Static preview — add ToastViewport for runtime toasts.
        </text>
        <VyToast
          title="Profile updated"
          description="Your changes are now visible to the team."
          icon="icon-park-outline:check-one"
        />
        <VyToast
          color="error"
          title="Upload failed"
          description="Check your network and retry."
          icon="icon-park-outline:close-one"
        />
      </view>
    </ToastProvider>

    <!-- Island — the real floating dock is rendered after the closing
         </view> of this card (see below). This card holds the description
         + secondary placement variants (top pair, single icon). -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-4">
      <view class="flex flex-col gap-1">
        <text class="text-slate-900 text-base font-semibold">Island</text>
        <text class="text-slate-500 text-xs">
          Linear-style pill container — anchored to the viewport edge by
          default. The main dock for this section is floating at the bottom
          of the screen; toggle it below. Side-by-side and single-button
          patterns are inlined here for layout reference.
        </text>
        <text class="text-slate-400 text-[11px] pt-1">value: <text class="font-mono">{{ dockTab }}</text> · mode: <text class="font-mono">{{ dockMode }}</text> · open: <text class="font-mono">{{ dockOpen }}</text></text>
      </view>

      <!-- Inbox view — revealed when the Inbox tab is active in the dock.
           Each issue is an accordion row; tap to expand its detail body
           (replaces the old tooltip-on-hover affordance with a touch one).
           `type="single"` keeps at most one open at a time. -->
      <view v-if="dockTab === 'inbox'" class="flex flex-col gap-2">
        <text class="text-slate-500 text-xs">{{ inboxIssues.length }} issues · tap any row to expand</text>
        <VyAccordion v-model="inboxOpen" :items="inboxIssues" type="single" />
      </view>

      <VySeparator />

      <!-- Top pair — two inline islands side-by-side -->
      <view class="flex flex-col items-stretch gap-2">
        <text class="text-slate-500 text-xs">Two top islands side-by-side (left breadcrumb, right actions)</text>
        <view class="flex flex-row items-start justify-between gap-2">
          <VyIsland position="inline" size="sm">
            <VyIslandButton icon="icon-park-outline:left" @tap="() => {}" />
            <VyIslandButton label="Inbox" @tap="() => {}" />
          </VyIsland>
          <VyIsland position="inline" size="sm">
            <VyIslandButton icon="icon-park-outline:share" @tap="() => {}" />
            <VyIslandButton icon="icon-park-outline:more" @tap="() => {}" />
          </VyIsland>
        </view>
      </view>

      <VySeparator />

      <!-- Single-button island -->
      <view class="flex flex-col items-center gap-2">
        <text class="text-slate-500 text-xs">Single icon, no labels</text>
        <VyIsland position="inline" size="lg">
          <VyIslandButton icon="icon-park-outline:message" @tap="() => {}" />
        </VyIsland>
      </view>

      <VySeparator />

      <!-- Show / hide the floating dock anchored at the bottom -->
      <view class="flex flex-row items-center justify-between gap-2">
        <view class="flex flex-col gap-0.5">
          <text class="text-slate-900 text-sm font-medium">Floating bottom dock</text>
          <text class="text-slate-500 text-xs">Fixed to the bottom of the viewport. Trailing pill = close.</text>
        </view>
        <VyButton
          :label="floatingDockVisible ? 'Hide' : 'Show'"
          :color="floatingDockVisible ? 'neutral' : 'primary'"
          :variant="floatingDockVisible ? 'subtle' : 'solid'"
          size="sm"
          @tap="floatingDockVisible = !floatingDockVisible"
        />
      </view>
    </view>

    <!-- Anchored Linear-style dock — rendered at the section root so the
         fixed position is relative to the viewport, not a clipped parent.
         Wrapped in <VyIslandGroup> so a separate close pill sits to the
         right of the main dock. Group owns the bottom-of-viewport
         positioning; member islands stay `position="inline"`.
         Shares state with the inline preview above. -->
    <VyIslandGroup v-if="floatingDockVisible" position="bottom" size="lg">
      <VyIsland
        v-model:open="dockOpen"
        v-model:mode="dockMode"
        v-model:value="dockTab"
        position="inline"
        size="lg"
      >
        <VyIslandButton value="inbox" icon="icon-park-outline:inbox-in" />
        <VyIslandButton mode="fullisland" icon="icon-park-outline:search" />
        <VyIslandButton value="bell" icon="icon-park-outline:remind" />
        <VyIslandButton expand icon="icon-park-outline:expand-text-input" />

        <template #fullisland>
          <VyIslandButton reset icon="icon-park-outline:search" label="Search…" />
          <VyIslandButton reset icon="icon-park-outline:close" />
        </template>

        <template #expanded="{ close }">
          <VyIslandButton icon="icon-park-outline:setting" label="Settings" @tap="close" />
          <VyIslandButton icon="icon-park-outline:help" label="Help" @tap="close" />
          <VyIslandButton icon="icon-park-outline:logout" label="Sign out" @tap="floatingDockVisible = false" />
        </template>
      </VyIsland>

      <!-- Trailing companion island. Free-form contents — close here, but
           could be a status pill, a chip count, a mini-player, etc. -->
      <VyIsland position="inline" size="lg">
        <VyIslandButton icon="icon-park-outline:close" @tap="floatingDockVisible = false" />
      </VyIsland>
    </VyIslandGroup>
  </view>
</template>
