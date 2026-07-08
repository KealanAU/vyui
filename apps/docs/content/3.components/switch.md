---
title: Switch
description: Toggle a persistent setting between on and off states.
navigation:
  icon: i-lucide-toggle-right
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Switch.vue
    target: _blank
---

## Overview

`VySwitch` is a styled boolean control built on the `@vyui/core` switch primitives. It supports labels, descriptions, semantic colors, four sizes, checked and unchecked icons, loading state, disabled state, and a static highlight ring.

::component-code
---
name: switch-example
height: 120px
---
::

::component-code
---
name: switch-colors
height: 160px
---
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySwitch } from '@vyui/kit'

const notifications = ref(true)
</script>

<template>
  <VySwitch
    v-model="notifications"
    label="Push notifications"
    description="Receive alerts for messages and account activity."
  />
</template>
```

`v-model` is boolean. The component defaults to `false` when no value is supplied.

### Settings list

Keep each switch bound to the setting it changes. The surrounding row can provide visual grouping, but the switch itself is the interactive control.

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { VySwitch } from '@vyui/kit'

const preferences = reactive({
  mentions: true,
  marketing: false,
  analytics: true,
})
</script>

<template>
  <view class="gap-4 rounded-2xl bg-white p-4">
    <VySwitch
      v-model="preferences.mentions"
      label="Mentions"
      description="Notify me when someone mentions my name."
    />
    <VySwitch
      v-model="preferences.marketing"
      label="Product news"
      description="Occasional announcements and release notes."
      color="secondary"
    />
    <VySwitch
      v-model="preferences.analytics"
      label="Usage analytics"
      description="Share anonymous diagnostics to improve the app."
      color="success"
    />
  </view>
</template>
```

### Icons

Use `checkedIcon` and `uncheckedIcon` for compact state reinforcement. Icons render inside the thumb.

```vue
<VySwitch
  v-model="darkMode"
  label="Dark appearance"
  checked-icon="i-lucide-moon"
  unchecked-icon="i-lucide-sun"
  size="lg"
/>
```

Icons should reinforce the state rather than replace the visible label.

### Loading state

Set `loading` while a remote preference is being saved. This changes the thumb icon but does not disable interaction by itself.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VySwitch } from '@vyui/kit'

const enabled = ref(false)
const saving = ref(false)

async function savePreference(value: boolean) {
  saving.value = true

  try {
    await fetch('https://api.example.com/preferences/cellular-sync', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: value }),
    })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <VySwitch
    v-model="enabled"
    label="Sync over cellular"
    description="Use mobile data when Wi-Fi is unavailable."
    :loading="saving"
    :disabled="saving"
    @update:model-value="savePreference"
  />
</template>
```

Combine `loading` with `disabled` when another tap should not be accepted while the request is pending.

### Custom label and description

Slots replace their corresponding text props and do not receive slot props.

```vue
<VySwitch v-model="automaticUpdates">
  <template #label>
    <view class="flex flex-row items-center gap-2">
      <text class="font-medium text-neutral-900">Automatic updates</text>
      <VyBadge label="Recommended" color="success" size="sm" />
    </view>
  </template>

  <template #description>
    <text class="text-xs text-neutral-500">
      Download updates while the device is charging.
    </text>
  </template>
</VySwitch>
```

### Highlight

`highlight` paints a persistent border in the selected semantic color. It is not a focus or validation state.

```vue
<VySwitch
  v-model="requiredSetting"
  label="Required security setting"
  color="warning"
  highlight
