<script setup lang="ts">
import { ref } from 'vue'
import {
  VyAlert,
  VyAvatar,
  VyBadge,
  VyButton,
  VyCard,
  VyCheckbox,
  VyChip,
  VyIcon,
  VyInput,
  VySelect,
  VySwitch,
} from '@vyui/kit'

// Pure showcase — the color mode is driven from the app header (App.vue), which
// flips the whole app. These components just demonstrate the flip: fields, cards
// and overlays ride the `bg-default`/`bg-elevated` surface tokens; text/borders
// ride the inverted neutral ramp.
const email = ref('')
const search = ref('')
const invalid = ref('not-an-email')
const notifications = ref(true)
const agreed = ref<boolean | 'indeterminate'>(true)
const plan = ref('pro')
const planItems = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
]
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <view class="flex flex-col gap-1">
      <text class="text-neutral-900 text-base font-semibold">Surface showcase</text>
      <text class="text-neutral-500 text-xs">
        Toggle Light / Dark / System in the header — the whole app flips. Field,
        card and overlay surfaces ride the `bg-default` / `bg-elevated` tokens;
        text and borders ride the inverted neutral ramp.
      </text>
    </view>

    <!-- Card · soft — a bg-default surface with header/body/footer. -->
    <VyCard variant="soft">
      <template #header>
        <text class="text-neutral-900 text-base font-semibold">Card · soft</text>
      </template>
      <view class="flex flex-col gap-2">
        <text class="text-neutral-500 text-sm">Sits above the page with its own surface + border.</text>
        <VyInput v-model="email" placeholder="you@example.com" leading-icon="icon-park-outline:mail" />
      </view>
      <template #footer>
        <view class="flex flex-row gap-2">
          <VyButton size="sm" label="Save" />
          <VyButton size="sm" variant="soft" color="neutral" label="Cancel" />
        </view>
      </template>
    </VyCard>

    <!-- Card · outline — bg-default surface, flips with the mode. -->
    <VyCard variant="outline">
      <view class="flex flex-col gap-1">
        <text class="text-neutral-900 text-sm font-semibold">Card · outline</text>
        <text class="text-neutral-500 text-xs">`bg-default` surface — flips with the mode (was the white gap).</text>
      </view>
    </VyCard>

    <view class="flex flex-col gap-2">
      <text class="text-neutral-900 text-sm font-semibold">Inputs</text>
      <VyInput v-model="search" placeholder="Search…" leading-icon="icon-park-outline:search" />
      <VyInput v-model="invalid" color="error" placeholder="Invalid" />
    </view>

    <view class="flex flex-col gap-2">
      <text class="text-neutral-900 text-sm font-semibold">Buttons</text>
      <view class="flex flex-row flex-wrap gap-2">
        <VyButton label="Solid" />
        <VyButton variant="outline" label="Outline" />
        <VyButton variant="soft" label="Soft" />
        <VyButton variant="ghost" label="Ghost" />
        <VyButton color="neutral" label="Neutral" />
      </view>
    </view>

    <view class="flex flex-col gap-2">
      <text class="text-neutral-900 text-sm font-semibold">Badges</text>
      <view class="flex flex-row flex-wrap items-center gap-2">
        <VyBadge color="primary" label="primary" />
        <VyBadge color="success" label="success" />
        <VyBadge color="warning" label="warning" />
        <VyBadge color="error" label="error" />
        <VyBadge color="neutral" variant="soft" label="neutral" />
      </view>
    </view>

    <view class="flex flex-col gap-2">
      <text class="text-neutral-900 text-sm font-semibold">Select (open it — the panel is bg-elevated)</text>
      <VySelect v-model="plan" :items="planItems" placeholder="Choose a plan" />
    </view>

    <view class="flex flex-col gap-3">
      <view class="flex flex-row items-center justify-between">
        <view class="flex flex-row items-center gap-2">
          <VyIcon name="icon-park-outline:remind" :size="18" color="#64748b" />
          <text class="text-neutral-900 text-sm">Notifications</text>
        </view>
        <VySwitch v-model="notifications" />
      </view>
      <view class="flex flex-row items-center gap-3">
        <VyCheckbox v-model="agreed" />
        <text class="text-neutral-900 text-sm">Agree to terms</text>
      </view>
    </view>

    <view class="flex flex-col gap-2">
      <VyAlert
        color="info"
        variant="soft"
        icon="icon-park-outline:info"
        title="Heads up"
        description="Soft alerts tint the accent ramp over a neutral surface."
      />
      <VyAlert
        color="error"
        variant="soft"
        icon="icon-park-outline:caution"
        title="Something went wrong"
        description="Errors stay legible on the dark surface."
      />
    </view>

    <view class="flex flex-row items-center gap-3">
      <VyAvatar alt="Kealan Clarke" />
      <VyChip color="success">
        <VyAvatar icon="icon-park-outline:user" />
      </VyChip>
      <VyChip color="error" :text="3">
        <VyAvatar alt="Vy" />
      </VyChip>
    </view>
  </view>
</template>
