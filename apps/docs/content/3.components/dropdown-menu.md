---
title: Dropdown Menu
description: A menu of actions anchored to the element that opens it.
navigation:
  icon: i-lucide-menu
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/DropdownMenu.vue
    target: _blank
category: Overlay
---

## Overview

`VyDropdownMenu` renders a list of actions in an overlay docked to its trigger. It composes the `@vyui/core` dropdown primitives, takes its rows from an `items` array, and measures the trigger on open so the menu appears beside it rather than centered on screen.

## Usage

The default slot is the trigger. It is already wired to toggle the menu, so do not add a `@tap` handler that also sets the open state.

```vue
<script setup lang="ts">
import { VyDropdownMenu } from '@vyui/kit/dropdown-menu'
import { VyButton } from '@vyui/kit/button'

const items = [
  { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => edit() },
  { label: 'Duplicate', icon: 'i-lucide-copy', onSelect: () => duplicate() },
  { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => remove() },
]
</script>

<template>
  <VyDropdownMenu :items="items">
    <VyButton label="Actions" trailing-icon="i-lucide-chevron-down" />
  </VyDropdownMenu>
</template>
```

### Groups

A nested array renders each inner array as a group with a separator between them. Inside a group, `type: 'separator'` and `type: 'label'` add structural rows.

```ts
const items = [
  [
    { type: 'label', label: 'Document' },
    { label: 'Rename', icon: 'i-lucide-pencil' },
    { label: 'Share', icon: 'i-lucide-share-2' },
  ],
  [
    { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' },
  ],
]
```

### Checkbox items

`type: 'checkbox'` renders a checked indicator and reports changes through `onUpdateChecked`.

```ts
const items = [
  { type: 'checkbox', label: 'Show archived', checked: showArchived, onUpdateChecked: (v: boolean) => (showArchived = v) },
]
```

### Positioning

`content` chooses the dock edge and offsets, defaulting to `{ side: 'bottom', sideOffset: 8, align: 'start' }`.

```vue
<template>
  <VyDropdownMenu :items="items" :content="{ side: 'top', align: 'end', sideOffset: 12 }">
    <VyButton icon="i-lucide-ellipsis-vertical" />
  </VyDropdownMenu>
</template>
```

### Custom rows

`#item`, `#item-leading`, `#item-label`, `#item-description`, and `#item-trailing` replace that part of every row. Give a single item a `slot` key to target it alone through `#{slot}-trailing` and friends.

```vue
<template>
  <VyDropdownMenu :items="items">
    <VyButton label="Account" />

    <template #item-trailing="{ item }">
      <text v-if="item.shortcut" class="text-xs text-muted">{{ item.shortcut }}</text>
    </template>
  </VyDropdownMenu>
</template>
```

## Features and behavior

- The trigger toggles the menu. Bind `open` with `v-model:open` only when the state also drives something else.
- `modal` (default `true`) blocks taps outside the menu from reaching the app; the backdrop still closes the menu.
- `onSelect` fires per item; `disabled` items ignore taps and dim, and `loading` spins the leading icon.
- `type` defaults to `'link'`. `'label'` and `'separator'` are structural and not selectable.
- Items and groups are flattened into one row list before rendering, so every row emits exactly one node — which is what the Vue-Lynx patcher expects.
- `labelKey` and `descriptionKey` read the label and sub-line from a different field when items come from an API.
- `checkedIcon` and `loadingIcon` fall back to `appConfig.ui.icons.check` and `appConfig.ui.icons.loading`.
- Submenus are not part of the kit wrapper; compose the core `DropdownMenuSub` primitives directly if you need them.

## API

### Props

::component-props{name="DropdownMenu"}
::

### Emits

::component-emits{name="DropdownMenu"}
::

### Slots

::component-slots{name="DropdownMenu"}
::

## Styling and theming

Override globally through `appConfig.ui.dropdownMenu` or per instance with `ui`.

| UI slot | Purpose |
| --- | --- |
| `content` | Menu panel surface, border, elevation, and scrolling. |
| `group` | Padding around a group of rows. |
| `label` | Non-interactive group heading. |
| `separator` | Divider between rows or groups. |
| `item` | Row layout, radius, and disabled state. |
| `itemWrapper` | Column holding the label and description. |
| `itemLabel` / `itemDescription` | Row text. |
| `itemLeadingIcon` / `itemLeadingAvatar` | Leading icon or avatar. |
| `itemTrailing` | Trailing content, including the checked indicator. |

`size` scales row padding, text, and the leading icon from `sm` through `xl`. `color` on an item colors its label and leading icon; the row surface stays neutral.

## Accessibility

Rows come from the core menu primitives, which expose menu-item semantics along with disabled and checked state. Give an icon-only trigger an `accessibility-label`, and keep a text label on every row — a custom `#item` slot that renders only an icon leaves the row unannounced.

## Platform notes

- The menu is portaled into the overlay root and docked by measuring the trigger with `useElementRect` on open and on `@layoutchange`, then aligning the overlay container with flex alignment and padding.
- The first frame after open has no measurement yet, so the panel is rendered transparent until the trigger rect arrives.
- Lynx rasterizes each SVG, so row icons are given a baked hex fill rather than inheriting a text color.

## Related components

- [`Select`](/components/select) for choosing a value rather than running an action.
- [`Popover`](/components/popover) for arbitrary anchored content.
- [`Drawer`](/components/drawer) for an action list presented from an edge.
