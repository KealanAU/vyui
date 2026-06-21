---
title: Number Field
description: Enter, increment, and constrain a numeric value.
navigation:
  icon: i-lucide-list-plus
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/NumberField.vue
    target: _blank
---

## Overview

`VyNumberField` combines a numeric input with decrement and increment controls. It supports controlled and uncontrolled values, minimum and maximum bounds, step snapping, decimal values, disabled and read-only states, semantic colors, and custom stepper content.

::component-playground{name="number-field"}
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyLabel, VyNumberField } from '@vyui/kit'

const quantity = ref<number | null>(1)
</script>

<template>
  <view class="flex flex-col gap-2">
    <VyLabel for="quantity">Quantity</VyLabel>
    <VyNumberField
      id="quantity"
      v-model="quantity"
      :min="0"
      :max="10"
    />
  </view>
</template>
```

The value is a `number` or `null`. Clearing the input emits `null`.

### Bounds and step

Typed values and stepper changes are clamped to `min` and `max`, then snapped to the nearest step.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyNumberField } from '@vyui/kit'

const price = ref<number | null>(2.5)
</script>

<template>
  <VyNumberField
    v-model="price"
    :min="0"
    :max="20"
    :step="0.5"
    placeholder="0.00"
    color="success"
    variant="soft"
  />
</template>
```

The step grid is anchored to a finite `min` when one is provided. Decimal precision is derived from both `step` and `min` to avoid accumulating floating-point artifacts.

### Empty values

An empty or invalid committed value becomes `null`. Stepping from an empty field starts at the value nearest zero within the configured bounds, then applies the step.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyNumberField } from '@vyui/kit'

const guests = ref<number | null>(null)
</script>

<template>
  <VyNumberField
    v-model="guests"
    :min="1"
    :max="12"
    placeholder="Guests"
  />
</template>
```

In this example, tapping increment from empty produces `2`: the starting point is clamped to the minimum value `1`, then incremented by the default step.

### Uncontrolled

Use `defaultValue` when the field should own its initial state.

```vue
<VyNumberField
  :default-value="4"
  :min="0"
  :max="20"
  :step="2"
  @update:model-value="value => console.log(value)"
/>
```

### Custom controls

The increment and decrement slots receive the resolved icon color as a hex string.

```vue
<VyNumberField v-model="count" color="secondary">
  <template #decrement="{ iconColor }">
    <VyIcon name="i-lucide-circle-minus" :color="iconColor" class="size-5" />
  </template>

  <template #increment="{ iconColor }">
    <VyIcon name="i-lucide-circle-plus" :color="iconColor" class="size-5" />
  </template>
</VyNumberField>
```

### Read-only and disabled

Both states prevent typing and stepping. Disabled styling is stronger because the native input and stepper controls expose disabled state; read-only primarily prevents editing.

```vue
<template>
  <view class="flex flex-col gap-3">
    <VyNumberField :model-value="8" readonly />
    <VyNumberField :model-value="8" disabled />
  </view>
