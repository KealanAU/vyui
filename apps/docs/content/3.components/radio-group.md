---
title: Radio Group
description: Choose one value from a visible set of labeled options.
navigation:
  icon: i-lucide-circle-dot
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/RadioGroup.vue
    target: _blank
---

## Overview

`VyRadioGroup` renders a themed single-choice field from strings, numbers, or item objects. It supports controlled and uncontrolled state, legends, descriptions, horizontal or vertical layout, semantic colors, four sizes, disabled items, required styling, and custom text slots.

::component-code
---
name: radio-group-example
height: 240px
---
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyRadioGroup } from '@vyui/kit'

const plan = ref('pro')
const items = [
  { label: 'Free', value: 'free', description: 'For personal projects.' },
  { label: 'Pro', value: 'pro', description: 'For growing teams.' },
  { label: 'Enterprise', value: 'enterprise', description: 'For larger organizations.' },
]
</script>

<template>
  <VyRadioGroup
    v-model="plan"
    legend="Choose a plan"
    :items="items"
  />
</template>
```

For valid items, the value is a string or number. Each selection replaces the previous value.

### Primitive items

String and number entries are normalized into matching labels and values.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyRadioGroup } from '@vyui/kit'

const seats = ref(5)
</script>

<template>
  <VyRadioGroup
    v-model="seats"
    legend="Team size"
    :items="[1, 5, 10, 25]"
    orientation="horizontal"
  />
</template>
```

Primitive numbers remain numbers in the emitted value; their visible labels use `String(item)`.

### Item descriptions and disabled choices

Object items can include supporting text and an item-level disabled state.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyRadioGroup } from '@vyui/kit'

const delivery = ref('standard')
const options = [
  {
    label: 'Standard',
    value: 'standard',
    description: 'Arrives in 3–5 business days.',
  },
  {
    label: 'Express',
    value: 'express',
    description: 'Arrives the next business day.',
  },
  {
    label: 'Same day',
    value: 'same-day',
    description: 'Unavailable for this address.',
    disabled: true,
  },
]
</script>

<template>
  <VyRadioGroup
    v-model="delivery"
    legend="Delivery speed"
    :items="options"
  />
</template>
```

Group-level `disabled` disables every choice; an item's `disabled` field affects only that radio.

### Uncontrolled initial value

Use `defaultValue` when the parent does not need to keep the current selection reactive.

```vue
<VyRadioGroup
  default-value="comfortable"
  legend="Interface density"
  :items="[
    { label: 'Comfortable', value: 'comfortable' },
    { label: 'Compact', value: 'compact' }
  ]"
/>
```

For source-accurate selected-color styling, prefer `v-model`: the kit theme's checked variant is calculated from `modelValue`, while the core primitive owns uncontrolled state initialized by `defaultValue`.

### Horizontal layout

Set `orientation="horizontal"` to wrap choices across a row.

```vue
<VyRadioGroup
  v-model="billingCycle"
  legend="Billing cycle"
  orientation="horizontal"
  color="secondary"
  size="lg"
  :items="[
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' }
  ]"
/>
```

Horizontal orientation changes layout only. It does not change item order or add keyboard navigation in the kit wrapper.

### Custom legend, labels, and descriptions

The named slots replace built-in text. Item slots receive each normalized item and the controlled `modelValue`.

```vue
<VyRadioGroup v-model="account" :items="accounts">
  <template #legend>
    Pay with · Secure
  </template>

  <template #label="{ item, modelValue }">
    <text class="font-medium text-neutral-900">
      {{ item.label }}
      <text v-if="item.value === modelValue"> (selected)</text>
    </text>
  </template>

  <template #description="{ item }">
    <text class="text-xs text-neutral-500">
      Ending in {{ item.lastFour }}
    </text>
  </template>
