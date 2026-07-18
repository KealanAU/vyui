---
title: Stepper
description: Show progress through an ordered, optionally linear sequence of steps.
navigation:
  icon: i-lucide-list-ordered
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Stepper.vue
    target: _blank
---

## Overview

`VyStepper` renders a styled sequence on top of the `@vyui/core` Stepper primitives. It supports horizontal and vertical layouts, linear or free navigation, semantic colors, four sizes, disabled steps, icons, and custom indicator, title, and description slots.

::component-code
---
name: stepper-example
height: 240px
---
::

## Usage

`VyStepper` uses zero-based indexes: the first item is `0`, the second is `1`, and so on.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyStepper } from '@vyui/kit/stepper'

const step = ref(0)
const items = [
  { title: 'Account', description: 'Create your profile' },
  { title: 'Plan', description: 'Choose a subscription' },
  { title: 'Payment', description: 'Add a payment method' },
  { title: 'Done', description: 'Review and confirm' },
]
</script>

<template>
  <view class="flex flex-col gap-4">
    <VyStepper v-model="step" :items="items" />

    <view class="flex flex-row gap-2">
      <VyButton
        label="Back"
        color="neutral"
        variant="soft"
        :disabled="step === 0"
        @tap="step--"
      />
      <VyButton
        label="Next"
        :disabled="step === items.length - 1"
        @tap="step++"
      />
    </view>
  </view>
</template>
```

### Icons and disabled steps

Set `icon` on an item to replace its number. Set `disabled` on an item, or on the component, to prevent selection.

```vue
<script setup lang="ts">
import { VyStepper } from '@vyui/kit/stepper'

const items = [
  { title: 'Profile', icon: 'i-lucide-user-round' },
  { title: 'Security', icon: 'i-lucide-shield-check' },
  {
    title: 'Billing',
    description: 'Available after verification',
    icon: 'i-lucide-credit-card',
    disabled: true,
  },
]
</script>

<template>
  <VyStepper :items="items" />
</template>
```

### Vertical, non-linear navigation

Vertical orientation stacks the items. Set `linear="false"` when users may jump directly to any enabled step.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyStepper } from '@vyui/kit/stepper'

const step = ref(1)
const items = [
  { title: 'Contact', description: 'Name and email' },
  { title: 'Delivery', description: 'Address and schedule' },
  { title: 'Review', description: 'Check the order' },
]
</script>

<template>
  <VyStepper
    v-model="step"
    :items="items"
    orientation="vertical"
    :linear="false"
    color="success"
    size="lg"
  />
</template>
```

### Custom step content

The fixed slots receive the current `item` and zero-based `index`.

```vue
<VyStepper :items="items">
  <template #indicator="{ index }">
    <text>{{ index === 2 ? '✓' : index + 1 }}</text>
  </template>

  <template #title="{ item, index }">
    <text>{{ index + 1 }}. {{ item.title }}</text>
  </template>

  <template #description="{ item }">
    <text v-if="item.description">{{ item.description }}</text>
  </template>
</VyStepper>
```

## Features and behavior

- The public value is a zero-based item index. The wrapper converts it to the core primitive's one-based step value internally.
- In linear mode, the current step, completed steps, and the next step are selectable. Later future steps are disabled.
- In non-linear mode, every enabled step is directly selectable.
- A step becomes `completed` when its index is before the active index, `active` at the current index, and `inactive` after it.
- `defaultValue` initializes uncontrolled state. Use `v-model` or `modelValue` for controlled state.
- `orientation` changes both the item layout and separator direction.
- Programmatic values are not clamped by the kit wrapper; keep them between `0` and `items.length - 1`.
- `StepperItem.slot` is present in the exported type but is not currently rendered by the kit component. Use the fixed `indicator`, `title`, and `description` slots.

### Stepper item

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Step heading, replaced by the `title` slot when provided. |
| `description` | `string` | — | Supporting text, replaced by the `description` slot when provided. |
| `icon` | `string` | Step number | Iconify name rendered inside the indicator. |
| `slot` | `string` | Item index | Reserved per-item content slot name; currently not rendered by `VyStepper`. |
| `disabled` | `boolean` | `false` | Prevents direct selection of this step. |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `StepperItem[]` | Required | Ordered steps to render. |
| `modelValue` | `number` | `undefined` | Controlled zero-based active index, used by `v-model`. |
| `defaultValue` | `number` | `0` | Initial zero-based active index when uncontrolled. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Step and separator layout. |
| `linear` | `boolean` | `true` | Requires users to progress in order when enabled. |
| `color` | `Color` | `'primary'` | Active and completed indicator and separator color. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Indicator, icon, title, description, and spacing scale. |
| `disabled` | `boolean` | `false` | Disables every step. |
| `class` | `any` | `undefined` | Classes merged onto the root slot. |
| `ui` | `Partial<Record<StepperSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports kit color registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `number` | Emitted with the new zero-based index after a step is selected. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `indicator` | `{ item: StepperItem, index: number }` | Replaces the built-in icon or step number. |
| `title` | `{ item: StepperItem, index: number }` | Replaces the item title. |
| `description` | `{ item: StepperItem, index: number }` | Replaces the item description. |

## Styling and theming

Override globally through `appConfig.ui.stepper` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Overall orientation, width, and gap. |
| `header` | Row or column containing all steps. |
| `item` | Individual state group and alignment. |
| `container` | Indicator and separator positioning wrapper. |
| `trigger` | Circular tappable indicator background. |
| `indicator` | Inner indicator alignment. |
| `icon` | Built-in icon or numbered text, including state color. |
| `separator` | Connector between adjacent steps. |
| `wrapper` | Title and description wrapper. |
| `title` | Step heading text. |
| `description` | Supporting text. |
| `content` | Reserved content slot styling; not currently applied by `VyStepper`. |

Theme variants are:

| Variant | Values | Effect |
| --- | --- | --- |
| `orientation` | `horizontal`, `vertical` | Changes root, header, item, container, separator, and wrapper layout. |
| `size` | `sm`, `md`, `lg`, `xl` | Changes indicator diameter, icon and text sizes, spacing, and separator offsets. |
| `color` | Registered semantic colors | Colors active and completed triggers and completed separators. |

Inactive triggers use a neutral background and foreground. Active and completed indicator content is white. Disabled items reduce separator opacity through the item state class.

## Accessibility

Each core trigger exposes native Lynx button semantics, reports `active`, `completed`, or `inactive` as its accessibility value, and reports unavailable linear or explicitly disabled steps as disabled. Step titles expose heading semantics.

The title and description elements are not currently associated with the trigger through an explicit accessible label. Numbered indicators provide useful spoken context, but icon-only indicators may not identify their step clearly. Test icon-based and custom indicators with VoiceOver and TalkBack, and keep a visible title for every step.

## Platform notes

- Selection uses Lynx `tap` events on the core trigger; the kit component does not implement web arrow-key navigation.
- State styling is driven by `ui-active`, `ui-completed`, `ui-inactive`, and `ui-disabled` classes supplied by the core primitives.
- Lynx CSS inheritance is disabled in the target setup, so active and completed foreground color is applied directly to the nested icon or numbered `text`, not inherited from the trigger.
- Horizontal layouts hide overflow in the header. Keep labels concise or switch to vertical orientation when space is limited.

## Related components

- `Progress` for continuous or non-interactive completion feedback.
- `Tabs` for switching freely between peer views.
- `Form` for validating the data collected across a multi-step flow.
- The `StepperRoot`, `StepperItem`, and related primitives from `@vyui/core` for a fully custom composition.
