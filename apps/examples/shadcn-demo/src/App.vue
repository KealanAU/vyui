<script setup lang="ts">
import { ref } from 'vue'
import {
  VyAccordion,
  VyAlert,
  VyAvatar,
  VyAvatarGroup,
  VyBadge,
  VyButton,
  VyCard,
  VyCheckbox,
  VyChip,
  VyInput,
  VySwitch,
} from '@vyui/kit'

const accordionOpen = ref<string | number>('q1')
const accordionItems = [
  { value: 'q1', label: 'What is this demo?', content: 'The @vyui/kit components rendered under the shadcn style.' },
  { value: 'q2', label: 'How is the style applied?', content: 'index.css supplies shadcn tokens (zinc primary, 0.5rem radius); index.ts bakes the button override into the VyUI plugin.' },
  { value: 'q3', label: 'Is it the real registry style?', content: 'Yes — same tokens + appConfig override that `vyui init --style shadcn` produces.' },
]

const name = ref('')
const wifiOn = ref(true)
const agreed = ref(false)
</script>

<template>
  <scroll-view scroll-orientation="vertical" class="w-full h-full min-h-0 bg-neutral-50">
    <view class="flex flex-col gap-4 p-4">
      <view class="flex flex-col gap-1">
        <text class="text-neutral-900 text-2xl font-bold">shadcn style</text>
        <text class="text-neutral-500 text-sm">@vyui/kit components · zinc primary · 0.5rem radius · neutral default button</text>
      </view>

      <!-- Buttons -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
        <text class="text-neutral-900 text-base font-semibold">Button</text>

        <text class="text-neutral-500 text-xs">Default (neutral solid — the shadcn signature)</text>
        <view class="flex flex-row flex-wrap items-center gap-2">
          <VyButton label="Button" />
          <VyButton leading-icon="i-lucide-heart" label="With icon" />
          <VyButton :loading="true" label="Loading" />
        </view>

        <text class="text-neutral-500 text-xs pt-1">Variants (primary = zinc)</text>
        <view class="flex flex-row flex-wrap items-center gap-2">
          <VyButton variant="solid" label="Solid" />
          <VyButton variant="outline" color="primary" label="Outline" />
          <VyButton variant="soft" color="primary" label="Soft" />
          <VyButton variant="ghost" color="primary" label="Ghost" />
        </view>

        <text class="text-neutral-500 text-xs pt-1">Semantic colors</text>
        <view class="flex flex-row flex-wrap items-center gap-2">
          <VyButton color="primary" label="Primary" />
          <VyButton color="success" label="Success" />
          <VyButton color="error" label="Error" />
          <VyButton color="info" label="Info" />
        </view>

        <text class="text-neutral-500 text-xs pt-1">Sizes</text>
        <view class="flex flex-row flex-wrap items-center gap-2">
          <VyButton size="xs" label="xs" />
          <VyButton size="sm" label="sm" />
          <VyButton size="md" label="md" />
          <VyButton size="lg" label="lg" />
          <VyButton size="xl" label="xl" />
        </view>
      </view>

      <!-- Badge -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
        <text class="text-neutral-900 text-base font-semibold">Badge</text>
        <view class="flex flex-row flex-wrap items-center gap-2">
          <VyBadge label="Default" />
          <VyBadge color="success" label="Success" />
          <VyBadge color="error" variant="soft" label="Error" />
          <VyBadge color="warning" variant="outline" label="Warning" />
          <VyBadge color="info" variant="subtle" label="Info" />
        </view>
      </view>

      <!-- Accordion -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
        <text class="text-neutral-900 text-base font-semibold">Accordion</text>
        <VyAccordion v-model="accordionOpen" :items="accordionItems" />
      </view>

      <!-- Avatar + Chip -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
        <text class="text-neutral-900 text-base font-semibold">Avatar &amp; Chip</text>
        <view class="flex flex-row flex-wrap items-center gap-3">
          <VyAvatar alt="Kealan Clarke" />
          <VyAvatar icon="i-lucide-user" />
          <VyAvatar size="lg" alt="Ada Lovelace" />
          <VyChip color="success">
            <VyAvatar alt="Vy" />
          </VyChip>
          <VyChip color="error" :text="3">
            <VyAvatar icon="i-lucide-bell" />
          </VyChip>
        </view>
        <VyAvatarGroup :max="3" size="md">
          <VyAvatar alt="Kealan Clarke" />
          <VyAvatar alt="Ada Lovelace" />
          <VyAvatar alt="Grace Hopper" />
          <VyAvatar alt="Linus Torvalds" />
        </VyAvatarGroup>
      </view>

      <!-- Alert -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
        <text class="text-neutral-900 text-base font-semibold">Alert</text>
        <VyAlert color="info" icon="i-lucide-info" title="Heads up" description="This is the shadcn style running on real @vyui/kit components." />
        <VyAlert color="success" variant="soft" icon="i-lucide-check" title="All set" description="Tokens + plugin override applied." />
      </view>

      <!-- Form controls -->
      <view class="bg-white border-2 border-solid border-neutral-200 rounded-lg p-4 flex flex-col gap-3">
        <text class="text-neutral-900 text-base font-semibold">Form</text>
        <VyInput v-model="name" placeholder="Your name" />
        <view class="flex flex-row items-center justify-between">
          <text class="text-neutral-900 text-sm">Wi-Fi</text>
          <VySwitch v-model="wifiOn" />
        </view>
        <view class="flex flex-row items-center gap-2">
          <VyCheckbox v-model="agreed" />
          <text class="text-neutral-900 text-sm">I agree to the terms</text>
        </view>
      </view>

      <!-- Card -->
      <view class="flex flex-col gap-2">
        <VyCard>
          <template #header>
            <text class="text-neutral-900 text-sm font-semibold">Card</text>
          </template>
          <text class="text-neutral-700 text-sm">Header / body / footer slots, with the shadcn radius + borders.</text>
          <template #footer>
            <view class="flex flex-row gap-2">
              <VyButton size="sm" variant="soft" color="neutral" label="Cancel" />
              <VyButton size="sm" label="Confirm" />
            </view>
          </template>
        </VyCard>
      </view>

      <view class="flex flex-col items-center pt-2 pb-6">
        <text class="text-neutral-400 text-xs">@vyui/shadcn-demo · Vue-Lynx · Tailwind v3</text>
      </view>
    </view>
  </scroll-view>
</template>
