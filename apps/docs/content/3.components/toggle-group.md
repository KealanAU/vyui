---
title: Toggle Group
description: Select one or multiple values from a connected set of toggles.
navigation:
  icon: i-lucide-panels-top-left
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/ToggleGroup.vue
    target: _blank
category: Form
---

## Overview

`VyToggleGroup` renders connected toggle buttons from an items array. It supports single or multiple selection, controlled and uncontrolled values, horizontal or vertical layout, disabled items, icons, labels, and a custom item slot.

::component-code
---
name: toggle-group-example
height: 120px
---
::

::component-code
---
name: toggle-group-multiple
height: 120px
---
::

## Usage

Use `type="single"` with a scalar `v-model`. Primitive strings and numbers are normalized into matching labels and values.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyToggleGroup } from '@vyui/kit/toggle-group'

const alignment = ref('center')
const items = [
  { label: 'Left', value: 'left', icon: 'i-lucide-align-left' },
  { label: 'Center', value: 'center', icon: 'i-lucide-align-center' },
  { label: 'Right', value: 'right', icon: 'i-lucide-align-right' },
]
</script>

<template>
  <VyToggleGroup v-model="alignment" :items="items" />
</template>
```

### Multiple selection

Use an array model with `type="multiple"`. Tapping an item adds or removes its value.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyToggleGroup } from '@vyui/kit/toggle-group'

const formatting = ref<string[]>(['bold'])
const items = [
  { label: 'Bold', value: 'bold' },
  { label: 'Italic', value: 'italic' },
  { label: 'Underline', value: 'underline', disabled: true },
]
</script>

<template>
  <VyToggleGroup
    v-model="formatting"
    type="multiple"
    :items="items"
    color="secondary"
    variant="soft"
  />
</template>
```

### Custom items

The default slot replaces an entire item's built-in icon and label. It receives the normalized item, its index, and a resolved hex color for custom SVG icons.

```vue
<VyToggleGroup v-model="density" :items="items">
  <template #default="{ item, iconColor }">
    <VyIcon :name="item.icon" :color="iconColor" />
    <text>{{ item.label }}</text>
  </template>
</VyToggleGroup>
```

### Select boxes

Vertical orientation plus the default slot turns the group into a list of selectable cards: each box is one tap target, and selection paints the container border rather than a separate control. Override `ui.root` to replace the connected `-space-y-px` with a gap, and `ui.item` to round every corner and own the padding.

::component-code
---
name: toggle-group-select-box
height: 260px
---
::

Use `type="multiple"` for the multi-select form of the same layout. Render the check icon from your own model state, since the default slot exposes the item, not its pressed state.

## Features and behavior

- `single` mode stores one string or number. Tapping the selected item again clears the runtime value.
- `multiple` mode stores an array and toggles each tapped value independently.
- Use `modelValue` or `v-model` for controlled state, or `defaultValue` for an uncontrolled initial selection.
- String and number items become `{ value: item, label: String(item) }`.
- Object items use `value`, falling back to `label`; their label falls back to `String(value)`.
- Object items should provide at least `value` or `label`, and every resolved value should be unique because it is also used as the render key.
- Group-level `disabled` disables every item. An item's `disabled` field disables only that item.
- `orientation` changes connected-border layout; it does not reorder the supplied items.

### Toggle group item

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | String form of the resolved value | Visible item text. |
| `icon` | `string` | `undefined` | Leading Iconify icon name. |
| `value` | `string \| number` | `label` | Selection value and render key. |
| `disabled` | `boolean` | `false` | Prevents interaction for this item. |
| `[key: string]` | `any` | — | Additional application data retained on the normalized item and exposed to the slot. |

The `items` array also accepts primitive strings and numbers.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'single' \| 'multiple'` | `'single'` | Whether one value or multiple values can be selected. |
| `modelValue` | `string \| number \| Array<string \| number>` | `undefined` | Controlled selection; use an array for multiple mode. |
| `defaultValue` | `string \| number \| Array<string \| number>` | Single: `undefined`; multiple: `[]` | Initial uncontrolled selection. |
| `items` | `Array<ToggleGroupItem \| string \| number>` | `undefined` | Items to normalize and render. |
| `disabled` | `boolean` | `false` | Disables every item in the group. |
| `color` | `Color` | `'primary'` | Semantic selected-state color. |
| `variant` | `'outline' \| 'soft' \| 'subtle'` | `'outline'` | Item surface, border, and selected-state treatment. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Item padding, text size, gap, and icon size. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Connected row or column layout. |
| `class` | `any` | `undefined` | Classes merged onto the group root. |
| `ui` | `Partial<Record<ToggleGroupSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

Keep `type` coherent with the value shape: scalar for `single`, array for `multiple`. The kit wrapper always defaults an omitted `type` to `single`.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string \| number \| Array<string \| number>` | Emitted after selection changes. In single mode, deselecting the active item produces `undefined` at runtime. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ item, index, iconColor }` | Replaces the built-in icon and label for every item. `item` is normalized and `iconColor` is a resolved hex string. |

## Styling and theming

Override globally through `appConfig.ui.toggleGroup` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Group direction, wrapping, and connected overlap. |
| `item` | Toggle layout, spacing, borders, surfaces, rounding, and disabled state. |
| `leadingIcon` | Built-in icon size and state-dependent foreground. |
| `label` | Built-in label truncation and state-dependent foreground. |

The theme combines `color`, `variant`, `size`, and `orientation`.

| Variant | Appearance |
| --- | --- |
| `outline` | White items with neutral borders; selected items gain a semantic border and light surface. |
| `soft` | Neutral resting surface; selected items gain a stronger light semantic surface. |
| `subtle` | Lighter neutral border than `outline`; selected items use a soft semantic border and surface. |

Horizontal groups use a wrapping row, overlap adjacent borders by one pixel, and round the first and last inline edges. Vertical groups use a column, overlap horizontal borders, round the top and bottom items, and make each item full width.

## Accessibility

Each item is exposed by the core primitive as a focusable native button and announces `pressed` or `not pressed`. Disabled groups and items use the disabled trait.

The kit item shape does not currently forward an `accessibility-label` to individual toggle roots. Prefer visible, descriptive labels. Icon-only groups do not have a kit-level per-item labeling API today, so treat them as an accessibility limitation and test them with VoiceOver and TalkBack. The group root itself does not add a native group role, and the current accessibility layer does not bridge these semantics to web ARIA.

## Platform notes

- Items respond to Lynx `tap` events through the `@vyui/core` toggle primitives.
- Lynx SVG does not inherit `currentColor`; built-in icons receive a resolved hex color, and custom slots receive the same value as `iconColor`.
- Text color classes are applied directly to `leadingIcon` and `label` because CSS inheritance is disabled in the Lynx build.
- The default theme uses vyui's semantic surface/text/border tokens, so it adapts automatically under dark mode (see [Theming → Dark Mode](/theming/dark-mode)).

## Related components

- [`Toggle`](/components/toggle) for one independent pressed-state control.
- [`Radio Group`](/components/radio-group) for a required single-choice form field.
- [`Switch`](/components/switch) for an immediately applied binary setting.