</template>
```

## Features and behavior

- `v-model` controls a `number | null`; `defaultValue` initializes uncontrolled state.
- Input is parsed on every native input update and normalized again on blur.
- Values are clamped to `min` and `max` and snapped to the nearest `step`.
- Increment and decrement controls disable themselves at their corresponding bounds.
- `disabled` and `readonly` prevent input, increment, and decrement changes.
- A non-negative field with an integer step uses the Lynx `digit` keypad.
- Fields allowing negatives or fractional values use the Lynx `number` keypad.
- The input filter allows a leading minus sign only when `min < 0`, and a decimal point only when fractional values are reachable.
- Built-in icons resolve from their props, then `appConfig.ui.icons.plus` or `minus`, then Lucide fallbacks.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `number \| null` | `undefined` | Controlled numeric value used by `v-model`. `null` means empty. |
| `defaultValue` | `number \| null` | `undefined` | Initial value when uncontrolled. |
| `min` | `number` | `-Infinity` | Minimum committed value. |
| `max` | `number` | `Infinity` | Maximum committed value. |
| `step` | `number` | `1` | Stepper amount and value-snapping interval. |
| `disabled` | `boolean` | `false` | Prevents all interaction and applies disabled state. |
| `readonly` | `boolean` | `false` | Prevents value changes without using the input's disabled state. |
| `placeholder` | `string` | `undefined` | Text shown while the value is empty. |
| `incrementIcon` | `string` | App icon / `i-lucide-plus` | Iconify name for the increment control. |
| `decrementIcon` | `string` | App icon / `i-lucide-minus` | Iconify name for the decrement control. |
| `color` | `Color` | `'primary'` | Semantic border and icon color. |
| `variant` | `'outline' \| 'soft' \| 'subtle' \| 'ghost' \| 'none'` | `'outline'` | Root surface and border treatment. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Input padding, text size, control size, and icon size. |
| `id` | `string` | `undefined` | Identifier forwarded to the underlying input. |
| `class` | `any` | `undefined` | Classes merged onto the root container. |
| `ui` | `Partial<Record<NumberFieldSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `number \| null` | Emitted when typing or a stepper control commits a different value. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `decrement` | `{ iconColor: string }` | Replaces the built-in decrement icon. |
| `increment` | `{ iconColor: string }` | Replaces the built-in increment icon. |

## Styling and theming

Override globally through `appConfig.ui.numberField` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Bordered horizontal control and surface. The `class` prop is also merged here. |
| `base` | Native numeric input, centered value, placeholder, and input typography. |
| `decrement` | Decrement hit area and disabled/pressed state. |
| `increment` | Increment hit area and disabled/pressed state. |
| `decrementIcon` | Built-in decrement icon dimensions. |
| `incrementIcon` | Built-in increment icon dimensions. |

### Theme variants

| Variant | Values | Default | Effect |
| --- | --- | --- | --- |
| `color` | Registered semantic colors | `'primary'` | Colors bordered variants and resolves the built-in icon color. |
| `variant` | `outline`, `soft`, `subtle`, `ghost`, `none` | `'outline'` | Selects the root background and border treatment. |
| `size` | `sm`, `md`, `lg`, `xl` | `'md'` | Changes input padding, typography, button dimensions, and icon dimensions. |

`outline` and `subtle` use the selected semantic border color. `soft` uses a muted neutral surface, while `ghost` and `none` remove the visible border.

## Accessibility

The decrement and increment controls expose native button semantics, the labels “Decrease” and “Increase,” and disabled state at bounds. The input exposes the native keyboard accessibility trait. Keep a visible label next to every number field and explain units in nearby text when the value is not self-evident.

The root carries a web-style `role="group"`, but the current Lynx accessibility layer does not translate that attribute into a native group announcement. `VyNumberField` also does not expose a direct input `accessibility-label` prop. `id` and `VyLabel for` are forwarded as attributes, but native label association is not implemented by these primitives. Verify the accessible name with VoiceOver and TalkBack, and use the lower-level `@vyui/core` parts when native attributes must be attached directly to the input.

Do not rely only on a semantic border color to communicate validation. Pair invalid values with visible guidance or an error message.

## Platform notes

- The field is composed from `@vyui/core` NumberField primitives and a native Lynx input.
- Native input filtering limits characters before values are parsed, clamped, and snapped.
- Programmatic stepper updates are pushed imperatively to the native input because Lynx treats its `value` prop as initial-only after mount.
- SVG does not inherit `currentColor` in Lynx, so built-in and custom control slots receive a resolved hex icon color.
- CSS inheritance is disabled in the Lynx build; input foreground classes therefore live on the `base` slot rather than the root.
- The component is a numeric control, not a standalone native form-submission element.

## Related components

- [`Label`](/components/label) for visible field labels.
- `Input` for unconstrained text entry.
- `Slider` for choosing an approximate value from a bounded range.
- `FormField` for label, help, hint, and validation scaffolding.