</VyRadioGroup>
```

Additional object fields are retained on the normalized item and are available to both item slots.

The `legend` slot replaces the contents of the component's themed `text` node, so keep it text-compatible. The `label` and `description` slots render inside the item copy wrapper and can provide richer Lynx markup.

## Features and behavior

- `modelValue` controls the selected string or number; `defaultValue` initializes uncontrolled core state.
- String and number entries become `{ value: item, label: String(item) }`.
- Object items resolve `value` from `item.value`, falling back to `item.label`.
- Object labels resolve from `item.label`, falling back to `String(value)`.
- Every normalized item receives an internal id in the form `<group-id>:<value>`.
- Object items should provide at least `value` or `label`, and resolved values should be unique because they are also used as render keys.
- Tapping an enabled item updates the root value and emits `update:modelValue`.
- Selecting the active radio again keeps it selected; the group does not clear itself.
- Group-level and item-level disabled states are combined for the radio control.
- `required` forwards to the core controls and adds a visual asterisk to the built-in legend.
- The kit wrapper forwards `name`, `id`, and `orientation`, but does not expose the core root's `dir` or `loop` props.

### Radio group item

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | String form of the resolved value | Visible item label. |
| `description` | `string` | `undefined` | Supporting text below the label. |
| `value` | `string \| number` | `label` | Selection value, internal id suffix, and render key. |
| `disabled` | `boolean` | `false` | Prevents selection of this item. |
| `[key: string]` | `any` | — | Additional application data retained and exposed to item slots. |

The `items` array also accepts primitive strings and numbers.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string \| number` | `undefined` | Controlled selection used by `v-model`. |
| `defaultValue` | `string \| number` | `undefined` | Initial value for uncontrolled core state. |
| `items` | `Array<RadioGroupItemShape \| string \| number>` | `undefined` | Choices to normalize and render. |
| `legend` | `string` | `undefined` | Optional visual heading replaced by the `legend` slot. |
| `disabled` | `boolean` | `false` | Disables every radio in the group. |
| `required` | `boolean` | `false` | Forwards required state and decorates the built-in legend with an asterisk. |
| `name` | `string` | `undefined` | Name forwarded to the core radio group. |
| `id` | `string` | Generated Vue id | Group id and prefix used to generate item ids. |
| `color` | `Color` | `'primary'` | Semantic checked-state color. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Radio, indicator, legend, label, and description dimensions. |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | Wrapping row or stacked column layout. |
| `class` | `any` | `undefined` | Classes merged onto the radio group root. |
| `ui` | `Partial<Record<RadioGroupSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string \| number` | Emitted when an enabled choice becomes selected. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `legend` | — | Replaces the visual legend text. |
| `label` | `{ item, modelValue }` | Replaces every built-in item label. `item` is normalized. |
| `description` | `{ item, modelValue }` | Replaces every built-in item description. `item` is normalized. |

`modelValue` in the item slots is the controlled prop value. In uncontrolled usage it can remain `undefined` even after the core selection changes.

## Styling and theming

Override globally through `appConfig.ui.radioGroup` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Outer relative container. The `class` prop is also merged here. |
| `fieldset` | Flex layout containing the legend and items. |
| `legend` | Built-in legend text and required marker. |
| `item` | One radio and its copy, aligned from the top. |
| `base` | Interactive circular radio surface and checked semantic fill. |
| `indicator` | Inner white dot rendered for the checked item. |
| `container` | Alignment wrapper around the circular control. |
| `wrapper` | Label and description column. |
| `label` | Built-in item label. |
| `description` | Built-in supporting text. |

### Theme variants

| Variant | Values | Default | Effect |
| --- | --- | --- | --- |
| `color` | Registered semantic colors | `'primary'` | Colors the checked radio surface and border. |
| `size` | `sm`, `md`, `lg`, `xl` | `'md'` | Scales radios, indicators, text, line containers, and gaps. |
| `orientation` | `horizontal`, `vertical` | `'vertical'` | Uses a wrapping row or stacked column for the fieldset. |
| `checked` | `true`, `false` | Per controlled item | Applies the semantic checked fill and thicker border. |
| `disabled` | `true`, `false` | Group or item state | Reduces control and label opacity. |
| `required` | `true`, `false` | From `required` | Appends a red asterisk to the built-in legend. |

Unchecked radios use a white surface with a neutral `300` border. Checked radios use the selected semantic color at shade `500`, a two-pixel matching border, and a white inner dot.

## Accessibility

Each core radio is exposed as an accessibility element with radio semantics mapped to a native button trait. It announces `checked` or `unchecked`, and disabled radios receive the disabled trait.

The kit wrapper renders visible labels and descriptions beside each control, but it does not currently forward an `accessibility-label` to the radio or associate the Lynx `text` nodes as native labels. The generated item `id` is not paired with a web `<label>`. Treat accessible naming as a current limitation, test the result with VoiceOver and TalkBack, and use `RadioGroupRoot`, `RadioGroupItem`, and `RadioGroupIndicator` from `@vyui/core` when explicit per-item accessibility labels are required.

The root does not add a native group or fieldset role, and the visual legend is not automatically announced as the group's accessible name. The required asterisk is also visual; provide separate validation messaging and do not rely on it alone.

## Platform notes

- The component uses Lynx `view` and `text` nodes rather than DOM `<fieldset>`, `<input type="radio">`, and `<label>` elements.
- Selection is handled by native `tap` events through the core radio primitives.
- The indicator is conditionally mounted only for the checked item.
- The default theme is light-mode oriented and omits DOM focus-ring and hover styles.
- `name`, `id`, and `required` are forwarded to core primitives, but the kit group does not provide standalone native browser form submission.
- Core direction and looping metadata exist in `@vyui/core`; the kit wrapper does not expose them and does not implement DOM arrow-key behavior.

## Related components

- [`Checkbox`](/components/checkbox) for choosing any number of independent options.
- [`Select`](/components/select) for one choice in a compact trigger and popup.
- [`Toggle Group`](/components/toggle-group) for toolbar-like single or multiple selection.
- [`Rating`](/components/rating) for an ordered numeric score.
