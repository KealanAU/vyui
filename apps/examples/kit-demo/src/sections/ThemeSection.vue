<script setup lang="ts">
import { ref } from 'vue'
import { VyBadge, VyButton, VyIcon, VySelect } from '@vyui/kit'

type PaletteName = 'green' | 'rose' | 'blue' | 'violet' | 'amber' | 'teal' | 'pink' | 'orange'

// Active semantic color for the top showcase — pick one from the dropdown and
// the sample components below lock to it. Includes the custom `tertiary`.
const semanticColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral', 'tertiary'] as const
type SemanticColor = typeof semanticColors[number]
const activeColor = ref<SemanticColor>('primary')
const colorItems = semanticColors.map(c => ({ value: c, label: c }))
// VySelect emits `string`; narrow back to the union for the typed `color` prop.
const setActiveColor = (value: string) => { activeColor.value = value as SemanticColor }

// Reactive map color→palette, owned by App and shared by reference. Modeled
// (not `defineProps`) so the section uses only `defineModel` — mixing
// `defineProps` + `defineModel` makes the compiler emit `mergeModels`, which
// the vue-lynx runtime shim doesn't provide. Mutating entries propagates to App
// via the shared reference.
const colorPalettes = defineModel<Record<string, string>>('colorPalettes', { required: true })
const neutralPalette = defineModel<string>('neutralPalette', { required: true })
const radius = defineModel<number>('radius', { required: true })

// `primary` and `neutral` use the swatch grid; the other configurable colors
// (incl. the custom `tertiary`) use a compact swatch + Select instead.
const otherColors = ['secondary', 'success', 'info', 'warning', 'error', 'tertiary'] as const

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

// Neutral swatch grid — Tailwind's gray families.
const neutralPalettes: { name: string, hex: string }[] = [
  { name: 'slate',   hex: '#64748b' },
  { name: 'gray',    hex: '#6b7280' },
  { name: 'zinc',    hex: '#71717a' },
  { name: 'neutral', hex: '#737373' },
  { name: 'stone',   hex: '#78716c' },
]

// Select options for the non-swatch colors.
const paletteItems = palettes.map(p => ({ value: p.name, label: p.name }))
const paletteHex = (name: string) => palettes.find(p => p.name === name)?.hex ?? '#94a3b8'

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
    <!-- Active color — pick one from the dropdown; samples lock to it -->
    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-baseline justify-between">
        <text class="text-highlighted text-base font-semibold">Color</text>
        <text class="text-muted text-xs">{{ activeColor }}</text>
      </view>
      <text class="text-muted text-xs">Pick any semantic color (incl. the custom <text class="font-mono">tertiary</text>) — the samples below render in it.</text>
      <VySelect
        :model-value="activeColor"
        :items="colorItems"
        placeholder="Pick a color"
        size="sm"
        @update:model-value="setActiveColor"
      />
      <view class="flex flex-row flex-wrap items-center gap-2 pt-1">
        <VyButton :color="activeColor" :label="activeColor" size="sm" />
        <VyButton :color="activeColor" variant="soft" label="Soft" size="sm" />
        <VyButton :color="activeColor" variant="outline" label="Outline" size="sm" />
        <VyBadge :color="activeColor" :label="activeColor" />
      </view>
    </view>

    <!-- Palettes -->
    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-4">
      <text class="text-highlighted text-base font-semibold">Palettes</text>

      <!-- primary — swatch grid -->
      <view class="flex flex-col gap-2">
        <view class="flex flex-row items-baseline justify-between">
          <text class="text-default text-sm font-medium">primary</text>
          <text class="text-muted text-xs">{{ colorPalettes.primary }}</text>
        </view>
        <view class="flex flex-row flex-wrap gap-3">
          <view
            v-for="p in palettes"
            :key="`primary-${p.name}`"
            :class="[
              'w-9 h-9 rounded-full border-2',
              colorPalettes.primary === p.name ? 'border-inverted' : 'border-transparent',
            ]"
            :style="{ backgroundColor: p.hex }"
            @tap="colorPalettes.primary = p.name"
          />
        </view>
      </view>

      <!-- neutral — same swatch grid, gray families -->
      <view class="flex flex-col gap-2">
        <view class="flex flex-row items-baseline justify-between">
          <text class="text-default text-sm font-medium">neutral</text>
          <text class="text-muted text-xs">{{ neutralPalette }}</text>
        </view>
        <view class="flex flex-row flex-wrap gap-3">
          <view
            v-for="p in neutralPalettes"
            :key="`neutral-${p.name}`"
            :class="[
              'w-9 h-9 rounded-full border-2',
              neutralPalette === p.name ? 'border-inverted' : 'border-transparent',
            ]"
            :style="{ backgroundColor: p.hex }"
            @tap="neutralPalette = p.name"
          />
        </view>
      </view>

      <!-- the rest — current-color swatch + Select -->
      <view
        v-for="c in otherColors"
        :key="`select-${c}`"
        class="flex flex-row items-center justify-between gap-3"
      >
        <view class="flex flex-row items-center gap-2">
          <view class="w-6 h-6 rounded-full" :style="{ backgroundColor: paletteHex(colorPalettes[c]) }" />
          <text class="text-default text-sm font-medium">{{ c }}</text>
        </view>
        <view class="w-36">
          <VySelect v-model="colorPalettes[c]" :items="paletteItems" :placeholder="c" size="sm" />
        </view>
      </view>
    </view>

    <!-- Radius -->
    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-baseline justify-between">
        <text class="text-highlighted text-base font-semibold">Radius</text>
        <text class="text-muted text-xs">{{ radius }}rem</text>
      </view>
      <text class="text-muted text-xs">Sets <text class="font-mono">--ui-radius</text>. Every <text class="font-mono">rounded-*</text> utility scales from it.</text>
      <view class="flex flex-row flex-wrap gap-2 pt-1">
        <view
          v-for="step in radiusSteps"
          :key="`r-${step}`"
          :class="[
            'w-12 h-12 border-2 bg-primary-500',
            radius === step ? 'border-inverted' : 'border-transparent',
          ]"
          :style="{ borderRadius: `${step}rem` }"
          @tap="radius = step"
        />
      </view>
    </view>

    <!-- Icons -->
    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-3">
      <text class="text-highlighted text-base font-semibold">icon-park-outline</text>
      <text class="text-muted text-xs">Iconify set registered via registerIconSet().</text>
      <view class="flex flex-row flex-wrap gap-4 pt-1">
        <view
          v-for="icon in showcaseIcons"
          :key="icon"
          class="flex flex-col items-center gap-1 w-16"
        >
          <VyIcon :name="icon" :size="28" color="#0f172a" />
          <text class="text-muted text-xs text-center">{{ icon.replace('icon-park-outline:', '') }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
