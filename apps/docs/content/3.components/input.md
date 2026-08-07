---
title: Input
description: Collect single-line text with themed states, icons, avatars, and native keyboard events.
navigation:
  icon: i-lucide-text-cursor-input
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Input.vue
    target: _blank
---

## Overview

`VyInput` is the styled single-line input for Vue-Lynx. It combines the core native input with semantic colors, surface variants, sizes, loading state, leading or trailing content, and delayed autofocus.

::component-code
---
name: input-example
height: 180px
---
::

## Usage

::component-code
---
name: input-example
height: 180px
---
::

The model accepts a `string` or `number`, but native edits are emitted as strings.

### Input and return-key types

Use `type` to select the native software keyboard and `confirmType` to label its return key.

```vue
<VyInput
  v-model="query"
  type="text"
  confirm-type="search"
  leading-icon="i-lucide-search"
  placeholder="Search"
  @confirm="search"
/>
```

Available input types are `text`, `number`, `digit`, `tel`, `email`, and `password`. Available confirm types are `done`, `next`, `search`, `send`, and `go`.

`digit` requests a digits-only keyboard, while `number` requests the platform's numeric keyboard, which may include a decimal separator or sign. These are keyboard hints rather than application-level validation.

### Icons, avatars, and loading

`icon` is leading by default. Set `trailing` to route the shorthand to the trailing side, or use the explicit icon props.

::component-code
---
name: input-icon
height: 180px
---
::

The loading spinner takes precedence over an avatar and leading icon. An explicit `leadingIcon` or `trailingIcon` takes precedence over the `icon` shorthand.

Icon names only resolve after their Iconify set has been registered. See [`Icon`](/components/icon#icon-registration) for setup.

### Variants and validation emphasis

The semantic border and shadow ring paint automatically while the input is focused. Use `highlight` to force them on permanently, for example for validation emphasis.

::component-code
---
name: input-variants
height: 320px
---
::

`highlight` is visual only. It does not set an invalid state or provide an error message, so pair it with a visible label and validation text.

### Disabled

Set `disabled` to prevent editing and apply the disabled visual treatment.

::component-code
---
name: input-disabled
height: 180px
---
::

### Custom leading and trailing content

The icon color is resolved to a Lynx-compatible hex value and passed to both named slots.

```vue
<VyInput v-model="amount" color="success" type="number" placeholder="0.00">
  <template #leading>
    <text class="text-neutral-500">$</text>
  </template>

  <template #trailing="{ iconColor }">
    <VyIcon name="i-lucide-circle-check" :color="iconColor" />
  </template>
</VyInput>
```

### Clear action

Use the trailing slot for a one-tap clear action.

::component-code
---
name: input-clear
height: 180px
---
::

### Copy action

Use the trailing slot for one-click copy actions. Keep the source text in state and pass that value to the clipboard handler instead of reading from the rendered input or slot content.

::component-code
---
name: input-copy
height: 180px
---
::

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyInput } from '@vyui/kit/input'

const value = ref('hello@vyui.dev')
const copied = ref(false)

async function copyValue() {
  const writeText = (globalThis as any).navigator?.clipboard?.writeText
  if (!writeText) return

  await writeText(value.value)
  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 1200)
}
</script>

<template>
  <VyInput v-model="value">
    <template #trailing>
      <VyButton
        size="xs"
        variant="ghost"
        color="neutral"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :label="copied ? 'Copied' : 'Copy'"
        @tap="copyValue"
      />
    </template>
  </VyInput>
</template>
```

The web clipboard API is shown here as an application-level handler. For native targets, wrap the platform clipboard bridge behind the same `copyValue` boundary.

### Password toggle

Use a trailing button to switch the input between `password` and `text`.

::component-code
---
name: input-password-toggle
height: 180px
---
::

### Character count

Use the trailing slot for passive text such as a character count. `VyInput` does not currently expose the native `maxLength` prop, so enforce limits in your model handler when needed.

::component-code
---
name: input-character-count
height: 180px
---
::

### Phone country code

Combine `VySelect` with `VyInput` to build a phone field with country selection. `VySelect` is currently a sheet picker, not a searchable `SelectMenu`, so keep searchable or lazy-loaded country data in application code until that API exists.

::component-code
---
name: input-phone-country
height: 240px
---
::

### Autofocus and imperative access

The kit wrapper exposes its core input instance through `inputRef`.

```vue
<script setup lang="ts">
import { VyButton } from '@vyui/kit/button'
import { VyInput } from '@vyui/kit/input'
import { ref } from 'vue'

const input = ref<any>(null)
const value = ref('Editable text')

async function selectAll() {
  const core = input.value?.inputRef
  const current = await core?.getValue()
  await core?.focus()
  await core?.setSelectionRange(0, current?.value.length ?? 0)
}
</script>

<template>
  <VyInput
    ref="input"
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
- `type` defaults to `text`; the underlying core input defaults `confirmType` to `send`.
- The underlying core input applies its native `maxLength` default of `140`; the kit wrapper does not currently expose a way to change it.
- `disabled` blocks interaction and applies reduced opacity through the default theme.
- `loading` adds a spinning leading icon but does not disable the input.
- A custom `leading` slot, `trailing` slot, icon, avatar, or loading state creates the corresponding side region.
- `icon` routes to the trailing side only when `trailing` is `true`; otherwise it is leading.
- The `leading` boolean is present in the public props but does not currently change shorthand routing by itself.
- The default slot is forwarded into the core native input; use named side slots for visual adornments.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string \| number` | `undefined` | Controlled value used by `v-model`; numbers are rendered as strings. |
| `type` | `'text' \| 'number' \| 'digit' \| 'tel' \| 'email' \| 'password'` | `'text'` | Native input and software-keyboard mode. |
| `confirmType` | `'done' \| 'next' \| 'search' \| 'send' \| 'go'` | Core default `'send'` | Return-key label and behavior. |
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
| `highlight` | `boolean` | `false` | Forces the semantic border and focus ring on permanently. |
| `id` | `string` | `undefined` | Native identifier. |
| `name` | `string` | `undefined` | Native field name. |
| `required` | `boolean` | `false` | Native required marker. |
| `autocomplete` | `string` | `'off'` | Native autocomplete hint. |
| `autofocus` | `boolean` | `false` | Focuses the core input after mount. |
| `autofocusDelay` | `number` | `0` | Delay before autofocus, in milliseconds. |
| `class` | `any` | `undefined` | Classes merged onto the root wrapper. |
| `ui` | `Partial<Record<InputSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

