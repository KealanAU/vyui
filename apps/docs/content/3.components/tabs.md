---
title: Tabs
description: Organize related views behind a selectable row or rail of tabs.
navigation:
  icon: i-lucide-panels-top-left
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Tabs.vue
    target: _blank
---

## Overview

`VyTabs` renders an animated tab indicator, selectable triggers, and optional content panels on top of the `@vyui/core` tabs primitives. It supports horizontal and vertical layouts, pill and link treatments, controlled or uncontrolled state, icons, disabled items, static content, and named content slots.

::component-code
---
name: tabs-example
height: 220px
---
::

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyTabs } from '@vyui/kit'

const active = ref('overview')
const items = [
  {
    label: 'Overview',
    value: 'overview',
    icon: 'i-lucide-layout-dashboard',
    content: 'Your account summary and recent activity.',
  },
  {
    label: 'Security',
    value: 'security',
    icon: 'i-lucide-shield-check',
    content: 'Passkeys, passwords, and signed-in devices.',
  },
  {
    label: 'Billing',
    value: 'billing',
    icon: 'i-lucide-credit-card',
    content: 'Plan, payment method, and invoices.',
  },
]
</script>

<template>
  <VyTabs v-model="active" :items="items" />
</template>
```

Give items explicit `value` fields when state is stored or shared. Without one, `VyTabs` uses the zero-based index converted to a string, such as `'0'`.

### Named content slots

Set an item's `slot` to render a different named slot for its panel. Every content slot receives `item` and `index`.

```vue
<script setup lang="ts">
import { VyButton, VyTabs } from '@vyui/kit'

const items = [
  { label: 'Profile', value: 'profile', slot: 'profile' },
  { label: 'Devices', value: 'devices', slot: 'devices' },
]
</script>

<template>
  <VyTabs :items="items" default-value="profile">
    <template #profile>
      <view class="gap-3 rounded-xl bg-neutral-50 p-4">
        <text class="font-semibold text-neutral-900">Public profile</text>
        <text class="text-sm text-neutral-500">
          Choose the details other people can see.
        </text>
        <VyButton size="sm">Edit profile</VyButton>
      </view>
    </template>

    <template #devices>
      <view class="gap-2 rounded-xl bg-neutral-50 p-4">
        <text class="font-semibold text-neutral-900">Signed-in devices</text>
        <text class="text-sm text-neutral-500">iPhone 16 Pro · Stockholm</text>
        <text class="text-sm text-neutral-500">Pixel 9 · Last active yesterday</text>
      </view>
    </template>
  </VyTabs>
</template>
```

If `item.slot` is omitted, the panel uses the `content` slot. If no matching slot is supplied, `item.content` is rendered as a `text` node.

### Vertical navigation

Vertical tabs place the trigger rail beside the active panel. Give the component or its parent a useful height when the panel should fill a bounded region.

```vue
<script setup lang="ts">
import { VyTabs } from '@vyui/kit'

const sections = [
  { label: 'General', value: 'general', icon: 'i-lucide-settings', content: 'General preferences' },
  { label: 'Privacy', value: 'privacy', icon: 'i-lucide-lock', content: 'Privacy controls' },
  { label: 'About', value: 'about', icon: 'i-lucide-info', content: 'App and legal information' },
]
</script>

<template>
  <VyTabs
    class="h-64"
    :items="sections"
    default-value="general"
    orientation="vertical"
    variant="link"
  />
</template>
```

### Crowded mobile tabs

Use `direction="stacked"` to place an icon above its label when several horizontal triggers share a narrow phone width.

```vue
<VyTabs
  v-model="active"
  :items="destinations"
  direction="stacked"
  size="sm"
  :content="false"
/>
```

Set `content="false"` when the tabs only control content rendered elsewhere.

### Custom triggers

The trigger slots receive the item and index. The `leading` slot additionally receives the resolved icon color required for Lynx SVG rendering.

```vue
<VyTabs :items="items">
  <template #leading="{ item, iconColor }">
    <VyIcon :name="item.icon" :color="iconColor" />
  </template>

  <template #default="{ item }">
    {{ item.shortLabel ?? item.label }}
  </template>

  <template #trailing="{ item }">
    <VyBadge v-if="item.count" :label="String(item.count)" size="sm" />
  </template>