/>
```

## Features and behavior

- Tapping the switch rail toggles `modelValue` and emits the new boolean.
- A disabled switch ignores taps and renders at reduced opacity.
- `loading` takes precedence over checked and unchecked icons.
- `loadingIcon` resolves from the prop, then `appConfig.ui.icons.loading`, then `i-lucide-loader-circle`.
- `checkedIcon` renders only while the value is `true`; `uncheckedIcon` renders only while it is `false`.
- `label` and `description` are optional visual content beside the control.
- `name`, `id`, and `required` are passed to the underlying core control, but it is not a native form input.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | Checked state used by `v-model`. |
| `disabled` | `boolean` | `false` | Prevents toggling and applies disabled styling. |
| `name` | `string` | `undefined` | Name forwarded to the core switch control. |
| `id` | `string` | `undefined` | Identifier forwarded to the core switch control. |
| `required` | `boolean` | `undefined` | Required flag forwarded to the core switch control. |
| `color` | `Color` | `'primary'` | Checked rail and optional highlight color. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Rail, thumb, and icon dimensions. |
| `label` | `string` | `undefined` | Visual label replaced by the `label` slot. |
| `description` | `string` | `undefined` | Supporting text replaced by the `description` slot. |
| `loading` | `boolean` | `false` | Shows a spinning icon inside the thumb. |
| `loadingIcon` | `string` | App icon / `i-lucide-loader-circle` | Iconify name used while loading. |
| `checkedIcon` | `string` | `undefined` | Thumb icon shown when checked. |
| `uncheckedIcon` | `string` | `undefined` | Thumb icon shown when unchecked. |
| `highlight` | `boolean` | `false` | Adds a persistent semantic-color border to the rail. |
| `class` | `any` | `undefined` | Classes merged onto the interactive switch rail. |
| `ui` | `Partial<Record<SwitchSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `boolean` | Emitted after an enabled switch is toggled. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `label` | — | Replaces the visual label text. |
| `description` | — | Replaces the visual supporting text. |

## Styling and theming

Override globally through `appConfig.ui.switch` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Horizontal layout containing the control and copy. |
| `base` | Interactive rounded rail. The `class` prop is also merged here. |
| `thumb` | Moving white thumb. |
| `wrapper` | Label and description column. |
| `label` | Built-in label text. |
| `description` | Built-in supporting text. |
| `icon` | Loading or state icon inside the thumb. |

### Theme variants

| Variant | Values | Default | Effect |
| --- | --- | --- | --- |
| `color` | Registered semantic colors | `'primary'` | Colors the checked rail and highlight border. |
| `size` | `sm`, `md`, `lg`, `xl` | `'md'` | Changes rail, thumb, and icon dimensions. |
| `checked` | `true`, `false` | From `modelValue` | Selects the semantic checked rail or neutral unchecked rail and thumb translation. |
| `disabled` | `true`, `false` | From `disabled` | Reduces opacity and marks the rail non-interactive. |
| `highlight` | `true`, `false` | From `highlight` | Adds a two-pixel semantic-color border. |
| `loading` | `true`, `false` | From `loading` | Spins the icon slot. |

Unchecked switches use a neutral `200` rail and a small leading thumb offset. Checked thumb translation is size-specific.

## Accessibility

The underlying core control exposes switch semantics, an on/off accessibility value, and disabled state. Keep an always-visible label near every switch and do not use color or thumb position as the only explanation of its state.

The current kit wrapper renders `label` and `description` beside the control, but does not make that copy tappable or automatically associate it as the native accessibility label of the inner switch. An `id` is forwarded, but the rendered Lynx `text` is not a web `<label>`. Treat this as a current limitation, verify the accessible name with VoiceOver and TalkBack, and prefer the lower-level `SwitchRoot` and `SwitchThumb` primitives when explicit native accessibility attributes must be attached directly to the control.

Loading is visual only. Disable the control while loading when repeated interaction would be unsafe, and communicate save failures outside the switch.

## Platform notes

- The component uses Lynx `view` and `text` nodes rather than a DOM checkbox input.
- Interaction is handled by the core switch's native `tap` event.
- Thumb translation distances are concrete per size for consistent Lynx rendering.
- The default theme uses vyui's semantic tokens, so it adapts automatically under dark mode (see [Theming → Dark Mode](/theming/dark-mode)), and omits DOM focus-ring and hover styles.
- `name`, `id`, and `required` are passed to the core control, but `VySwitch` does not render a native checkbox input or provide standalone native form submission.

## Related components

- `Checkbox` for agreement, acknowledgement, or multi-select choices.
- `Toggle` for a pressed formatting or tool state.
- `RadioGroup` for choosing exactly one option from a visible set.
