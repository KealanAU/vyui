---
title: Textarea
description: Collect multi-line text with themed states, icons, avatars, and native keyboard events.
navigation:
  icon: i-lucide-text-cursor-input
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Textarea.vue
    target: _blank
---

## Overview

`VyTextarea` is the styled multi-line input for Vue-Lynx. It combines the core native textarea behavior with semantic colors, surface variants, sizes, loading state, leading or trailing content, and delayed autofocus.

::component-code
---
name: textarea-example
height: 180px
---
::

## Usage

```vue
<script setup lang="ts">
import { VyTextarea } from '@vyui/kit'
import { ref } from 'vue'

const bio = ref('')
</script>

<template>
  <VyTextarea
    v-model="bio"
    name="bio"
    placeholder="Tell us about yourself"
    :rows="4"
    :max-length="280"
  />
</template>
```

The model accepts a `string` or `number`, but native edits are emitted as strings.

### Icons, avatars, and loading

`icon` is leading by default. Set `trailing` to route the shorthand to the trailing side, or use the explicit icon props.

```vue
<view class="flex flex-col gap-3">
  <VyTextarea
    v-model="notes"
    leading-icon="i-lucide-notebook-pen"
    trailing-icon="i-lucide-check"
    placeholder="Add release notes"
  />

  <VyTextarea
    v-model="message"
    :avatar="{ src: author.avatar, alt: author.name }"
    placeholder="Write a reply"
  />

  <VyTextarea
    v-model="draft"
    loading
    loading-icon="i-lucide-loader-circle"
    placeholder="Restoring draft…"
  />
</view>
```

The loading spinner takes precedence over an avatar and leading icon. An explicit `leadingIcon` or `trailingIcon` takes precedence over the `icon` shorthand.

### Variants and validation emphasis

Use `highlight` to paint a static semantic border regardless of focus.

```vue
<VyTextarea
  v-model="feedback"
  color="error"
  variant="subtle"
  highlight
  placeholder="Describe what went wrong"
/>
```

`highlight` is visual only. It does not set an invalid state or provide an error message, so pair it with a visible label and validation text.

### Custom leading and trailing content

The icon color is resolved to a Lynx-compatible hex value and passed to both named slots.

```vue
<VyTextarea v-model="message" color="info" placeholder="Message">
  <template #leading="{ iconColor }">
    <VyIcon name="i-lucide-message-circle" :color="iconColor" />
  </template>

  <template #trailing="{ iconColor }">
    <VyIcon name="i-lucide-send" :color="iconColor" />
  </template>
</VyTextarea>
```

### Autofocus and imperative access

The kit wrapper exposes its core textarea instance through `textareaRef`.

```vue
<script setup lang="ts">
import { VyButton, VyTextarea } from '@vyui/kit'
import { ref } from 'vue'

const textarea = ref<any>(null)
const value = ref('Editable text')

async function selectAll() {
  const core = textarea.value?.textareaRef
  const current = await core?.getValue()
  await core?.focus()
  await core?.setSelectionRange(0, current?.value.length ?? 0)
}
</script>

<template>
  <VyTextarea
    ref="textarea"
    v-model="value"
    autofocus
    :autofocus-delay="150"
  />
  <VyButton @tap="selectAll">Select all</VyButton>
</template>
```

The core instance provides `focus()`, `blur()`, `clear()`, `setValue(value)`, `getValue()`, and `setSelectionRange(start, end)`, all returning promises.

## Features and behavior

- `v-model` sends programmatic changes to the native element without re-pushing every native keystroke.
- `rows` defaults to `3` and is forwarded as a native attribute by the kit wrapper.
- `maxLength` is forwarded to core, whose native default is `140` when the prop is absent.
- `disabled` blocks interaction and applies reduced opacity through the default theme.
- `loading` adds a spinning leading icon but does not disable the textarea.
- A custom `leading` slot, `trailing` slot, icon, avatar, or loading state creates the corresponding side region.
- `icon` routes to the trailing side only when `trailing` is `true`; otherwise it is leading.
- The `leading` boolean is present in the public props but does not currently change shorthand routing by itself.
- The default slot is forwarded into the core native textarea; use named side slots for visual adornments.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string \| number` | `undefined` | Controlled value used by `v-model`; numbers are rendered as strings. |
| `placeholder` | `string` | `undefined` | Placeholder text. |
| `disabled` | `boolean` | `false` | Prevents user interaction. |
| `loading` | `boolean` | `false` | Shows the animated loading icon in the leading region. |
| `loadingIcon` | `string` | App icon / `i-lucide-loader-circle` | Iconify name for the spinner. |
| `icon` | `string` | `undefined` | Leading icon shorthand, or trailing when `trailing` is true. |
| `leading` | `boolean` | `false` | Declared shorthand hint; currently has no additional runtime effect. |
| `trailing` | `boolean` | `false` | Routes `icon` to the trailing side. |
| `leadingIcon` | `string` | `undefined` | Explicit leading Iconify name; takes precedence over `icon`. |
| `trailingIcon` | `string` | `undefined` | Explicit trailing Iconify name; takes precedence over `icon`. |
| `avatar` | `AvatarProps` | `undefined` | Leading avatar shown when not loading. |
| `color` | `Color` | `'primary'` | Semantic border, highlight, and icon color. |
| `variant` | `'outline' \| 'soft' \| 'subtle' \| 'ghost' \| 'none'` | `'outline'` | Surface treatment. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Padding, text, gap, and icon scale. |
| `highlight` | `boolean` | `false` | Always paints a semantic border. |
| `rows` | `number` | `3` | Visible row hint forwarded to the native textarea. |
| `maxLength` | `number` | Core default `140` | Maximum character count. |
| `id` | `string` | `undefined` | Native identifier. |
| `name` | `string` | `undefined` | Native field name. |
| `required` | `boolean` | `false` | Native required marker. |
| `autofocus` | `boolean` | `false` | Focuses the core textarea after mount. |
| `autofocusDelay` | `number` | `0` | Delay before autofocus, in milliseconds. |
| `class` | `any` | `undefined` | Classes merged onto the root wrapper. |
| `ui` | `Partial<Record<TextareaSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