</VyTabs>
```

## Features and behavior

- Bind `v-model` to control the active item, or use `defaultValue` for uncontrolled state.
- `defaultValue` defaults to `'0'`, matching the first item only when that item uses its fallback value.
- Each item uses `value` as its identity; otherwise it uses `String(index)`.
- Disabled items are dimmed and ignore taps.
- `content="false"` omits every content panel while keeping the tab triggers interactive.
- Inactive panels are currently removed from the tree. Although `unmountOnHide` is forwarded to the core root, the current content primitive does not preserve hidden panels when it is `false`.
- The indicator measures the active native Lynx trigger and updates after layout changes.
- Item data is forwarded unchanged to trigger and content slot props.

### Tab item

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Built-in trigger label. |
| `icon` | `string` | — | Leading Iconify icon name. |
| `slot` | `string` | `'content'` | Named slot used for this item's panel. |
| `content` | `string` | — | Static panel text when no matching content slot is supplied. |
| `value` | `string \| number` | `String(index)` | Unique trigger and panel identity. |
| `disabled` | `boolean` | `false` | Prevents activation. |
| `[key: string]` | `any` | — | Additional application data forwarded in slot props. |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `TabsItem[]` | `undefined` | Tab definitions rendered in order. |
| `modelValue` | `string \| number` | `undefined` | Controlled active value used by `v-model`. |
| `defaultValue` | `string \| number` | `'0'` | Initial active value when uncontrolled. |
| `color` | `Color` | `'primary'` | Semantic indicator and active-label color. |
| `variant` | `'pill' \| 'link'` | `'pill'` | Filled indicator or underline/side-line treatment. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Trigger padding, text, gap, and icon scale. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Trigger and content layout axis. |
| `direction` | `'inline' \| 'stacked'` | `'inline'` | Icon and label layout inside each trigger. |
| `content` | `boolean` | `true` | Whether to render content panels. |
| `unmountOnHide` | `boolean` | `true` | Forwarded to the core tabs root. The current content primitive still unmounts inactive panels when this is `false`. |
| `class` | `any` | `undefined` | Classes merged onto the tabs root. |
| `ui` | `Partial<Record<TabsSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string \| number` | Emitted with the activated item's resolved value. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `leading` | `{ item, index, iconColor }` | Replaces the built-in leading icon. |
| `default` | `{ item, index }` | Replaces each trigger label. |
| `trailing` | `{ item, index }` | Adds content after each trigger label. |
| `content` | `{ item, index }` | Default panel content slot. |
| `[item.slot]` | `{ item, index }` | Named panel selected by an item's `slot` field. |

## Styling and theming

Override globally through `appConfig.ui.tabs` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Overall tabs layout, width, and gap. |
| `list` | Trigger rail and indicator positioning context. |
| `indicator` | Animated pill, underline, or side line. |
| `trigger` | Individual interactive tab. |
| `content` | Each active content panel. |
| `leadingIcon` | Built-in leading icon sizing. |
| `leadingAvatar` | Reserved theme slot; the current component does not render a built-in avatar. |
| `label` | Built-in trigger label and truncation. |

### Theme variants

| Variant | Values | Default | Effect |
| --- | --- | --- | --- |
| `color` | Registered semantic colors | `'primary'` | Colors the indicator and active link label. Pill labels remain white while active. |
| `variant` | `pill`, `link` | `'pill'` | Selects a filled segmented control or a line indicator. |
| `size` | `sm`, `md`, `lg`, `xl` | `'md'` | Changes trigger padding, label size, gaps, and icon size. |
| `orientation` | `horizontal`, `vertical` | `'horizontal'` | Arranges the list above the panel or beside it and changes indicator geometry. |
| `direction` | `inline`, `stacked` | `'inline'` | Arranges trigger children in a row or column. |

The theme also reacts to the core trigger's active, inactive, and disabled state. Pill triggers divide the horizontal rail evenly; link triggers size to their content.

## Accessibility

Each core trigger is exposed as an accessibility element with tab semantics. The active trigger announces a selected state, and a disabled item announces disabled state and cannot be activated.

Use concise, unique labels and keep visible text in custom trigger slots. Icon-only tabs need an accessible naming strategy, but the current kit wrapper does not expose a per-item accessibility-label field, so prefer visible labels for production navigation. Do not rely only on the indicator color to communicate selection.

## Platform notes

- The indicator uses native Lynx element measurement rather than DOM offsets. It remains hidden until the first non-zero layout measurement to avoid flashing at the wrong position.
- Lynx SVG does not inherit `currentColor`; built-in icons receive a resolved fill, and the `leading` slot receives the same `iconColor`.
- Inactive content is currently conditionally rendered regardless of `unmountOnHide`; do not rely on hidden panels retaining local component state.
- The theme uses vyui's semantic tokens, so it adapts automatically under dark mode (see [Theming](/theming)), and intentionally omits DOM focus-ring and hover behavior.
- Long built-in labels truncate. Use `direction="stacked"`, fewer tabs, or a vertical layout when a narrow horizontal rail becomes crowded.

## Related components

- [`Accordion`](/components/accordion) for independently collapsible sections.
- `BottomNavigation` for primary app-level destinations.
- `SegmentedControl` for choosing one value without associated content panels.
