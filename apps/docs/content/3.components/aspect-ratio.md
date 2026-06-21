---
title: Aspect Ratio
description: Constrain content to a fixed width-to-height ratio.
navigation:
  icon: i-lucide-ratio
package: kit
links:
  - label: Core source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/AspectRatio/AspectRatioRoot.vue
    target: _blank
---

## Overview

`VyAspectRatio` is the `@vyui/core` `AspectRatio` primitive re-exported by `@vyui/kit`. It renders one primitive element at `width: 100%` and applies the native CSS `aspect-ratio` property.

::component-playground{name="aspect-ratio"}
::

## Usage

```vue
<script setup lang="ts">
import { VyAspectRatio } from '@vyui/kit'
</script>

<template>
  <VyAspectRatio :ratio="16 / 9">
    <image
      src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
      class="h-full w-full object-cover"
    />
  </VyAspectRatio>
</template>
```

You can also import the unprefixed alias and public type.

```ts
import { AspectRatio, type AspectRatioProps } from '@vyui/kit'
```

## Features and behavior

- `ratio` is width divided by height: use `16 / 9`, `4 / 3`, or `1` for a square.
- The component sets `width: 100%` because Lynx needs one definite dimension before it can derive the other.
- It renders a single element rather than a padding wrapper with absolutely positioned content.
- The default slot receives `aspect`, calculated as `(1 / ratio) * 100`, for consumers that need the percentage form.
- `as` and `asChild` come from the core `Primitive` API.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `ratio` | `number` | `1` | Desired width-to-height ratio. |
| `as` | `AsTag \| Component` | `'view'` | Element or component to render. |
| `asChild` | `boolean` | `false` | Merges behavior and attributes into the single child through the primitive slot mechanism. |

Additional attributes, including `class` and `style`, are forwarded to the rendered primitive. The component's inline style supplies `width: 100%` and `aspectRatio`.

## Emits

This component does not emit events.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ aspect: number }` | Content constrained by the ratio; `aspect` is the percentage equivalent. |

## Styling and theming

`VyAspectRatio` is not themeable through `appConfig.ui` and has no `ui` prop, slots, variants, or kit theme file. Style the component with forwarded `class` or `style`, and style its child so it fills the available box.

```vue
<VyAspectRatio :ratio="4 / 3" class="overflow-hidden rounded-xl bg-neutral-100">
  <view class="h-full w-full" />
</VyAspectRatio>
```

## Accessibility

The ratio wrapper is structural and adds no role. Accessibility comes from its content: provide meaningful alternative text or native accessibility labeling for images and other media. Decorative media should be treated as decorative by the consuming application.

## Platform notes

- Lynx Starlight supports the `aspect-ratio` property directly.
- If you want height to be the definite dimension, override the default width and provide an explicit height.
- Avoid `ratio={0}` or negative ratios; the component does not validate the value.
- The root exposes `data-vyui-aspect-ratio` with the current numeric ratio.

## Related components

- [`Avatar`](/components/avatar) for circular profile imagery.
- `Skeleton` for fixed-ratio loading placeholders.
- `Card` for framed media and content.
