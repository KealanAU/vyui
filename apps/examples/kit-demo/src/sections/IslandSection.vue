<script setup lang="ts">
import { ref } from 'vue'
import {
  VyAccordion,
  VyButton,
  VyIsland,
  VyIslandButton,
  VyIslandGroup,
  VySeparator,
} from '@vyui/kit'

// Linear-style bottom dock. With the declarative API, the three island state
// axes (`value` for active tab, `mode` for row mode, `open` for the expanded
// panel) are v-model'd from a single set of refs — buttons opt into each axis
// via props (`value=…`, `mode=…`, `expand`, `reset`).
const dockTab = ref<string | number | null>('inbox')
const dockMode = ref<string>('default')
const dockOpen = ref(false)
const floatingDockVisible = ref(true)

// Mock inbox content — revealed on tap of the Inbox tab in the dock. Each
// issue is an accordion row that opens to show its detail body. `type="single"`
// keeps at most one open at a time.
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
