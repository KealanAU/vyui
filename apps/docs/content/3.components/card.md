---
title: Card
description: A neutral surface container with optional header, body, and footer regions.
navigation:
  icon: i-lucide-square
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Card.vue
    target: _blank
---

## Overview

`VyCard` is a rounded, clipped surface with three optional regions — `header`, default body, and `footer`. Each region renders only when its slot is provided. Cards use neutral surfaces; the `variant` prop selects the fill and border treatment.

## Usage

```vue
<script setup lang="ts">
import { VyCard } from '@vyui/kit'
</script>

<template>
  <VyCard>
    <template #header>
      <text>Title</text>
    </template>

    <text>Body content goes here.</text>

    <template #footer>
      <text>Footer</text>
    </template>
  </VyCard>
</template>
```

### Variants

```vue
<VyCard variant="outline"><text>Outline</text></VyCard>
<VyCard variant="soft"><text>Soft</text></VyCard>
<VyCard variant="subtle"><text>Subtle</text></VyCard>
<VyCard variant="solid"><text>Solid</text></VyCard>
```

## Features and behavior

- Each region (`header`, default, `footer`) renders only when its slot is present.
- The root clips overflow and rounds its corners; content padding lives on each region slot.
- `solid` paints a dark `root` fill and sets a white foreground on the region slots — Lynx does not cascade text color into deeply-nested `<text>`, so plain-text children of a solid card should set their own color or pass `ui.{header,body,footer}`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'solid' \| 'outline' \| 'soft' \| 'subtle'` | `'outline'` | Surface fill and border treatment. |
| `class` | `any` | `undefined` | Classes merged onto the root. |
| `ui` | `Partial<Record<CardSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

Card uses neutral surfaces only and does not expose a semantic `color`; override colors through `appConfig.ui.card` or the `ui` prop.

## Emits

This component does not emit events.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `header` | — | Top region; rendered only when provided. |
| `default` | — | Body region. |
| `footer` | — | Bottom region; rendered only when provided. |

## Styling and theming

Override globally through `appConfig.ui.card` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Radius, clipping, and surface fill/border. |
| `header` | Header padding and layout. |
| `body` | Body padding and layout. |
| `footer` | Footer padding and layout. |

The default theme is a port of Nuxt UI's card, using vyui's semantic surface/border tokens so it adapts automatically under dark mode (see [Theming](/theming)). The default variant is `outline`.

## Related components

- [`Separator`](/components/separator) for dividing card regions.
- [`Placeholder`](/components/placeholder) and [`Skeleton`](/components/skeleton) for empty and loading states.
