<script setup lang="ts">
import { ref } from 'vue'
import { VyBadge, VyButton, VyIcon, VySelect } from '@vyui/kit'

type PaletteName = 'green' | 'rose' | 'blue' | 'violet' | 'amber' | 'teal' | 'pink' | 'orange' | 'zinc' | 'black'

// Style presets. A vyui "style" (what `vyui init --style <name>` bakes in — see
// the STYLES array in tools/gen-registry.ts) is almost entirely a TOKEN-layer
// choice, so each preset here is just a saved position of the knobs below:
// which grey family the semantic tokens use, which palette `primary` renders
// as, and the radius base. Picking one moves those knobs; they stay live after.
//
// `luna` and `lunaris` share the LUNA grey family and differ only in accent —
// that is the actual relationship between the two upstream variants.
//
// NOT covered: the per-component `appConfig` deltas a style can also carry
// (shadcn's near-black default button). The tv factory is memoized on the
// provided config (see useStyledComponent), so those can't be swapped live
// without a fresh config object — `apps/examples/shadcn-demo` shows that half.
const stylePresets = {
  default: { neutral: 'slate', primary: 'green', radius: 0.25 },
  // `luna` is not a registry style — LUNA's neutral variant is `lunaris` with a
  // monochrome accent, which is a palette choice, not a style. It stays here as
  // a preset because that composition is exactly why it needs no namespace.
  luna: { neutral: 'luna', primary: 'black', radius: 0.25 },
  lunaris: { neutral: 'luna', primary: 'rose', radius: 0.25 },
  // shadcn's accent follows `--base-color`, so both knobs move together; this
  // shows the `--base-color zinc` configuration.
  shadcn: { neutral: 'zinc', primary: 'zinc', radius: 0.5 },
} as const
type StyleName = keyof typeof stylePresets
const styleNames = Object.keys(stylePresets) as StyleName[]
const activeStyle = ref<StyleName>('default')

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

function setStyle(name: StyleName): void {
  const preset = stylePresets[name]
  activeStyle.value = name
  neutralPalette.value = preset.neutral
  colorPalettes.value.primary = preset.primary
  radius.value = preset.radius
}

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
  { name: 'zinc',   hex: '#71717a' },
  // Monochrome accent — the shadcn/LUNA near-black button. Not a Tailwind
  // palette; the ramp is spelled out in index.css.
  { name: 'black',  hex: '#171717' },
]

// Neutral swatch grid — Tailwind's gray families, plus `luna`: the LUNA design
// system's own grey family (canvas / paper / content / line), which is what the
// `luna` and `lunaris` style presets ride. See index.css.
const neutralPalettes: { name: string, hex: string }[] = [
  { name: 'slate',   hex: '#64748b' },
  { name: 'gray',    hex: '#6b7280' },
  { name: 'zinc',    hex: '#71717a' },
  { name: 'neutral', hex: '#737373' },
  { name: 'stone',   hex: '#78716c' },
  { name: 'luna',    hex: '#5d5d5d' },
]

// Select options for the non-swatch colors.
const paletteItems = palettes.map(p => ({ value: p.name, label: p.name }))
const paletteHex = (name: string) => palettes.find(p => p.name === name)?.hex ?? '#94a3b8'

// Radius base in rem — drives `--ui-radius`. Every `rounded-{tier}` utility
// resolves to a multiple of it via the @vyui/kit Tailwind preset
// (e.g. `rounded-md` → `calc(var(--ui-radius) * 1.5)`).
const radiusSteps = [0, 0.125, 0.25, 0.375, 0.5] as const

// LUNA's five shipped gradients (see index.css), plus the literal-hex control.
// The five use `var()` stops; the control inlines the same two hexes. If the
// control paints and `rose` doesn't, Lynx won't resolve vars inside a
// `linear-gradient()` and `styles/lunaris/style.css` has to inline its stops.
const lunaGradients = [
  { class: 'luna-gradient', label: 'gradient' },
  { class: 'luna-gradient-rose', label: 'rose' },
  { class: 'luna-gradient-berry', label: 'berry' },
  { class: 'luna-gradient-afterglow', label: 'afterglow' },
  { class: 'luna-gradient-ocean', label: 'ocean' },
  { class: 'luna-gradient-literal', label: 'literal (control)' },
]

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

// Same icon set, baked to the active semantic hex instead of a flat neutral —
// reuses `paletteHex`/`colorPalettes` from the Palettes section above, so
// flipping a swatch there also retints these.
const colorShowcaseIcons: { icon: string, semantic: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' }[] = [
  { icon: 'icon-park-outline:like', semantic: 'primary' },
  { icon: 'icon-park-outline:message', semantic: 'secondary' },
  { icon: 'icon-park-outline:check-one', semantic: 'success' },
  { icon: 'icon-park-outline:info', semantic: 'info' },
  { icon: 'icon-park-outline:caution', semantic: 'warning' },
  { icon: 'icon-park-outline:close-one', semantic: 'error' },
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

    <!-- Style presets -->
    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-baseline justify-between">
        <text class="text-highlighted text-base font-semibold">Style</text>
        <text class="text-muted text-xs">{{ activeStyle }}</text>
      </view>
      <text class="text-muted text-xs">The registry styles (<text class="font-mono">vyui init --style</text>). Each one just moves the knobs on this page — grey family, <text class="font-mono">primary</text> palette, radius — so keep tweaking after picking one.</text>
      <view class="flex flex-row flex-wrap gap-2 pt-1">
        <VyButton
          v-for="name in styleNames"
          :key="name"
          size="xs"
          color="neutral"
          :variant="activeStyle === name ? 'solid' : 'soft'"
          :label="name"
          @tap="setStyle(name)"
        />
      </view>
    </view>

    <!-- LUNA gradients -->
    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-3">
      <text class="text-highlighted text-base font-semibold">LUNA gradients</text>
      <text class="text-muted text-xs">Ships with the <text class="font-mono">lunaris</text> style. Stops are <text class="font-mono">var()</text> refs — if the last tile paints and the others don't, Lynx can't resolve vars inside a gradient.</text>
      <view class="flex flex-row flex-wrap gap-3 pt-1">
        <view
          v-for="g in lunaGradients"
          :key="g.class"
          class="flex flex-col items-center gap-1 w-20"
        >
          <view :class="[g.class, 'w-20 h-14 rounded-md border border-default']" />
          <text class="text-muted text-xs text-center">{{ g.label }}</text>
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

      <text class="text-default text-sm font-medium pt-1">with color</text>
      <view class="flex flex-row flex-wrap gap-4 pt-1">
        <view
          v-for="entry in colorShowcaseIcons"
          :key="entry.icon"
          class="flex flex-col items-center gap-1 w-16"
        >
          <VyIcon :name="entry.icon" :size="28" :color="paletteHex(colorPalettes[entry.semantic])" />
          <text class="text-muted text-xs text-center">{{ entry.semantic }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
