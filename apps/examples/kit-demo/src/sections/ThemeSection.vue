<script setup lang="ts">
import { VyIcon } from '@vyui/kit'

type PaletteName = 'green' | 'rose' | 'blue' | 'violet' | 'amber' | 'teal' | 'pink' | 'orange'
type NeutralName = 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'

const primaryPalette = defineModel<PaletteName>('primaryPalette', { required: true })
const secondaryPalette = defineModel<PaletteName>('secondaryPalette', { required: true })
const neutralPalette = defineModel<NeutralName>('neutralPalette', { required: true })
const radius = defineModel<number>('radius', { required: true })

const palettes: { name: PaletteName, hex: string }[] = [
  { name: 'green',  hex: '#22c55e' },
  { name: 'rose',   hex: '#f43f5e' },
  { name: 'blue',   hex: '#3b82f6' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'amber',  hex: '#f59e0b' },
  { name: 'teal',   hex: '#14b8a6' },
  { name: 'pink',   hex: '#ec4899' },
  { name: 'orange', hex: '#f97316' },
]
const neutralPalettes: { name: NeutralName, hex: string }[] = [
  { name: 'slate',   hex: '#64748b' },
  { name: 'gray',    hex: '#6b7280' },
  { name: 'zinc',    hex: '#71717a' },
  { name: 'neutral', hex: '#737373' },
  { name: 'stone',   hex: '#78716c' },
]

// Radius base in rem — drives `--ui-radius`. Every `rounded-{tier}` utility
// resolves to a multiple of it via the @vyui/kit Tailwind preset
// (e.g. `rounded-md` → `calc(var(--ui-radius) * 1.5)`).
const radiusSteps = [0, 0.125, 0.25, 0.375, 0.5] as const

const showcaseIcons = [
  'icon-park-outline:home',
  'icon-park-outline:setting',
  'icon-park-outline:like',
  'icon-park-outline:message',
  'icon-park-outline:user',
  'icon-park-outline:search',
  'icon-park-outline:bell-ring',
  'icon-park-outline:camera',
]
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- Palettes -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-4">
      <text class="text-slate-900 text-base font-semibold">Palettes</text>

      <view class="flex flex-col gap-2">
        <view class="flex flex-row items-baseline justify-between">
          <text class="text-slate-700 text-sm font-medium">primary</text>
          <text class="text-slate-500 text-xs">{{ primaryPalette }}</text>
        </view>
        <view class="flex flex-row flex-wrap gap-3">
          <view
            v-for="p in palettes"
            :key="`p-${p.name}`"
            :class="[
              'w-9 h-9 rounded-full border-2',
              primaryPalette === p.name ? 'border-slate-900' : 'border-transparent',
            ]"
            :style="{ backgroundColor: p.hex }"
            @tap="primaryPalette = p.name"
          />
        </view>
      </view>

      <view class="flex flex-col gap-2">
        <view class="flex flex-row items-baseline justify-between">
          <text class="text-slate-700 text-sm font-medium">secondary</text>
          <text class="text-slate-500 text-xs">{{ secondaryPalette }}</text>
        </view>
        <view class="flex flex-row flex-wrap gap-3">
          <view
            v-for="p in palettes"
            :key="`s-${p.name}`"
            :class="[
              'w-9 h-9 rounded-full border-2',
              secondaryPalette === p.name ? 'border-slate-900' : 'border-transparent',
            ]"
            :style="{ backgroundColor: p.hex }"
            @tap="secondaryPalette = p.name"
          />
        </view>
      </view>

      <view class="flex flex-col gap-2">
        <view class="flex flex-row items-baseline justify-between">
          <text class="text-slate-700 text-sm font-medium">neutral</text>
          <text class="text-slate-500 text-xs">{{ neutralPalette }}</text>
        </view>
        <view class="flex flex-row flex-wrap gap-3">
          <view
            v-for="p in neutralPalettes"
            :key="`n-${p.name}`"
            :class="[
              'w-9 h-9 rounded-full border-2',
              neutralPalette === p.name ? 'border-slate-900' : 'border-transparent',
            ]"
            :style="{ backgroundColor: p.hex }"
            @tap="neutralPalette = p.name"
          />
        </view>
      </view>
    </view>

    <!-- Radius -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-baseline justify-between">
        <text class="text-slate-900 text-base font-semibold">Radius</text>
        <text class="text-slate-500 text-xs">{{ radius }}rem</text>
      </view>
      <text class="text-slate-500 text-xs">Sets <text class="font-mono">--ui-radius</text>. Every <text class="font-mono">rounded-*</text> utility scales from it.</text>
      <view class="flex flex-row flex-wrap gap-2 pt-1">
        <view
          v-for="step in radiusSteps"
          :key="`r-${step}`"
          :class="[
            'w-12 h-12 border-2 bg-primary-500',
            radius === step ? 'border-slate-900' : 'border-transparent',
          ]"
          :style="{ borderRadius: `${step}rem` }"
          @tap="radius = step"
        />
      </view>
    </view>

    <!-- Icons -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">icon-park-outline</text>
      <text class="text-slate-500 text-xs">Iconify set registered via registerIconSet().</text>
      <view class="flex flex-row flex-wrap gap-4 pt-1">
        <view
          v-for="icon in showcaseIcons"
          :key="icon"
          class="flex flex-col items-center gap-1 w-16"
        >
          <VyIcon :name="icon" :size="28" color="#0f172a" />
          <text class="text-slate-500 text-xs text-center">{{ icon.replace('icon-park-outline:', '') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
