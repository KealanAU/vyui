---
title: Accordion
description: Display collapsible sections with single or multiple open items.
navigation:
  icon: i-lucide-list-collapse
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Accordion.vue
    target: _blank
---

## Overview

`VyAccordion` renders a collection of expandable items on top of the `@vyui/core` accordion primitives. It supports controlled and uncontrolled state, single or multiple selection, disabled items, static content, and per-item named slots.

::component-code
---
name: accordion-example
height: 360px
---
::

## Usage

Import the component from `@vyui/kit` and pass an `items` array. Each example below renders the real component live.

::component-code
---
name: accordion-example
---
::

### Multiple open items

Set `type="multiple"` and bind an array with `v-model`.

::component-code
---
name: accordion-multiple
---
::

### Disabled items

Set `disabled` on an item to prevent it from opening.

::component-code
---
name: accordion-disabled
---
::

### Controlled value

Bind `v-model` to drive the open item from outside the component.

::component-code
---
name: accordion-controlled
---
::

### Custom item content

Use `item.slot` to select a named slot for one item. Every item slot receives `item`, `index`, and `open`.

```vue
<script setup lang="ts">
import { VyAccordion } from '@vyui/kit/accordion'

const items = [
  { value: 'profile', label: 'Profile', slot: 'profile' },
  { value: 'help', label: 'Help', content: 'Contact support@example.com.' },
]
</script>

<template>
  <VyAccordion :items="items">
    <template #profile="{ open }">
      <view class="p-4">
        <text>{{ open ? 'Profile settings are open.' : '' }}</text>
      </view>
    </template>
  </VyAccordion>
</template>
```

## Features and behavior

- `type="single"` allows one open item and is the default. `type="multiple"` allows several.
- In single mode, `collapsible` defaults to `true`, so the current item can be closed.
- `modelValue` controls the open item or items; `defaultValue` initializes uncontrolled state.
- An item uses its `value` as its identity, falling back to its zero-based index converted to a string.
- `item.trailingIcon` overrides the component-level `trailingIcon`. The final fallback is `appConfig.ui.icons.chevronDown`, then `i-lucide-chevron-down`.
- Content is only created when an item has `content`, a matching named slot, the `content` slot, or the `body` slot.
- `unmountOnHide` defaults to `true`, removing closed content from the rendered tree.

### Accordion item

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Text displayed in the trigger. |
| `icon` | `string` | — | Leading Iconify icon name. |
| `trailingIcon` | `string` | Inherited | Per-item toggle icon. |
| `slot` | `string` | `'content'` | Named slot used for this item's panel. |
| `content` | `string` | — | Static panel text used when no slot replaces it. |
| `value` | `string` | Item index | Unique open-state value. |
| `disabled` | `boolean` | `false` | Prevents interaction with this item. |
| `[key: string]` | `any` | — | Additional application data forwarded in slot props. |

## API

These tables are generated directly from the component source.

### Props

::component-props{name="Accordion"}
::

### Emits

::component-emits{name="Accordion"}
::

### Slots

All item slots receive `{ item: AccordionItem, index: number, open: boolean }`.

::component-slots{name="Accordion"}
::

## Built on `@vyui/core`

`VyAccordion` composes the headless `@vyui/core` accordion primitives. Use them directly when you need full control over markup and styling.

::component-code
---
name: accordion-anatomy
---
::

The primitive anatomy is:

```vue
<AccordionRoot>
  <AccordionItem value="...">
    <AccordionHeader>
      <AccordionTrigger />
    </AccordionHeader>
    <AccordionContent />
  </AccordionItem>
</AccordionRoot>
```

#### `AccordionRoot` props

::component-props{name="AccordionRoot"}
::

#### `AccordionItem` props

::component-props{name="AccordionItem"}
::

## Styling and theming

Override the component globally through `appConfig.ui.accordion` or locally with `ui`. The actual theme slots are:

| UI slot | Purpose |
| --- | --- |
| `root` | Accordion root container. |
| `item` | Item wrapper and divider. |
| `header` | Header layout around the trigger. |
| `trigger` | Interactive trigger row. |
| `content` | Collapsible panel wrapper. |
| `body` | Inner body layout. |
| `bodyText` | Static `item.content` text. |
| `leadingIcon` | Built-in leading icon. |
| `trailingIcon` | Toggle icon, including open-state rotation. |
| `label` | Trigger label text. |

The only theme variant is `disabled`, which dims the trigger and applies a disabled cursor style. The default theme uses vyui's semantic tokens, so it adapts automatically under dark mode (see [Theming → Dark Mode](/theming/dark-mode)), and uses a simple transition instead of named web accordion keyframes.

## Accessibility

The core trigger exposes native Lynx button semantics and announces `collapsed` or `expanded`. Disabled triggers are announced as disabled. Keep each `label` or custom default slot descriptive, and do not put unrelated interactive controls inside a trigger.

## Platform notes

- Built for Vue on Lynx; use native `accessibility-*` behavior rather than web-only `aria-*` assumptions.
- The trailing icon rotates through the `group-ui-open` state class.
- When CSS inheritance is disabled, static content color is applied directly to the nested `bodyText` element.

## Related components

- [`ActionSheet`](/components/action-sheet) for a temporary list of actions.
- `Collapsible` in `@vyui/core` for one headless disclosure region.
- `Tabs` for switching between persistent peer panels.
