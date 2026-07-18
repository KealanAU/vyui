---
title: Island
description: Build a floating or inline pill that can select, morph, and expand.
navigation:
  icon: i-lucide-panel-bottom
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Island.vue
    target: _blank
---

## Overview

`VyIsland` is a Linear-inspired container for compact navigation and actions. It can float at a viewport edge or participate in normal layout, and it coordinates three independent state axes for child `VyIslandButton` components: selected `value`, active row `mode`, and expanded `open` state.

::component-code
---
name: island-example
height: 160px
---
::

## Usage

Compose an island from `VyIslandButton` children. Set `layer="inline"` when the island should remain in document flow.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyIsland } from '@vyui/kit/island'
import { VyIslandButton } from '@vyui/kit/island-button'

const section = ref<string | number | null>('inbox')
</script>

<template>
  <VyIsland v-model:value="section" layer="inline">
    <VyIslandButton value="inbox" icon="i-lucide-inbox" />
    <VyIslandButton value="activity" icon="i-lucide-bell" />
    <VyIslandButton value="profile" icon="i-lucide-user" />
  </VyIsland>
</template>
```

Buttons with a `value` update the island model and automatically receive active styling when their value matches.

### Row modes

Use `mode` to replace the normal row with a named slot. Mode names are free-form strings. A button with the same `mode` switches the parent, and a button with `reset` returns it to `default`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyIsland } from '@vyui/kit/island'
import { VyIslandButton } from '@vyui/kit/island-button'

const mode = ref('default')
</script>

<template>
  <VyIsland v-model:mode="mode" layer="inline">
    <VyIslandButton icon="i-lucide-inbox" />
    <VyIslandButton mode="search" icon="i-lucide-search" />

    <template #search>
      <VyIslandButton
        reset
        icon="i-lucide-search"
        label="Search messages…"
        :style="{ flexGrow: 1, justifyContent: 'flex-start' }"
      />
      <VyIslandButton reset icon="i-lucide-x" />
    </template>
  </VyIsland>
</template>
```

If the current mode has no matching named slot, the island safely falls back to the default slot.

### Expandable panel

Add an `expanded` slot and use an `expand` button to toggle it. For a bottom island, the panel appears above the row; `position="top"` places it below.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyIsland } from '@vyui/kit/island'
import { VyIslandButton } from '@vyui/kit/island-button'

const open = ref(false)
</script>

<template>
  <VyIsland v-model:open="open" layer="inline">
    <VyIslandButton icon="i-lucide-home" />
    <VyIslandButton
      expand
      :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
    />

    <template #expanded="{ close }">
      <VyIslandButton
        icon="i-lucide-settings"
        label="Settings"
        class="w-full justify-start"
        @tap="close"
      />
      <VyIslandButton
        icon="i-lucide-circle-help"
        label="Help"
        class="w-full justify-start"
        @tap="close"
      />
    </template>
  </VyIsland>
</template>
```

`expand-style="floating"` keeps the panel and row as separate surfaces. Use `expand-style="attached"` to merge them into one rounded surface while open.

### Floating placement

The default `layer="overlay"` fixes the island 16 pixels from the bottom edge at `z-index: 50`.

```vue
<VyIsland position="top" layer="base" size="sm">
  <VyIslandButton icon="i-lucide-arrow-left" accessibility-label="Go back" />
  <VyIslandButton label="Project settings" />
</VyIsland>
```

Use `layer="base"` when drawers and modals should render above the island. Use `layer="inline"` for cards, toolbars, custom corner placement, or islands managed by `VyIslandGroup`.

## Features and behavior

- `value`, `mode`, and `open` are independent; one island can use any combination of them.
- Each axis supports controlled state through `v-model:*` and uncontrolled state through its matching `default*` prop.
- In controlled mode, the component emits an update but continues to render the supplied prop until the parent updates it.
- A single renderable row child activates compact symmetric padding, allowing an icon-only island to appear circular.
- Whitespace, comments, false `v-if` branches, and fragments are handled when counting row children.
- The `expanded` slot must exist for the island to enter its rendered open state. Without it, `open` can update, but no panel appears and slot props report `open: false`.
- `size` is provided to descendant `VyIslandButton` components. A button's explicit `size` takes precedence.
- `data-state` is `open` or `closed`, and `data-mode` contains the resolved row mode.

### State composition

The default and named row slots, plus the `expanded` slot, all receive the same state helpers.

```vue
<VyIsland v-slot="{ value, setValue, toggle }" layer="inline">
  <VyIslandButton
    label="Inbox"
    :active="value === 'inbox'"
    @tap="setValue('inbox')"
  />
  <VyIslandButton label="More" @tap="toggle" />

  <template #expanded="{ setMode, close }">
    <VyIslandButton label="Compose" @tap="setMode('compose')" />
    <VyIslandButton label="Close" @tap="close" />
  </template>
