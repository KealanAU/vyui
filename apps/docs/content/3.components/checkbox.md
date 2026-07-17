---
title: Checkbox
description: A checkbox with checked, unchecked, and indeterminate states, plus label and description.
navigation:
  icon: i-lucide-square-check
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Checkbox.vue
    target: _blank
---

## Overview

`VyCheckbox` is a controlled checkbox built on the headless `@vyui/core` Checkbox primitives. It supports checked, unchecked, and `'indeterminate'` states, an optional inline `label` and `description`, semantic `color`, four sizes, and a static `highlight` ring.

## Usage

Bind `v-model` to a boolean, or set it to `'indeterminate'` for the mixed state.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyCheckbox } from '@vyui/kit/checkbox'

const accepted = ref(false)
</script>

<template>
  <VyCheckbox
    v-model="accepted"
    label="I accept the terms"
    description="You can change this later in settings."
  />
</template>
```

### Indeterminate

```vue
<VyCheckbox :model-value="'indeterminate'" label="Select all" />
```

### Colors and sizes

```vue
<VyCheckbox v-model="a" color="success" size="sm" label="Small" />
<VyCheckbox v-model="b" color="primary" size="md" label="Medium" />
<VyCheckbox v-model="c" color="error" size="lg" label="Large" />
```

## Features and behavior

- `modelValue` accepts `true`, `false`, or `'indeterminate'`; the indeterminate glyph uses `indeterminateIcon` (default `appConfig.ui.icons.minus`).
- The check glyph uses `icon` (default `appConfig.ui.icons.check`).
- `label` and `description` render beside the box; the `label` and `description` slots override them.
- `highlight` paints a static ring in `color`, independent of focus.
- `disabled` dims the control and blocks toggling.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `boolean \| 'indeterminate'` | `false` | Controlled checked value. |
| `disabled` | `boolean` | `false` | Prevent toggling and dim the control. |
| `name` | `string` | `undefined` | Field name. |
| `value` | `string` | `undefined` | Field value. |
| `color` | `Color` | `'primary'` | Checked fill color. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Box and glyph scale. |
| `icon` | `string` | `appConfig.ui.icons.check` | Check glyph Iconify name. |
| `indeterminateIcon` | `string` | `appConfig.ui.icons.minus` | Indeterminate glyph Iconify name. |
| `label` | `string` | `undefined` | Label text beside the box. |
| `description` | `string` | `undefined` | Description text below the label. |
| `highlight` | `boolean` | `false` | Paint a static ring matching `color`. |
| `id` | `string` | `undefined` | Forwarded to the underlying `CheckboxRoot`. |
| `required` | `boolean` | `undefined` | Forwarded to the underlying `CheckboxRoot`. |
| `class` | `any` | `undefined` | Classes merged onto the root. |
| `ui` | `Partial<Record<CheckboxSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `boolean \| 'indeterminate'` | The checked state changed. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `label` | — | Replaces the label text. |
| `description` | — | Replaces the description text. |

## Styling and theming

Override globally through `appConfig.ui.checkbox` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Row layout and gap between box and text. |
| `base` | The box: size, radius, border, and fill. |
| `indicator` | Wrapper centering the glyph. |
| `icon` | The check/indeterminate glyph. |
| `wrapper` | Column wrapping label and description. |
| `label` | Label text. |
| `description` | Description text. |

A checked box paints `bg-{color}-500`; `highlight` adds a `border-{color}-500` ring. Defaults are `primary` and `md`.

## Accessibility

State is exposed through the underlying core Checkbox primitives. Always pair the control with a `label` (or the `label` slot) so its purpose is announced, and use `description` for supplementary guidance.

## Related components

- [`RadioGroup`](/components/radio-group) for mutually exclusive choices.
- [`Switch`](/components/switch) for on/off toggles.
- [`Form`](/components/form) and [`Label`](/components/label) for composing form fields.
