---
title: Island Button
description: Add actions, selections, mode switches, and expansion controls to an island.
navigation:
  icon: i-lucide-circle-ellipsis
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/IslandButton.vue
    target: _blank
---

## Overview

`VyIslandButton` is a pill-shaped action designed for `VyIsland`. Inside an island it can declaratively select a value, switch the row mode, toggle an expanded panel, or reset the mode. It also works as a standalone button.

::component-code
---
name: island-button-example
height: 140px
---
::

## Usage

Use `icon`, `label`, or both. Buttons inherit their size from the nearest `VyIsland`.

```vue
<script setup lang="ts">
import { VyIsland } from '@vyui/kit/island'
import { VyIslandButton } from '@vyui/kit/island-button'
</script>

<template>
  <VyIsland layer="inline" size="lg">
    <VyIslandButton icon="i-lucide-plus" label="New issue" />
    <VyIslandButton icon="i-lucide-settings" accessibility-label="Settings" />
  </VyIsland>
</template>
```

With no `label` and no default slot content, the button uses a square icon-only footprint. Supplying a label or default slot creates a wider pill.

### Selected values

Set `value` to connect the button to its parent island's `v-model:value`. Matching buttons become active automatically.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyIsland } from '@vyui/kit/island'
import { VyIslandButton } from '@vyui/kit/island-button'

const active = ref<string | number | null>('inbox')
</script>

<template>
  <VyIsland v-model:value="active" layer="inline">
    <VyIslandButton value="inbox" icon="i-lucide-inbox" label="Inbox" />
    <VyIslandButton value="saved" icon="i-lucide-bookmark" label="Saved" />
  </VyIsland>
</template>
```

The explicit `active` prop can force active styling independently of the parent's value.

### Mode and expansion controls

Declarative behavior props can be combined. On tap, the button applies `value`, then `mode`, then `expand`, then `reset`, before emitting its own `tap` event.

```vue
<script setup lang="ts">
import { VyIsland } from '@vyui/kit/island'
import { VyIslandButton } from '@vyui/kit/island-button'
</script>

<template>
  <VyIsland layer="inline">
    <VyIslandButton mode="search" icon="i-lucide-search" />
    <VyIslandButton expand icon="i-lucide-menu" />

    <template #search>
      <VyIslandButton
        reset
        icon="i-lucide-search"
        label="Search…"
        :style="{ flexGrow: 1 }"
      />
      <VyIslandButton reset icon="i-lucide-x" />
    </template>

    <template #expanded>
      <VyIslandButton expand icon="i-lucide-settings" label="Settings" />
      <VyIslandButton expand icon="i-lucide-circle-help" label="Help" />
    </template>
  </VyIsland>
</template>
```

`mode`, `expand`, and `reset` do nothing when the button has no parent island context; the normal `tap` event still fires.

### Custom content

The `leading` slot replaces the built-in icon. The default slot replaces the built-in label while retaining the leading icon.

```vue
<VyIslandButton icon="i-lucide-bell">
  <view class="flex flex-row items-center gap-1">
    <text>Notifications</text>
    <text class="rounded-full bg-red-500 px-1.5 text-xs text-white">3</text>
  </view>
</VyIslandButton>
```

When rendering a custom SVG icon in `leading`, pass an explicit color because Lynx SVG does not inherit text color.

## Features and behavior

- `value` sets the parent island's selected value and automatically participates in active-state matching.
- `mode` sets the parent island's free-form row mode.
- `expand` toggles the parent island's open state.
- `reset` sets the parent mode to `'default'`.
- Behavior props may be combined and run in the fixed order `value` → `mode` → `expand` → `reset`.
- Disabled buttons do not update island state and do not emit `tap`.
- `active` always enables active styling. Otherwise, a defined `value` is active when it strictly equals the parent value.
- An explicit `size` overrides the inherited island size. Standalone buttons default to `md`.
- Built-in icon sizes are 16, 20, 24, and 28 pixels for `sm`, `md`, `lg`, and `xl`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `string` | `undefined` | Leading Iconify icon name. |
| `label` | `string` | `undefined` | Built-in label text. Its presence creates a label-pill footprint. |
| `active` | `boolean` | `false` | Forces active styling. Parent value matching can also activate the button. |
| `disabled` | `boolean` | `false` | Prevents state changes and `tap` emission. |
| `value` | `string \| number` | `undefined` | Value written to the parent island on tap and used for automatic active state. |
| `mode` | `string` | `undefined` | Free-form row mode written to the parent island on tap. |
| `expand` | `boolean` | `false` | Toggles the parent island's open state on tap. |
| `reset` | `boolean` | `false` | Resets the parent island's mode to `'default'` on tap. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | Parent size / `'md'` | Explicit size override. |
| `class` | `any` | `undefined` | Classes merged onto the button base. |
| `ui` | `Partial<Record<IslandButtonSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `tap` | none | Emitted after enabled declarative parent updates have run. |

## Slots

| Slot | Description |
| --- | --- |
| `default` | Replaces the built-in label. The built-in leading icon remains. |
| `leading` | Replaces the built-in icon area entirely. |

Slot content does not receive scoped props.

## Styling and theming

Override globally through `appConfig.ui.islandButton` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `base` | Button layout, target size, spacing, surface states, and rounding. |
| `leadingIcon` | Built-in icon size and foreground color. |
| `label` | Built-in label size, truncation, and foreground color. |

The theme combines `size`, resolved `active` state, and automatic `iconOnly` detection.

| Size | Target | Icon |
| --- | --- | --- |
| `sm` | 40px | 16px |
| `md` | 44px | 20px |
| `lg` | 56px | 24px |
| `xl` | 64px | 28px |

Inactive buttons are transparent with slate foregrounds and a pressed background. Active buttons use a subtle dark surface and stronger foreground. Disabled buttons reduce opacity. The default theme is light-mode-oriented.

## Accessibility

The underlying `@vyui/core` button exposes native Lynx button semantics, blocks interaction when disabled, and announces disabled state. Pass `accessibility-label` for every icon-only button; attributes fall through to the underlying button root.

The active visual state does not currently add a pressed, selected, or current accessibility state. Use visible labels where possible, provide surrounding context for navigation state, and test value-driven island navigation with VoiceOver and TalkBack. Custom default content should retain a concise accessible name.

## Platform notes

- Interaction uses Lynx `tap`, exposed as Vue's `@tap`, rather than relying on a DOM click event.
- Lynx SVG does not inherit `currentColor`. The built-in icon resolves supported `text-{color}-{shade}`, `text-white`, and `text-black` classes into an explicit icon color.
- Arbitrary foreground classes such as `text-[#abc]` cannot be inferred for the built-in SVG; use a custom `leading` slot and explicit icon color when needed.
- Foreground classes live on `leadingIcon` and `label`, not only on `base`, because CSS inheritance is disabled in the Lynx build.

## Related components

- [`Island`](/components/island) for parent state, sizing, row modes, and expandable panels.
- [`Island Group`](/components/island-group) for arranging companion islands.
- [`Button`](/components/button) for a general-purpose action outside island layouts.
- [`Toggle`](/components/toggle) when the pressed state itself is the control's value.
