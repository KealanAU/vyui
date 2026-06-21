---
title: Select
description: Choose one value from a list presented in a mobile sheet.
navigation:
  icon: i-lucide-list-check
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Select.vue
    target: _blank
---

## Overview

`VySelect` combines the `@vyui/core` select and sheet primitives into a touch-oriented single-value picker. It supports primitive or object items, groups, labels, separators, disabled options, custom item slots, semantic trigger variants, and configurable sheet snap points.

::component-code
---
name: select-example
height: 120px
---
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySelect } from '@vyui/kit'

const value = ref<string>()
const items = ['Vue', 'React', 'Svelte']
</script>

<template>
  <VySelect
    v-model="value"
    :items="items"
    placeholder="Choose a framework"
  />
</template>
```

Item values are normalized to strings, and `modelValue` is always a string.

### Object items and groups

Pass nested arrays to render multiple groups. Structural rows use `type: 'label'` or `type: 'separator'`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySelect } from '@vyui/kit'

const value = ref('stockholm')
const items = [
  [
    { type: 'label', label: 'Europe' },
    { label: 'Stockholm', value: 'stockholm', icon: 'i-lucide-landmark' },
    { label: 'Lisbon', value: 'lisbon' },
  ],
  [
    { type: 'label', label: 'Americas' },
    { label: 'Toronto', value: 'toronto' },
    { label: 'New York', value: 'new-york', disabled: true },
  ],
]
</script>

<template>
  <VySelect v-model="value" :items="items" placeholder="Choose a city" />
</template>
```

### Custom keys

Use `valueKey` and `labelKey` when the object shape comes from an API.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySelect } from '@vyui/kit'

const value = ref('pro')
const plans = [
  { id: 'free', name: 'Free' },
  { id: 'pro', name: 'Pro' },
]
</script>

<template>
  <VySelect
    v-model="value"
    :items="plans"
    value-key="id"
    label-key="name"
    placeholder="Choose a plan"
  />
</template>
```

### Custom trigger and rows

```vue
<template>
  <VySelect v-model="value" :items="items" placeholder="Choose a person">
    <template #leading="{ iconColor }">
      <VyIcon name="i-lucide-user" :color="iconColor" />
    </template>

    <template #item-label="{ item }">
      {{ typeof item === 'object' ? item.label : item }}
    </template>

    <template #item-trailing="{ item }">
      <text v-if="typeof item === 'object' && item.meta" class="text-xs text-neutral-400">
        {{ item.meta }}
      </text>
    </template>
  </VySelect>
</template>
```

## Features and behavior

- Tapping the trigger opens a bottom sheet; tapping an enabled item selects it and closes the sheet.
- `modelValue` controls selection. `defaultValue` initializes the core uncontrolled selection.
- Primitive numbers and object values are converted with `String()`.
- Flat items render as one group. Nested arrays render separate groups.
- `placeholder` appears in the empty trigger and as the sheet heading.
- `type: 'label'` and `type: 'separator'` object items are structural and cannot be selected.
- `presentation="anchor"` is accepted for API parity but currently still renders the sheet presentation.
- The trigger's displayed selected label is derived from `modelValue`; bind `v-model` when the selected text must be shown reliably.

### Select item

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Display label when using the default `labelKey`. |
| `value` | `string \| number` | — | Selectable value when using the default `valueKey`; normalized to a string. |
| `icon` | `string` | — | Leading Iconify icon for a selectable row. |
| `type` | `'item' \| 'label' \| 'separator'` | `'item'` | Selectable or structural row type. |
| `disabled` | `boolean` | `false` | Prevents a selectable row from being chosen. |
| `[key: string]` | `any` | — | Additional data available to item slots. |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `SelectItems` | `undefined` | Flat or grouped strings, numbers, and object items. |
| `modelValue` | `string` | `undefined` | Controlled selected value used by `v-model`. |
| `defaultValue` | `string` | `undefined` | Initial value for uncontrolled core selection. |
| `placeholder` | `string` | `undefined` | Empty trigger text and sheet title. |
| `disabled` | `boolean` | `false` | Prevents the trigger from opening. |
| `name` | `string` | `undefined` | Name forwarded to the core form control. |
| `color` | `Color` | `'primary'` | Semantic trigger border and icon color. |
| `variant` | `'outline' \| 'soft' \| 'subtle' \| 'ghost' \| 'none'` | `'outline'` | Trigger surface style. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Trigger, row, text, and icon scale. |
| `highlight` | `boolean` | `false` | Forces a static border using `color`. |
| `trailingIcon` | `string` | App icon / `i-lucide-chevron-down` | Trigger trailing Iconify name. |
| `selectedIcon` | `string` | App icon / `i-lucide-check` | Icon shown on the selected row. |
| `presentation` | `'sheet' \| 'anchor'` | `'sheet'` | Requested presentation; both values currently use the sheet. |
| `snapPoints` | `number[]` | `[0.5]` | Sheet snap fractions forwarded to `SheetRoot`. |
| `handle` | `boolean` | `true` | Shows the sheet drag handle. |
| `valueKey` | `string` | `'value'` | Object field read as the item value. |
| `labelKey` | `string` | `'label'` | Object field read as the item label. |
| `class` | `any` | `undefined` | Classes merged onto the trigger surface. |
| `ui` | `Partial<Record<SelectSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`SelectItems` is `(SelectItem | string | number)[]` or a nested array of those values. `Color` supports the default semantic registry and application extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Emitted after an enabled item is selected. |

