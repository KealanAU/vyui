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

::component-code
---
name: button-example
height: 190px
---
::

## Usage

Use `label` for simple text, or the default slot for custom content. Listen for presses with `@tap`; Lynx exposes tap events instead of DOM click events.

```vue
<script setup lang="ts">
import { VyButton } from '@vyui/kit/button'

function saveDraft() {
  // Persist the draft.
}
</script>

<template>
  <VyButton label="Save draft" @tap="saveDraft" />
</template>
```

### Label

Use the `label` prop when the button text is plain. Slot content replaces the built-in label and can contain custom Lynx markup.

```vue
<VyButton label="Continue" />

<VyButton>
  <view class="flex flex-row items-center gap-2">
    <text>Continue</text>
    <text class="text-xs text-primary-100">Beta</text>
  </view>
</VyButton>
```

### Color

Use `color` to select the semantic palette.

```vue
<VyButton color="primary" label="Primary" />
<VyButton color="success" label="Success" />
<VyButton color="warning" label="Warning" />
<VyButton color="error" label="Error" />
<VyButton color="neutral" label="Neutral" />
```

### Variant

`color` selects the semantic palette; `variant` selects the fill treatment.

::component-code
---
name: button-variants
height: 340px
---
::

```vue
<VyButton color="primary" variant="solid" label="Solid" />
<VyButton color="primary" variant="outline" label="Outline" />
<VyButton color="primary" variant="subtle" label="Subtle" />
<VyButton color="neutral" variant="soft" label="Soft" />
<VyButton color="error" variant="ghost" label="Ghost" />
<VyButton color="primary" variant="link" label="Link" />
```

### Sizes

Use `size` to change padding, text scale, icon size, and avatar size.

::component-code
---
name: button-sizes
height: 310px
---
::

```vue
<VyButton size="xs" label="XS" />
<VyButton size="sm" label="SM" />
<VyButton size="md" label="MD" />
<VyButton size="lg" label="LG" />
<VyButton size="xl" label="XL" />
```

### Icon

Use `icon`, `leadingIcon`, or `trailingIcon` to show an Iconify glyph inside the button.

`leadingIcon` / `trailingIcon` place explicit Iconify glyphs. The `icon` shorthand goes to the trailing side when `trailing` is set, otherwise the leading side. `avatar` renders a `VyAvatar` in the leading slot instead of an icon.

::component-code
---
name: button-icons
height: 230px
---
::

```vue
<VyButton icon="i-lucide-rocket" label="Launch" />
<VyButton leading-icon="i-lucide-arrow-left" label="Back" />
<VyButton trailing-icon="i-lucide-arrow-right" label="Next" />
```

With no `label` and no default slot, the button automatically uses a square icon-only footprint. Add `accessibility-label` for icon-only actions.

```vue
<VyButton icon="i-lucide-search" accessibility-label="Search" />
```

### Avatar

Use `avatar` to render a `VyAvatar` on the leading side. The avatar inherits a size token from the button unless `avatar.size` is set.

```vue
<VyButton
  :avatar="{ src: 'https://github.com/nuxt.png', alt: 'Nuxt' }"
  label="Nuxt"
  color="neutral"
  variant="outline"
/>
```

An avatar-only button also collapses to the square footprint.

```vue
<VyButton
  :avatar="{ src: 'https://github.com/nuxt.png', alt: 'Nuxt' }"
  accessibility-label="Open Nuxt profile"
/>
```

### Loading

Use `loading` to show the loading icon and block interaction. Because `loading` sets the underlying core button to disabled, `tap` will not emit while it is loading.

::component-code
---
name: button-loading
height: 220px
---
::

```vue
<VyButton :loading="submitting" label="Saving" />
```

Use `loadingIcon` to override the spinner for one button. The global default comes from `appConfig.ui.icons.loading`.

```vue
<VyButton loading loading-icon="i-lucide-loader" label="Loading" />
```

Override the global loading icon through the `VyUI` plugin config.

```ts
provideVyUI(app, {
  ui: {
    icons: {
      loading: 'tabler:loader-2'
    }
  }
})
```

### Disabled

Use `disabled` to prevent interaction and apply the disabled visual state. Loading buttons are disabled automatically.

