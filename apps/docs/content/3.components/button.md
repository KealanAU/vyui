---
title: Button
description: A pressable button with color, variant, size, icon, avatar, and loading states.
navigation:
  icon: i-lucide-square-mouse-pointer
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Button.vue
    target: _blank
---

## Overview

`VyButton` renders a pressable control on top of the headless `@vyui/core` Button. It supports semantic `color`, six `variant` styles, five sizes, leading/trailing icons or an avatar, a loading spinner, and `block` / `square` layouts.

## Usage

Use `label` for simple text, or the default slot for custom content. Listen for presses with `@tap`.

```vue
<script setup lang="ts">
import { VyButton } from '@vyui/kit'

function onPress() {
  // ...
}
</script>

<template>
  <VyButton label="Continue" @tap="onPress" />
</template>
```

### Colors and variants

`color` selects the semantic palette; `variant` selects the fill treatment.

```vue
<VyButton color="primary" variant="solid" label="Solid" />
<VyButton color="primary" variant="outline" label="Outline" />
<VyButton color="neutral" variant="soft" label="Soft" />
<VyButton color="error" variant="ghost" label="Ghost" />
<VyButton color="primary" variant="link" label="Link" />
```

### Sizes

```vue
<VyButton size="xs" label="XS" />
<VyButton size="sm" label="SM" />
<VyButton size="md" label="MD" />
<VyButton size="lg" label="LG" />
<VyButton size="xl" label="XL" />
```

### Icons and avatar

`leadingIcon` / `trailingIcon` place explicit Iconify glyphs. The `icon` shorthand goes to the trailing side when `trailing` is set, otherwise the leading side. `avatar` renders a `VyAvatar` in the leading slot instead of an icon.

```vue
<VyButton leading-icon="i-lucide-arrow-left" label="Back" />
<VyButton trailing-icon="i-lucide-arrow-right" label="Next" />
<VyButton :avatar="{ src: 'https://…/me.png' }" label="Account" />
```

### Loading, block, and square

```vue
<VyButton :loading="submitting" label="Saving" />
<VyButton block label="Full width" />
<VyButton square icon="i-lucide-plus" />
```

## Features and behavior

- `label` renders the text; the default slot overrides it.
- `loading` shows a spinner (`loadingIcon`, default `appConfig.ui.icons.loading`) and blocks interaction.
- `block` stretches to full width and pushes a trailing icon to the far edge; `square` produces an equal-sided icon button.
- The `leading` / `trailing` slots receive `iconColor` so custom glyphs can match the variant's resolved foreground.
- `type` and `autofocus` are kept for API parity with Nuxt UI v4 but are no-ops on Lynx, which renders the button as a non-focusable `<view>`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `Color` | `'primary'` | Semantic palette. |
| `variant` | `'solid' \| 'outline' \| 'subtle' \| 'soft' \| 'ghost' \| 'link'` | `'solid'` | Fill treatment. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Padding and text scale. |
| `label` | `string` | `undefined` | Text label; overridden by the default slot. |
| `block` | `boolean` | `false` | Stretch to full width. |
| `square` | `boolean` | `false` | Equal-sided icon button. |
| `disabled` | `boolean` | `false` | Prevent interaction and dim the button. |
| `loading` | `boolean` | `false` | Show a spinner and block interaction. |
| `loadingIcon` | `string` | `appConfig.ui.icons.loading` | Spinner Iconify name. |
| `leadingIcon` | `string` | `undefined` | Explicit leading Iconify name. |
| `trailingIcon` | `string` | `undefined` | Explicit trailing Iconify name. |
| `icon` | `string` | `undefined` | Iconify shorthand; routed by `leading` / `trailing`. |
| `leading` | `boolean` | `false` | Force `icon` onto the leading side. |
| `trailing` | `boolean` | `false` | Force `icon` onto the trailing side. |
| `avatar` | `AvatarProps` | `undefined` | Render a `VyAvatar` in the leading slot. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Parity only; no-op on Lynx. |
| `autofocus` | `boolean` | `false` | Parity only; no-op on Lynx. |
| `class` | `any` | `undefined` | Classes merged onto the root. |
| `ui` | `Partial<Record<ButtonSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `tap` | — | The button was pressed. Forwarded from the underlying core `Button`. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | — | Button content; overrides `label`. |
| `leading` | `{ iconColor: string }` | Replaces the leading icon/avatar. |
| `trailing` | `{ iconColor: string }` | Replaces the trailing icon. |

## Styling and theming

Override globally through `appConfig.ui.button` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `base` | Root layout, radius, padding, and transition. |
| `label` | Truncating text label. |
| `leadingIcon` | Leading icon sizing. |
| `leadingAvatar` | Leading avatar wrapper. |
| `leadingAvatarSize` | Avatar size token per button size. |
| `trailingIcon` | Trailing icon sizing. |

The `variant` × `color` matrix resolves fills and foregrounds (e.g. `solid` paints `bg-{color}-500` with white text). Defaults are `primary`, `solid`, and `md`.

## Accessibility

The Lynx core button renders a `<view>`, so `type` and `autofocus` do not apply and the control is not natively focusable. Provide a clear `label` (or accessible content), and use `disabled` to convey unavailable actions.

## Related components

- [`Icon`](/components/icon) for the leading/trailing glyphs.
- [`Avatar`](/components/avatar) for the `avatar` prop.
- [`Form`](/components/form) for submit buttons inside a form.
