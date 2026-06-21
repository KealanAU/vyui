---
title: Avatar Group
description: Stack avatars and collapse overflow into a count.
navigation:
  icon: i-lucide-users-round
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/AvatarGroup.vue
    target: _blank
---

## Overview

`VyAvatarGroup` overlaps avatars in a compact row, propagates a shared size and color, and can replace hidden children with a `+N` overflow avatar.

::component-playground{name="avatar-group"}
::

## Usage

```vue
<script setup lang="ts">
import { VyAvatar, VyAvatarGroup } from '@vyui/kit'

const people = [
  { name: 'Ada Lovelace', src: 'https://example.com/ada.jpg' },
  { name: 'Grace Hopper', src: 'https://example.com/grace.jpg' },
  { name: 'Margaret Hamilton', src: 'https://example.com/margaret.jpg' },
  { name: 'Katherine Johnson', src: 'https://example.com/katherine.jpg' },
]
</script>

<template>
  <VyAvatarGroup size="lg" color="primary" :max="3">
    <VyAvatar
      v-for="person in people"
      :key="person.name"
      :src="person.src"
      :alt="person.name"
    />
  </VyAvatarGroup>
</template>
```

Child avatars inherit the group's `size` and `color` unless they set their own values.

### Mixed avatar styles

```vue
<VyAvatarGroup size="md">
  <VyAvatar src="https://example.com/one.jpg" alt="One" />
  <VyAvatar text="AB" color="secondary" />
  <VyAvatar icon="i-lucide-user" />
</VyAvatarGroup>
```

## Features and behavior

- Fragment and comment nodes are flattened so `v-for` and `v-if` work in the default slot.
- Children are rendered in reverse order inside a reverse row, preserving the first child's visual stacking priority.
- With a positive `max`, only the first `max` avatars remain visible.
- Hidden children are represented by an internally rendered `VyAvatar` containing `+N`.
- An absent, invalid, zero, or negative effective `max` shows all children and no overflow avatar.
- A string `max` is parsed with `Number.parseInt`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | `'md'` | Shared child size and overlap spacing. |
| `color` | `Color` | `'neutral'` | Shared child fallback color. |
| `max` | `number \| string` | `undefined` | Maximum visible children before rendering `+N`. |
| `class` | `any` | `undefined` | Classes merged onto the group root. |
| `ui` | `Partial<Record<AvatarGroupSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports registry extensions.

## Emits

This component does not emit events.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | — | Avatar children. Fragments are flattened before limiting and reordering. |

## Styling and theming

Override globally through `appConfig.ui.avatarGroup` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Reverse horizontal group layout. |
| `base` | Border, negative margin, and stacking class applied to every visible and overflow avatar. |

The `size` variant adjusts overlap from `-me-1.5` through `-me-3`; all sizes use a two-pixel white border. The `color` variant exists to type and propagate the shared color but adds no classes to the group itself.

## Accessibility

Each avatar should have meaningful `alt` text or be wrapped by a labeled interactive control. The generated `+N` avatar is visual summary text; if the exact hidden identities matter to assistive technology, provide that information elsewhere in the surrounding interface.

## Platform notes

- The theme uses `flex`, not `inline-flex`, because Lynx supports `none`, `flex`, `grid`, and `linear` display modes.
- A white border is used instead of Nuxt UI's web `ring-bg` token; the default theme is light-mode-oriented.
- Group values are passed to descendant `VyAvatar` components through Vue dependency injection.

## Related components

- [`Avatar`](/components/avatar) for individual profile imagery.
- `User` for an avatar with text metadata.
- `Tooltip` for exposing additional identity information.