The styled kit wrapper does not currently expose all core input props, including `defaultValue`, `readonly`, `maxLength`, `inputFilter`, and `showSoftInputOnFocus`. Because core defaults `maxLength` to `140`, import `Input` from `@vyui/core` when you need a different limit, those other native controls, or the detailed input and selection events.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | Native value changed; powers `v-model`. |
| `confirm` | `string` | The software keyboard's confirm action fired. |
| `focus` | `string` | The input received focus. |
| `blur` | `string` | The input lost focus. |
| `keyboard` | `{ visible: boolean, height: number, safeAreaBottom: number }` | Normalized software-keyboard visibility and dimensions. |

The core primitive also emits detailed `input(value, selectionStart, selectionEnd, isComposing)` and `selectionChange(selectionStart, selectionEnd)` events, but the kit wrapper does not currently forward them.

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `leading` | `{ iconColor: string }` | Replaces the loading icon, avatar, or leading icon. |
| `trailing` | `{ iconColor: string }` | Replaces the trailing icon. |
| `default` | — | Forwarded to the underlying core input primitive. |

## Exposed

| Property | Type | Description |
| --- | --- | --- |
| `inputRef` | `InputExposed \| null` | Core input instance containing the imperative methods. |

`setValue()` changes the native value but does not itself emit `update:modelValue`. `clear()` emits an empty model value when the core input is controlled.

## Styling and theming

Override globally through `appConfig.ui.input` or locally with `ui`.

```ts
import { createApp } from 'vue-lynx'
import { VyUI } from '@vyui/kit'
import App from './App.vue'

createApp(App)
  .use(VyUI, {
    ui: {
      input: {
        slots: {
          root: 'rounded-xl',
        },
        defaultVariants: {
          variant: 'soft',
          size: 'lg',
        },
      },
    },
  })
  .mount()
```

| UI slot | Purpose |
| --- | --- |
| `root` | Surface, border, radius, horizontal layout, padding, and gaps. |
| `base` | Native input, typed text, placeholder, and vertical padding. |
| `leading` | Leading adornment wrapper. |
| `leadingIcon` | Loading or leading icon. |
| `leadingAvatar` | Leading avatar. |
| `trailing` | Trailing adornment wrapper. |
| `trailingIcon` | Trailing icon. |

The theme combines `size`, `variant`, `color`, `highlight`, and internal leading, trailing, and loading states. `outline` and `subtle` use semantic borders, while `soft`, `ghost`, and `none` reduce or remove the border treatment. While focused, or when `highlight` is set, the root paints a semantic border plus a shadow ring in the active `color`.

Because CSS inheritance is disabled in the Lynx build, typed-text and placeholder colors belong on `base`, while surface and border classes belong on `root`. The loading icon defaults to `appConfig.ui.icons.loading`; override that semantic icon globally or use `loadingIcon` per input.

## Accessibility

Give every input a visible label. Use `id` with `VyLabel` where your form structure supports it, and keep instructions and validation text next to the field rather than relying on placeholder text, icons, or border color alone.

The core native input exposes the keyboard accessibility trait. `disabled`, `required`, `type`, and `autocomplete` are forwarded, but `highlight`, `loading`, icons, and avatars do not add an accessible description or invalid state. Give any interactive control placed in a side slot its own label and adequate tap target.

Use `type="password"` for secret text, but do not assume the keyboard type validates or sanitizes input. Autofocus can unexpectedly move focus and open the software keyboard, so reserve it for flows where immediate text entry is the user's clear next action.

## Platform notes

- The underlying control is Lynx's native `<input>`, with DOM fallbacks used by the core imperative methods in tests and web-compatible runtimes.
- The normalized `keyboard` event comes from the focused native element and reports both keyboard height and safe-area bottom inset.
- Use [`KeyboardAware`](/components/keyboard-aware) wrappers when the software keyboard may cover the field. Inside a `VyKeyboardAwareRoot`, the input registers itself, with no `VyKeyboardAwareTrigger` wrap needed.
- Software-keyboard layouts, autocomplete behavior, password masking, and return-key labels can differ across iOS, Android, and web.
- Focus is tracked in JS because Lynx has no `:focus-within` and the border and ring live on the root wrapper, not the native input; the ring itself is a flat `box-shadow`.
- Leading and trailing elements are flex siblings rather than absolute overlays because Lynx does not reliably layer them over a native text input.
- Lynx SVG does not inherit `currentColor`, so built-in and custom icon slots receive an explicit resolved hex color.
- The default theme uses vyui's semantic surface/text/border tokens, so it adapts automatically under dark mode (see [Theming → Dark Mode](/theming/dark-mode)).

## Related components

- [`Textarea`](/components/textarea) for multi-line text.
- [`KeyboardAware`](/components/keyboard-aware) for avoiding the software keyboard.
- `FormField` and `Label` for labels, help text, and validation messages.
- [`Icon`](/components/icon) for registering and rendering Iconify icons.
