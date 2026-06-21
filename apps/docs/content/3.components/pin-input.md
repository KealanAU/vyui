---
title: Pin Input
description: Collect a fixed-length numeric or alphanumeric verification code.
navigation:
  icon: i-lucide-key-round
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/PinInput.vue
    target: _blank
  - label: Core source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/tree/main/packages/core/src/components/PinInput
    target: _blank
---

## Overview

`VyPinInput` renders a fixed number of single-character fields for PINs and verification codes. It wraps the `@vyui/core` pin-input primitives with a flat string model, semantic colors, surface variants, sizes, masking, and completion events.

::component-playground{name="pin-input"}
::

## Usage

```vue
<script setup lang="ts">
import { VyPinInput } from '@vyui/kit'
import { ref } from 'vue'

const code = ref('')
</script>

<template>
  <VyPinInput
    v-model="code"
    :length="6"
    @complete="value => console.log('Complete:', value)"
  />
</template>
```

The kit model is a flat string such as `"123456"`. Internally, the core control stores one character per field as a `string[]`.

### Alphanumeric codes

Numeric mode is the default and removes non-digit input. Use `type="alphanumeric"` for letters, digits, or other text characters.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const recoveryCode = ref('')
</script>

<template>
  <VyPinInput
    v-model="recoveryCode"
    type="alphanumeric"
    :length="8"
    placeholder="·"
    color="info"
  />
</template>
```

### Masked value

Set `mask` when the entered characters should not remain visible.

```vue
<template>
  <VyPinInput
    v-model="pin"
    :length="4"
    mask
    color="error"
    highlight
  />
</template>
```

`highlight` only paints a static semantic border. It does not mark the field invalid or provide validation text.

### Variants and sizes

```vue
<template>
  <view class="flex flex-col gap-4">
    <VyPinInput v-model="smallCode" size="sm" variant="soft" />
    <VyPinInput v-model="largeCode" size="xl" variant="subtle" color="success" />
    <VyPinInput v-model="plainCode" variant="none" />
  </view>
</template>
```

## Features and behavior

- `length` creates one native input for each character.
- Typing a character updates the current field and moves focus to the next field.
- Clearing a field moves focus to the previous field.
- Focusing a field selects its current content so the next character replaces it.
- Pasted or multi-character input is distributed across the remaining fields; overflow is discarded.
- Numeric mode removes non-digits before distributing input.
- `complete` is emitted when every rendered field contains a value.
- `disabled` disables every field and applies the themed disabled opacity.
- Programmatic `modelValue` changes are split into per-field characters.

Keep the model length at or below `length`. Extra model characters are not rendered and can prevent the core completion check from matching the number of mounted fields.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `undefined` | Controlled flat string used by `v-model`. |
| `length` | `number` | `5` | Number of single-character input fields. |
| `disabled` | `boolean` | `false` | Prevents interaction with every field. |
| `mask` | `boolean` | `false` | Renders the native fields as password inputs. |
| `otp` | `boolean` | `false` | Declared one-time-code autofill hint; currently retained by core context but not applied to the native fields. |
| `type` | `'numeric' \| 'alphanumeric'` | `'numeric'` | Restricts input to digits or permits free-form text characters. |
| `placeholder` | `string` | `undefined` | Placeholder glyph repeated in every empty field. |
| `color` | `Color` | `'primary'` | Semantic border color used by bordered variants and `highlight`. |
| `variant` | `'outline' \| 'soft' \| 'subtle' \| 'ghost' \| 'none'` | `'outline'` | Field surface and border treatment. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Field dimensions and text size. |
| `highlight` | `boolean` | `false` | Paints a static border matching `color`. |
| `id` | `string` | `undefined` | Declared identifier; passed to the core root prop but not currently rendered on its container. |
| `name` | `string` | `undefined` | Declared form name; not currently forwarded by the kit implementation. |
| `class` | `any` | `undefined` | Classes merged onto the root container. |
| `ui` | `Partial<Record<'root' \| 'base', any>>` | `undefined` | Per-instance root and field theme overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

The kit wrapper does not expose the core root's uncontrolled `defaultValue`, primitive `as`, or `asChild` props. Compose `PinInputRoot` and `PinInputInput` from `@vyui/core` when those controls or custom field markup are required.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Emitted after the per-field core value changes; powers `v-model`. |
| `complete` | `string` | Emitted when all rendered fields are filled. |

The completion event can fire again after a completed value changes while every field remains filled.

## Slots

This kit component does not expose slots. Use `ui` to style the generated fields, or compose the headless primitives from `@vyui/core` for custom markup.

## Styling and theming

Override globally through `appConfig.ui.pinInput` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Wrapping flex row, gap, width constraints, and overflow behavior. |
| `base` | Each native input's dimensions, typography, radius, surface, border, placeholder, and disabled state. |

The default root wraps fields onto additional rows when the available width is too small.

The theme combines `size`, `variant`, `color`, and `highlight`:

- `outline` uses a white surface and semantic border.
- `soft` uses a muted surface without a default border.
- `subtle` combines a muted surface with a semantic border.
- `ghost` and `none` use transparent surfaces; `ghost` adds an active background.
- `highlight` adds a semantic border regardless of the selected variant.

Sizes range from 32px square fields at `sm` to 44px at `xl`. All fields use centered text and a neutral placeholder color.

## Accessibility

Each core field exposes a textbox role and a generated label such as “Digit 1 of 6.” Disabled state is forwarded to the native inputs.

Place a visible group label and instructions next to the component so users know which code to enter. Do not rely on placeholder glyphs, color, or `highlight` to communicate purpose or validation. Show errors as text and move focus deliberately when retrying a failed code.

The generated labels always use the word “Digit,” including in `alphanumeric` mode. The kit wrapper does not currently expose per-field accessibility labels, a group label prop, or slots for replacing the inputs. Use the core primitives when a code requires custom accessible naming.

Masking conceals the visible characters but does not explain the field's sensitivity to assistive technology. Provide that context in the surrounding label or description.

## Platform notes

- The fields are Lynx native `input` elements with `maxlength="1"`.
- Numeric mode maps to Lynx input type `digit`; alphanumeric mode maps to `text`.
- `mask` maps every field to native input type `password`.
- Focus movement waits for Vue's next render flush so a keystroke is committed before the next field receives focus.
- Paste handling reads clipboard text when available and also accepts Lynx-style values from `event.detail.value`.
- The current `otp` prop does not set a native autofill/content-type attribute, `name` is not forwarded, and `id` is not rendered by the core root.
- The root receives `data-complete` and `data-disabled`; every field also receives the corresponding state attributes.

## Related components

- `Input` for unrestricted single-field text.
- `FormField` and `Label` for visible labels, instructions, and validation messages.
- The `@vyui/core` `PinInputRoot` and `PinInputInput` primitives for custom composition.