The sheet open state is internal and is not emitted by the kit wrapper.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ modelValue?: string, open: boolean }` | Replaces the selected value or placeholder inside the trigger. |
| `leading` | `{ modelValue?: string, open: boolean, iconColor: string }` | Adds leading trigger content. |
| `trailing` | `{ modelValue?: string, open: boolean, iconColor: string }` | Replaces the trailing trigger icon. |
| `item` | `{ item, index }` | Replaces all built-in content inside a selectable row. |
| `item-leading` | `{ item, index }` | Replaces the built-in item icon. |
| `item-label` | `{ item, index }` | Replaces the item label. |
| `item-trailing` | `{ item, index }` | Adds content before the selected indicator. |

`index` is the zero-based position within the item's group, not the flattened list.

## Styling and theming

Override globally through `appConfig.ui.select` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `base` | Trigger surface, spacing, border, and disabled state. |
| `value` / `placeholder` | Selected and empty trigger text. |
| `leading` / `trailing` / `trailingIcon` | Trigger accessory layout and built-in chevron. |
| `content` / `handle` | Sheet panel and drag handle. |
| `sheetHeader` / `sheetTitle` | Placeholder-derived sheet heading. |
| `viewport` / `group` | Scrollable list and group layout. |
| `label` / `separator` | Structural item rows. |
| `item` / `itemLabel` | Selectable row and text. |
| `itemLeadingIcon` | Built-in item icon. |
| `itemTrailing` / `itemTrailingIcon` | Trailing content and selected indicator. |

The theme also defines reserved `root`, `arrow`, `empty`, avatar, and leading-icon slots that the current template does not render. `color`, `variant`, `size`, and `highlight` style the trigger; option rows remain neutral by default.

## Accessibility

The core trigger exposes native button semantics and announces collapsed, expanded, or disabled state. Selectable rows expose option semantics, selected state, and disabled state. Keep the placeholder and custom trigger content descriptive, and ensure a custom `item` slot still includes a clear text label.

The sheet is optimized for touch selection. Test custom rows with VoiceOver and TalkBack, especially when visual metadata is the only distinction between options.

## Platform notes

- The list is rendered in a native bottom sheet with a dismissible backdrop and a vertically scrollable viewport.
- The default `[0.5]` snap point opens the picker at half the viewport height.
- Lynx SVG does not inherit `currentColor`; trigger slots receive a resolved `iconColor` for custom icons.
- `anchor` presentation is not implemented yet and falls back to the same sheet behavior.
- Empty object values become an empty string, which is not a valid selectable value in the core primitive. Ensure every selectable object has a populated `valueKey`.

## Related components

- `Combobox` for searchable selection.
- `DropdownMenu` for action-oriented choices.
- `ActionSheet` for actions that do not represent a form value.
- The `@vyui/core` select primitives for custom presentations.
