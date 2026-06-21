---
title: Island Group
description: Position multiple companion islands as one floating or inline layout.
navigation:
  icon: i-lucide-panels-top-left
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/IslandGroup.vue
    target: _blank
---

## Overview

`VyIslandGroup` lays out multiple `VyIsland` surfaces and owns their shared viewport placement. Use it for a main dock with a separate action pill, paired top controls, or stacked companion islands.

::component-code
---
name: island-group-example
height: 260px
---
::

## Usage

Set each member island to `layer="inline"` so the group is the only component applying fixed placement.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyIsland, VyIslandButton, VyIslandGroup } from '@vyui/kit'

const visible = ref(true)
const section = ref<string | number | null>('inbox')
</script>

<template>
  <VyIslandGroup v-if="visible" position="bottom">
    <VyIsland v-model:value="section" layer="inline" size="lg">
      <VyIslandButton value="inbox" icon="i-lucide-inbox" />
      <VyIslandButton value="activity" icon="i-lucide-bell" />
      <VyIslandButton value="profile" icon="i-lucide-user" />
    </VyIsland>

    <VyIsland layer="inline" size="lg">
      <VyIslandButton
        icon="i-lucide-x"
        accessibility-label="Hide dock"
        @tap="visible = false"
      />
    </VyIsland>
  </VyIslandGroup>
</template>
```

`VyIslandGroup` does not provide island context. Its `size` prop controls spacing between members, while each `VyIsland.size` controls that island and its buttons.

### Edge alignment

Use `align="between"` to pin the first and last members to opposite sides of the viewport strip.

```vue
<VyIslandGroup position="top" align="between">
  <VyIsland layer="inline" size="sm">
    <VyIslandButton icon="i-lucide-arrow-left" accessibility-label="Go back" />
    <VyIslandButton label="Inbox" />
  </VyIsland>

  <VyIsland layer="inline" size="sm">
    <VyIslandButton icon="i-lucide-share-2" accessibility-label="Share" />
    <VyIslandButton icon="i-lucide-ellipsis" accessibility-label="More actions" />
  </VyIsland>
</VyIslandGroup>
```

`start`, `end`, and `between` add 16 pixels of outer horizontal padding. `center` has no group-level horizontal padding.

### Vertical groups

Set `direction="col"` to stack islands. In column mode, `align` maps to the vertical main axis of the flex container.

```vue
<VyIslandGroup
  layer="inline"
  direction="col"
  align="start"
  size="sm"
>
  <VyIsland layer="inline" size="sm">
    <VyIslandButton icon="i-lucide-zoom-in" accessibility-label="Zoom in" />
  </VyIsland>
  <VyIsland layer="inline" size="sm">
    <VyIslandButton icon="i-lucide-zoom-out" accessibility-label="Zoom out" />
  </VyIsland>
</VyIslandGroup>
```

For inline groups, the parent layout owns final placement. This is useful for map controls, card toolbars, and previews that must not float over the viewport.

### Layering

The group defaults to `layer="overlay"`. Use `base` for persistent navigation that should sit below drawers and modals.

```vue
<VyIslandGroup position="bottom" layer="base">
  <VyIsland layer="inline">
    <VyIslandButton icon="i-lucide-home" label="Home" />
  </VyIsland>
</VyIslandGroup>
```

Avoid leaving member islands at their default `layer="overlay"` inside a floating group. Each member would apply its own full-width fixed positioning instead of participating normally in the group row.

## Features and behavior

- Floating groups span from the left to right viewport edge and sit 16 pixels from `top` or `bottom`.
- `align` controls main-axis justification through an inline style for reliable Lynx layout.
- `direction="row"` places members side by side; `direction="col"` stacks them.
- `size` sets only the gap between member islands. It does not propagate to `VyIsland` or `VyIslandButton`.
- `layer="overlay"` uses a high floating layer, `base` uses a lower floating layer, and `inline` applies no positioning.
- The default slot is free-form, though `VyIsland` children are the intended composition.
- Consumer-provided inline `style` can override generated offsets, positioning, alignment, or stacking through attribute fallthrough.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'top' \| 'bottom'` | `'bottom'` | Viewport edge used by floating groups. Ignored for inline placement. |
| `layer` | `'overlay' \| 'base' \| 'inline'` | `'overlay'` | Floating and stacking strategy. |
| `direction` | `'row' \| 'col'` | `'row'` | Flex direction for member islands. |
| `align` | `'start' \| 'center' \| 'end' \| 'between'` | `'center'` | Main-axis distribution of group members. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Gap between members; does not set child island size. |
| `class` | `any` | `undefined` | Classes merged onto the root slot. |
| `ui` | `Partial<Record<'root', any>>` | `undefined` | Per-instance root theme override. |

The gap scale is `sm: 12px`, `md: 16px`, `lg: 24px`, and `xl: 32px`.

## Emits

`VyIslandGroup` does not emit events.

## Slots

| Slot | Description |
| --- | --- |
| `default` | Member islands or other companion content. |

The slot does not receive scoped props.

## Styling and theming

Override globally through `appConfig.ui.islandGroup` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Flex layout, direction, alignment, gap, maximum width, and optional edge padding. |

The theme combines `position`, `direction`, `align`, and `size`. Fixed placement and `justifyContent` are applied separately as inline styles for Lynx compatibility.

`position` aligns floating children against the selected vertical edge. `align` applies `justify-start`, `justify-center`, `justify-end`, or `justify-between`; the component mirrors the same distribution with inline `justifyContent`.

## Accessibility

`VyIslandGroup` is layout-only and does not add a native group, navigation, or toolbar role. Add an appropriate labeled semantic wrapper when the collection needs to be announced as one region. Each interactive child must provide its own accessible name.

Keep companion islands in a logical source order. With `align="between"`, visual distance can be large even though controls remain adjacent in traversal order. Test top and bottom floating controls with VoiceOver and TalkBack to ensure they do not obscure or interrupt primary content.

## Platform notes

- Floating placement uses inline `position: fixed` because Lynx does not reliably honor the Tailwind `fixed` utility.
- `overlay` uses `z-index: 50`; `base` uses `z-index: 10`.
- Top groups use `top: 16px` and align children to the top edge. Bottom groups use `bottom: 16px` and align children to the bottom edge.
- The full-width fixed strip is why child islands should use `layer="inline"`.
- Leave enough page padding for persistent floating groups so scrollable content is not hidden underneath them.

## Related components

- [`Island`](/components/island) for each pill or expandable surface.
- [`Island Button`](/components/island-button) for actions inside an island.
- [`Action Sheet`](/components/action-sheet) for temporary grouped actions that should not remain in the viewport.
