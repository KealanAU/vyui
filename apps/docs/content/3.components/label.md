---
title: Label
description: Render visible text for a form control.
navigation:
  icon: i-lucide-tag
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Label.vue
    target: _blank
---

## Overview

`VyLabel` renders styled text for a form control. It supports four text sizes, a visual required marker, a control identifier, and local or global theme overrides.

::component-playground{name="label"}
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyInput, VyLabel } from '@vyui/kit'

const name = ref('')
</script>

<template>
  <view class="flex flex-col gap-2">
    <VyLabel for="display-name">Display name</VyLabel>
    <VyInput
      id="display-name"
      v-model="name"
      placeholder="Ada Lovelace"
    />
  </view>
</template>
```

Use short, specific text that describes the value a user should enter or change.

### Required

Set `required` to append the theme's visual asterisk.

```vue
<template>
  <view class="flex flex-col gap-2">
    <VyLabel for="email" required>Email address</VyLabel>
    <VyInput id="email" type="email" placeholder="you@example.com" />
    <text class="text-xs text-neutral-500">Required for account recovery.</text>
  </view>
</template>
```

The marker is presentational. Set required or validation state on the control separately and provide a visible error message when validation fails.

### Size

Choose a size that matches the control and surrounding hierarchy.

```vue
<template>
  <view class="flex flex-col gap-3">
    <VyLabel size="sm">Small label</VyLabel>
    <VyLabel size="md">Default label</VyLabel>
    <VyLabel size="lg">Large label</VyLabel>
    <VyLabel size="xl">Extra-large label</VyLabel>
  </view>
</template>
```

### Custom content

The default slot accepts any renderable content, although concise text is the clearest form label.

```vue
<VyLabel for="workspace-name">
  <view class="flex flex-row items-center gap-2">
    <text>Workspace name</text>
    <VyBadge label="Public" color="info" size="sm" />
  </view>
</VyLabel>
```

When using a nested layout, verify that its text styles and wrapping remain legible at larger accessibility text sizes.

## Features and behavior

- Renders the `@vyui/core` Label primitive as a Lynx `text` element by default.
- `for` is forwarded to the rendered element.
- `required` changes only the theme and does not update the associated control.
- The default slot is the only content API.
- `class` and `ui.base` are merged with the resolved theme classes.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `for` | `string` | `undefined` | Identifier of the form control the label describes. Forwarded as an attribute. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Label text size. |
| `required` | `boolean` | `false` | Appends a visual red asterisk through the theme. |
| `class` | `any` | `undefined` | Classes merged onto the label element. |
| `ui` | `Partial<Record<'base', any>>` | `undefined` | Per-instance theme slot override. |

## Emits

This component does not emit events.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | — | Label content. |

## Styling and theming

Override globally through `appConfig.ui.label` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `base` | Font weight, foreground color, selection behavior, size, and required marker. The `class` prop is also merged here. |

### Theme variants

| Variant | Values | Default | Effect |
| --- | --- | --- | --- |
| `size` | `sm`, `md`, `lg`, `xl` | `'md'` | Maps to `text-base`, `text-lg`, `text-xl`, or `text-2xl`. |
| `required` | `true`, `false` | `false` | Appends a red asterisk with a small logical-start margin. |

The base theme uses medium-weight, non-selectable, dark gray text. Override `ui.base` when a denser form needs smaller typography than the built-in scale.

## Accessibility

Always keep the label visible; a placeholder is not a replacement because it disappears after entry and may be read inconsistently. Put units or formatting guidance in nearby help text rather than overloading the label.

The current primitive forwards `for` as an attribute on a Lynx `text` element, but it does not implement native label-to-control activation or accessible-name association. Tapping `VyLabel` does not focus the referenced control. Verify the control's accessible name with VoiceOver and TalkBack, and attach native accessibility attributes directly to the control when required.

`required` is visual only and does not announce required state. Set the control's own required semantics where supported, explain the requirement in text, and do not rely on the red asterisk or color alone.

## Platform notes

- The component renders a Lynx `text` primitive, not a DOM `<label>`.
- The `for` and matching control `id` are useful identifiers but do not currently create native focus behavior.
- The required marker uses an `after:` pseudo-element utility from the kit theme; verify custom Lynx styling pipelines preserve that utility.
- The theme uses logical margin (`ms`) for the marker so spacing follows writing direction.
- `select-none` prevents accidental text selection in supported targets.

## Related components

- [`NumberField`](/components/number-field) for bounded numeric entry.
- `Input` and `Textarea` for text entry.
- `FormField` for integrated label, description, hint, help, and validation layout.
