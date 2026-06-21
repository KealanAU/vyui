---
title: Avatar
description: Display a profile image with text, icon, and status fallbacks.
navigation:
  icon: i-lucide-circle-user-round
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Avatar.vue
    target: _blank
---

## Overview

`VyAvatar` displays a circular image and falls back to explicit text, initials derived from `alt`, or an icon. It can also render a `VyChip` status marker and inherit size and color from `VyAvatarGroup`.

::component-playground{name="avatar"}
::

## Usage

```vue
<script setup lang="ts">
import { VyAvatar } from '@vyui/kit'
</script>

<template>
  <VyAvatar
    src="https://github.com/kealanau.png"
    alt="Kealan Clarke"
  />
</template>
```

### Fallbacks and status

```vue
<template>
  <view class="flex flex-row gap-3">
    <VyAvatar text="KC" color="primary" />
    <VyAvatar alt="Ada Lovelace" color="secondary" />
    <VyAvatar icon="i-lucide-user" color="neutral" />
    <VyAvatar alt="Online user" :chip="{ color: 'success', position: 'bottom-right' }" />
  </view>
</template>
```

Fallback priority is explicit `text`, initials derived from `alt`, then `icon`. A custom `fallback` slot replaces all three.

## Features and behavior

- A present `src` is displayed optimistically; a native image error switches to the fallback.
- Initials use the first character of each word in `alt`, limited to two characters.
- Explicit `size` and `color` props override values inherited from an enclosing `VyAvatarGroup`.
- `chip` set to `true` creates a default inset chip. An object is merged with `inset: true`.
- The default slot replaces the entire inner image and fallback structure.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `undefined` | Image URL. A load error shows the fallback. |
| `alt` | `string` | `undefined` | Source for generated initials. It is not forwarded to the native image by the current wrapper. |
| `text` | `string` | `undefined` | Explicit fallback text; takes precedence over `alt` initials. |
| `icon` | `string` | `undefined` | Fallback Iconify name when no text resolves. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl'` | `'md'` or group value | Avatar diameter and fallback scale. |
| `color` | `Color` | `'neutral'` or group value | Fallback background and foreground color. |
| `chip` | `boolean \| ChipProps` | `undefined` | Optional inset status chip. |
| `class` | `any` | `undefined` | Classes merged onto the root. |
| `ui` | `Partial<Record<AvatarSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports registry extensions.

## Emits

This component does not emit events. The underlying image load-state event is handled internally and is not forwarded by the kit wrapper.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | — | Replaces all inner image and fallback rendering. |
| `fallback` | — | Replaces initials and icon fallback content while retaining image behavior. |

## Styling and theming

Override globally through `appConfig.ui.avatar` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Circular clipping, layout, background, and size. |
| `image` | Full-size cropped image. |
| `text` | Initials or explicit fallback text. |
| `icon` | Fallback icon. |

The `size` variant controls diameters from 32px (`xs`) through 64px (`3xl`) in the default theme. The `color` variant applies the semantic `100` background and `600` text/icon shade. Defaults are `md` and `neutral`.

## Accessibility

`VyAvatar` is presentational and does not become an accessibility element or button. Although `alt` produces useful fallback initials, the current kit wrapper does not forward it to the native `<image>`. Put interactive avatars inside a control with the correct native role and `accessibility-label`, and label important non-interactive identity content in the surrounding interface.

## Platform notes

- The underlying Lynx `<image>` has no dependable load event. A non-empty `src` is treated as loaded until native `@error` fires.
- The root uses `overflow-hidden`; chip props default to `inset: true` so the marker remains visible.
- The component is built from the headless core Avatar primitives.

## Related components

- [`AvatarGroup`](/components/avatar-group) for overlapping collections.
- `Chip` for status markers.
- `User` for an avatar with name and description.
