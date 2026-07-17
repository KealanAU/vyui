---
title: Separator
description: Visually divide content with an optional label or icon.
navigation:
  icon: i-lucide-separator-horizontal
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Separator.vue
    target: _blank
---

## Overview

`VySeparator` renders a horizontal or vertical divider on top of the `@vyui/core` separator primitive. It supports semantic colors, four thicknesses, solid or patterned borders, and centered label, icon, or custom content.

::component-code
---
name: separator-example
height: 220px
---
::

## Usage

```vue
<script setup lang="ts">
import { VySeparator } from '@vyui/kit/separator'
</script>

<template>
  <VySeparator />
</template>
```

### Label or icon

Content splits the separator into two border segments.

```vue
<template>
  <view class="flex flex-col gap-5">
    <VySeparator label="Account" />
    <VySeparator icon="i-lucide-sparkles" color="primary" />
  </view>
</template>
```

When both `label` and `icon` are set, the label is rendered. The default slot replaces both built-in choices.

### Vertical

A vertical separator needs an explicit height from its parent or `class`.

```vue
<template>
  <view class="h-12 flex flex-row items-center gap-4">
    <text>Profile</text>
    <VySeparator orientation="vertical" />
    <text>Security</text>
  </view>
</template>
```

### Custom content

```vue
<template>
  <VySeparator color="success" type="dashed">
    <text class="text-sm text-success-600">Complete</text>
  </VySeparator>
</template>
```

## Features and behavior

- Without content, one border segment fills the root.
- A `label`, `icon`, or default slot inserts a centered container and a second border segment.
- `orientation` changes both root direction and the border axis.
- `decorative` removes the primitive from the native accessibility tree.
- `color`, `size`, and `type` affect only the border by default.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | `undefined` | Text displayed in the center. Takes precedence over `icon`. |
| `icon` | `string` | `undefined` | Iconify name displayed when there is no label or default slot. |
| `color` | `Color` | `'neutral'` | Semantic border color. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'sm'` | Border thickness from 2px through 5px. |
| `type` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` | Border line style. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Divider direction. |
| `decorative` | `boolean` | `false` | Removes the separator root from the accessibility tree. |
| `class` | `any` | `undefined` | Classes merged onto the root. |
| `ui` | `Partial<Record<SeparatorSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports registry extensions.

## Emits

This component does not emit events.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | — | Replaces the built-in label or icon inside the centered content container. |

## Styling and theming

Override globally through `appConfig.ui.separator` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Horizontal or vertical flex layout and overall dimensions. |
| `border` | Each divider segment, including color, thickness, and line style. |
| `container` | Spacing and layout around centered content. |
| `icon` | Built-in icon size. |
| `label` | Built-in label typography. |

The default theme uses neutral borders, `sm` thickness, and a solid line. Horizontal segments use top borders; vertical segments use logical start borders.

## Accessibility

Set `decorative` when the line only supports the visual layout. A non-decorative separator remains in the native accessibility tree, but the current core primitive does not add an explicit separator role or orientation announcement. If the division communicates important structure, reinforce it with headings or labeled groups instead of relying on the line alone.

Keep custom slot content concise and non-interactive. A separator should not become a container for buttons or controls.

## Platform notes

- Built from the native `@vyui/core` separator primitive and Lynx `view`, `text`, and icon elements.
- Vertical separators need a constrained parent height because the root uses `h-full`.
- Logical `border-s-*` classes are used vertically so layout follows the app's writing direction.
- The default theme starts at 2px because thinner hairlines can be difficult to see at common Lynx pixel ratios.

## Related components

- `Divider` patterns can be composed from `VySeparator` with a custom default slot.
- The `@vyui/core` `Separator` primitive for unstyled composition.