The styled kit wrapper does not currently expose all core textarea props, including `defaultValue`, `readonly`, `maxLines`, `lineSpacing`, `bounces`, `type`, `inputFilter`, `confirmType`, and `showSoftInputOnFocus`. Import `Textarea` from `@vyui/core` when those native controls are required.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Native value changed; powers `v-model`. |
| `confirm` | `string` | The software keyboard's confirm action fired. |
| `focus` | `string` | The textarea received focus. |
| `blur` | `string` | The textarea lost focus. |
| `keyboard` | `{ visible: boolean, height: number, safeAreaBottom: number }` | Normalized software-keyboard visibility and dimensions. |

The core primitive also emits detailed `input` and `selectionChange` events, but the kit wrapper does not currently forward them.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `leading` | `{ iconColor: string }` | Replaces the loading icon, avatar, or leading icon. |
| `trailing` | `{ iconColor: string }` | Replaces the trailing icon. |
| `default` | — | Forwarded to the underlying core textarea primitive. |

## Exposed

| Property | Type | Description |
| --- | --- | --- |
| `textareaRef` | `TextareaExposed \| null` | Core textarea instance containing the imperative methods. |

`setValue()` changes the native value but does not itself emit `update:modelValue`. `clear()` emits an empty model value when the core textarea is controlled.

## Styling and theming

Override globally through `appConfig.ui.textarea` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Surface, border, radius, horizontal layout, padding, and gaps. |
| `base` | Native textarea, typed text, placeholder, and vertical padding. |
| `leading` | Leading adornment wrapper. |
| `leadingIcon` | Loading or leading icon. |
| `leadingAvatar` | Leading avatar. |
| `trailing` | Trailing adornment wrapper. |
| `trailingIcon` | Trailing icon. |

The theme combines `size`, `variant`, `color`, `highlight`, and internal leading, trailing, and loading states. `outline` and `subtle` use semantic borders, while `soft`, `ghost`, and `none` reduce or remove the border treatment.

Because CSS inheritance is disabled in the Lynx build, typed-text and placeholder colors belong on `base`, while surface and border classes belong on `root`.

## Accessibility

Give every textarea a visible label. Use `id` with `VyLabel` where your form structure supports it, and keep validation guidance next to the field rather than relying on border color alone.

The core native textarea exposes the keyboard accessibility trait. `disabled` is forwarded to the native element, but `highlight`, `loading`, icons, and avatars do not add an accessible description or validation state. Give any interactive control placed in a side slot its own label and adequate tap target.

Autofocus can unexpectedly move focus and open the software keyboard. Reserve it for flows where immediate text entry is the user's clear next action.

## Platform notes

- The underlying control is Lynx's native `<textarea>`, with DOM fallbacks used by the core imperative methods in tests and web-compatible runtimes.
- The normalized `keyboard` event comes from the focused native element and reports both keyboard height and safe-area bottom inset.
- Use [`KeyboardAware`](/components/keyboard-aware) wrappers when the software keyboard may cover the field.
- Native textarea scrolling can differ across iOS, Android, and web. Use the core component when you need `maxLines`, line spacing, bounce control, return-key type, or input filtering.
- Leading and trailing elements are flex siblings rather than absolute overlays because Lynx does not reliably layer them over a native text input.
- Lynx SVG does not inherit `currentColor`, so built-in and custom icon slots receive an explicit resolved hex color.
- The default theme uses vyui's semantic surface/text/border tokens, so it adapts automatically under dark mode (see [Theming](/theming)).

## Related components

- `Input` for single-line text.
- [`KeyboardAware`](/components/keyboard-aware) for avoiding the software keyboard.
- `FormField` and `Label` for labels, help text, and validation messages.