::component-code
---
name: button-disabled
height: 210px
---
::

```vue
<VyButton disabled label="Disabled" />
```

### Form submission

`VyButton` does not submit a native HTML form on Lynx. With `VyForm`, call the exposed `submit()` method from `@tap` and bind the form slot's `submitting` state to `loading`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyForm } from '@vyui/kit/form'
import { VyFormField } from '@vyui/kit/form-field'
import { VyInput } from '@vyui/kit/input'

const form = ref()

function onSubmit(values: Record<string, unknown>) {
  // Send values.
}
</script>

<template>
  <VyForm ref="form" :default-values="{ email: '' }" @submit="onSubmit">
    <template #default="{ submitting }">
      <VyFormField name="email" label="Email">
        <VyInput name="email" />
      </VyFormField>

      <VyButton :loading="submitting" label="Submit" @tap="form.submit()" />
    </template>
  </VyForm>
</template>
```

### Block and square

Use `block` for full-width actions. A block button with a trailing icon pushes that icon to the far edge.

::component-code
---
name: button-layouts
height: 230px
---
::

```vue
<VyButton block label="Create project" trailing-icon="i-lucide-arrow-right" />
```

Use `square` to force equal-sided padding, even when content would normally create a wider button.

```vue
<VyButton square icon="i-lucide-plus" accessibility-label="Create" />
```

### Custom slots

Use the default slot to replace the built-in label. Use `leading` and `trailing` to replace the built-in icon areas; both scoped slots receive `iconColor` so custom icons can match the resolved variant foreground.

::component-code
---
name: button-slots
height: 220px
---
::

```vue
<VyButton label="Deploy" variant="outline">
  <template #leading="{ iconColor }">
    <VyIcon name="i-lucide-cloud-upload" :color="iconColor" class="size-5" />
  </template>
</VyButton>
```

## Examples

### `class` prop

Use `class` to override root styles for one button.

::component-code
---
name: button-styling
height: 210px
---
::

```vue
<VyButton class="rounded-full px-5" label="Rounded" />
```

### `ui` prop

Use `ui` to override a named theme slot after variants are resolved.

```vue
<VyButton
  icon="i-lucide-rocket"
  color="neutral"
  variant="outline"
  label="Launch"
  :ui="{
    label: 'text-primary-600 font-semibold',
    leadingIcon: 'size-6'
  }"
/>
```

## Features and behavior

- `label` renders the text; the default slot overrides it.
- `loading` shows a spinner (`loadingIcon`, default `appConfig.ui.icons.loading`) and blocks interaction.
- `disabled` blocks `tap` emission and applies the disabled visual state.
- `block` stretches to full width and pushes a trailing icon to the far edge; `square` produces an equal-sided icon button.
- With no `label` and no default slot, icon-only and avatar-only buttons automatically use the square footprint.
- The `leading` / `trailing` slots receive `iconColor` so custom glyphs can match the variant's resolved foreground.
- Unlike Nuxt UI's web button, `VyButton` does not currently render links and does not support `to`, `href`, active variants, or automatic promise-based loading.

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

The core button exposes button semantics and announces disabled state through the Lynx accessibility helpers. Provide a clear visible `label` or custom accessible content; for icon-only and avatar-only buttons, pass `accessibility-label`.

The control does not participate in native HTML form submission, so call the form submit handler from `@tap` when using `VyButton` with `VyForm`.

## Platform notes

- Interaction uses Lynx `tap`, exposed as Vue's `@tap`, rather than DOM `click`.
- Lynx SVG does not inherit `currentColor`; built-in icons resolve the semantic foreground to an explicit SVG color.
- Foreground classes live on `label`, `leadingIcon`, and `trailingIcon`, not only on `base`, because CSS inheritance is disabled in the Lynx build.
- Hover and focus-visible states from the Nuxt UI web button are intentionally omitted; pressed feedback uses Lynx `active:` classes.

## Related components

- [`Icon`](/components/icon) for the leading/trailing glyphs.
- [`Avatar`](/components/avatar) for the `avatar` prop.
- [`Form`](/components/form) for submit buttons inside a form.
- [`Island Button`](/components/island-button) for actions inside island layouts.
