<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider } from '@vyui/core'
import {
  VyAccordion,
  VyAlert,
  VyAspectRatio,
  VyAvatar,
  VyAvatarGroup,
  VyBadge,
  VyButton,
  VyCard,
  VyChip,
  VyProgress,
  VySeparator,
  VySkeleton,
  VySwipeAction,
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
// Autoplay + loop carousel — exercises the new core props (autoplay/interval,
// loop, axisLock) forwarded through the kit Swiper wrapper. Autoplay pauses
// while dragging and resumes on release; loop wraps last → first.
const autoSwiperIndex = ref(0)

// SwipeAction — velocity-aware release: a quick flick commits even on a short
// drag; a full swipe deletes (iOS-mail style); a partial swipe reveals Delete.
const mailRows = ref([
  { id: 1, from: 'Lynx CI', subject: 'Build #482 passed' },
  { id: 2, from: 'Releases', subject: 'v0.0.6 published' },
])
function removeMail(id: number): void {
  mailRows.value = mailRows.value.filter(r => r.id !== id)
}

const innerTab = ref<string | number>('overview')
const innerTabItems = [
  { value: 'overview', label: 'Overview', icon: 'icon-park-outline:list-view',  slot: 'overview' },
  { value: 'specs',    label: 'Specs',    icon: 'icon-park-outline:doc-detail', slot: 'specs' },
  { value: 'reviews',  label: 'Reviews',  icon: 'icon-park-outline:comments',   slot: 'reviews' },
]

// Deliberately unresolvable src to exercise the Avatar image `binderror` →
// fallback path (initials / icon). See Avatar.vue's CoreAvatarImage handling.
const brokenImage = 'https://invalid.vyui.local/missing-avatar.png'
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
      <text class="text-slate-900 text-sm font-medium pt-1">Broken image → fallback</text>
      <view class="flex flex-row flex-wrap items-center gap-3">
        <!-- `src` fails to load → falls back to alt-derived initials -->
        <VyAvatar :src="brokenImage" alt="Ada Lovelace" />
        <!-- `src` fails to load, no text → falls back to the icon -->
        <VyAvatar :src="brokenImage" icon="icon-park-outline:user" />
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

    <!-- Swiper: autoplay + loop + axis-lock (new core props via kit passthrough) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-center justify-between">
        <text class="text-slate-900 text-base font-semibold">Swiper · autoplay + loop</text>
        <text class="text-slate-500 text-xs">Active: {{ autoSwiperIndex + 1 }} / {{ swiperSlides.length }}</text>
      </view>
      <VySwiper
        v-model="autoSwiperIndex"
        :items="swiperSlides"
        :item-width="280"
        :autoplay="2500"
        loop
        axis-lock
        show-indicators
      >
        <template #item="{ item }">
          <view :class="['h-32 rounded-lg flex items-center justify-center', item.tint]" :style="{ width: '264px' }">
            <text class="text-white text-lg font-bold">{{ item.label }}</text>
          </view>
        </template>
      </VySwiper>
      <text class="text-slate-500 text-xs">Auto-advances every 2.5s · loops past the end · pauses while you drag.</text>
    </view>

    <!-- SwipeAction -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">SwipeAction</text>
      <text class="text-slate-500 text-xs">Full swipe (or flick) deletes · a partial swipe reveals Delete to tap.</text>
      <view class="flex flex-col gap-2">
        <VySwipeAction
          v-for="row in mailRows"
          :key="row.id"
          :row-width="300"
          :action-width="80"
          side="right"
          @commit="removeMail(row.id)"
        >
          <view class="bg-white h-16 flex flex-col justify-center px-4" :style="{ width: '300px' }">
            <text class="text-slate-900 text-sm font-medium">{{ row.from }}</text>
            <text class="text-slate-500 text-xs">{{ row.subject }}</text>
          </view>
          <template #actions="{ close }">
            <view
              class="bg-rose-500 h-16 flex items-center justify-center"
              :style="{ width: '80px' }"
              @tap="removeMail(row.id); close()"
            >
              <text class="text-white text-sm font-semibold">Delete</text>
            </view>
          </template>
        </VySwipeAction>
      </view>
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

    <!-- AspectRatio — pure layout primitive; the box sizes to parent width
         and derives height from `ratio` (Lynx supports `aspect-ratio` natively). -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">AspectRatio</text>
      <view class="flex flex-col gap-2">
        <text class="text-slate-500 text-xs">16 / 9</text>
        <!-- Render the AspectRatio *as* the <image> so the ratio sits on the
             image element itself: a nested image sized via h-full/flex collapses
             to 0 on native, and a Lynx <image> with a 0 computed size never loads
             (see @lynx-js/types image `prefetch-*` notes). `aspectFit` keeps the
             square logo uncropped inside the wide box. -->
        <VyAspectRatio
          as="image"
          :ratio="16 / 9"
          :src="vyuiIcon"
          mode="aspectFit"
          class="rounded-lg bg-slate-100"
        />
      </view>
      <view class="flex flex-row gap-3">
        <view class="flex flex-col gap-2 flex-1">
          <text class="text-slate-500 text-xs">1 / 1</text>
          <VyAspectRatio :ratio="1" class="bg-sky-500 rounded-lg flex items-center justify-center">
            <text class="text-white text-sm font-semibold">1:1</text>
          </VyAspectRatio>
        </view>
        <view class="flex flex-col gap-2 flex-1">
          <text class="text-slate-500 text-xs">4 / 3</text>
          <VyAspectRatio :ratio="4 / 3" class="bg-violet-500 rounded-lg flex items-center justify-center">
            <text class="text-white text-sm font-semibold">4:3</text>
          </VyAspectRatio>
        </view>
      </view>
    </view>
  </view>
</template>