</VyIsland>
```

Prefer the declarative `value`, `mode`, `expand`, and `reset` props on `VyIslandButton` for common cases. The helpers are useful for custom content or compound actions.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Controlled expanded state used by `v-model:open`. |
| `defaultOpen` | `boolean` | `false` | Initial expanded state when uncontrolled. |
| `mode` | `string` | `undefined` | Controlled row mode used by `v-model:mode`. |
| `defaultMode` | `string` | `'default'` | Initial row mode when uncontrolled. |
| `value` | `string \| number \| null` | `undefined` | Controlled selected value used by `v-model:value`. |
| `defaultValue` | `string \| number \| null` | `null` | Initial selected value when uncontrolled. |
| `position` | `'top' \| 'bottom'` | `'bottom'` | Floating viewport edge and panel growth direction. Ignored by inline layers for placement. |
| `layer` | `'overlay' \| 'base' \| 'inline'` | `'overlay'` | Floating and stacking strategy. |
| `expandStyle` | `'floating' \| 'attached'` | `'floating'` | Visual relationship between the row and an open panel. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Island spacing and inherited button size. |
| `as` | `string` | `'view'` | Element or component used for the root. |
| `class` | `any` | `undefined` | Classes merged onto the root slot. |
| `ui` | `Partial<Record<IslandSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `boolean` | The expanded state changed. |
| `update:mode` | `string` | The active row mode changed. |
| `update:value` | `string \| number \| null` | The selected value changed. |

## Slots

Every slot receives `{ open, mode, value, setOpen, toggle, close, setMode, resetMode, setValue }`.

| Slot | Description |
| --- | --- |
| `default` | Row rendered when `mode` is `'default'` or the selected named slot does not exist. |
| `expanded` | Panel rendered while the resolved open state is true. Its presence enables the rendered open state. |
| `[mode]` | Any named slot whose name matches the current free-form `mode` value. |

`setOpen(boolean)`, `setMode(string)`, and `setValue(value)` write local state and emit their corresponding update event. `toggle`, `close`, and `resetMode` are convenience helpers.

## Styling and theming

Override globally through `appConfig.ui.island` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Outer layout, panel-to-row gap, width limit, and attached-surface chrome. |
| `row` | Main pill surface and horizontal child layout. |
| `panel` | Expandable surface, vertical layout, scrolling, and height limit. |

The theme combines `position`, `size`, `expandStyle`, rendered `open` state, and automatic `solo` detection.

| Size | Button target | Typical use |
| --- | --- | --- |
| `sm` | 40px | Compact toolbars and secondary islands. |
| `md` | 44px | Default controls and minimum comfortable target. |
| `lg` | 56px | Prominent mobile docks. |
| `xl` | 64px | Oversized or presentation-focused docks. |

Both surfaces use a translucent white background, backdrop blur, subtle border, and shadow. The default theme is light-mode-oriented. In attached mode, open-state chrome moves to `root`, the gap collapses, and `row` and `panel` become transparent sections.

## Accessibility

`VyIsland` is a visual and state-coordination container; it does not assign a navigation, toolbar, or group role. Choose the semantic context around it based on the content. Its built-in `VyIslandButton` children use native Lynx button semantics and announce disabled state.

Give every icon-only button an `accessibility-label`. When a `value` button represents navigation, expose the destination in visible or accessible text and communicate the current destination in surrounding page content; active styling alone is not a complete selection announcement. Keep custom mode and panel content in a predictable focus order, and test expanding or morphing layouts with VoiceOver and TalkBack.

## Platform notes

- Floating placement is applied with an inline `position: fixed` style because Lynx does not reliably apply the Tailwind `fixed` utility.
- Floating islands span the viewport from `left: 0` to `right: 0` and center the pill. Override inline `style` for custom offsets or corner placement.
- `overlay` uses `z-index: 50`; `base` uses `z-index: 10`; `inline` applies no positioning style.
- The panel grows away from the selected edge and is capped at `calc(100dvh - 4rem)` with vertical scrolling.
- The component uses Lynx `view` and `text` conventions rather than assuming DOM-only elements.

## Related components

- [`Island Button`](/components/island-button) for declarative actions, selection, modes, and expansion.
- [`Island Group`](/components/island-group) for positioning multiple companion islands together.
- [`Dropdown Menu`](/components/dropdown-menu) for an anchored menu with menu semantics.
- [`Tabs`](/components/tabs) for persistent peer panels with explicit tab behavior.
