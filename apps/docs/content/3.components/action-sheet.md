---
title: Action Sheet
description: Present a mobile bottom sheet containing grouped actions.
navigation:
  icon: i-lucide-panel-bottom
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/ActionSheet.vue
    target: _blank
---

## Overview

`VyActionSheet` presents actions in a bottom-anchored sheet. It supports drag-to-dismiss, an optional backdrop and handle, grouped items, semantic row colors, avatars, custom item slots, and controlled or uncontrolled open state.

::component-code
---
name: action-sheet-example
height: 520px
---
::

::callout{icon="i-lucide-box"}
Built on the headless [`Sheet`](/components/sheet) primitive from `@vyui/core`. Drop down to it when you need full control over the snap behavior and markup.
::

## Usage

::component-code
---
name: action-sheet-example
height: 520px
---
::

The default slot is wrapped in the core `SheetTrigger`; tapping it opens the sheet. Do not also set the open state from a tap handler on the slotted child.

### Grouped actions

Pass nested arrays to insert separators between groups.

::component-code
---
name: action-sheet-grouped
height: 520px
---
::

### Custom rows

The item slots receive the flattened item index. Leading and trailing slots also receive the resolved icon color.

```vue
<VyActionSheet :items="items">
  <VyButton>Choose a person</VyButton>

  <template #item-label="{ item }">
    <view class="flex-1">
      <text class="font-medium">{{ item.label }}</text>
      <text class="text-sm text-neutral-500">{{ item.email }}</text>
    </view>
  </template>

  <template #item-trailing="{ iconColor }">
    <VyIcon name="i-lucide-chevron-right" :color="iconColor" />
  </template>
</VyActionSheet>
```

## Features and behavior

- Bind `v-model:open` to `open`, or use the `v-model` alias backed by `modelValue`.
- Both `update:open` and `update:modelValue` are emitted on every open-state change.
- Flat `items` render as one list. Nested arrays render as groups separated by themed dividers.
- Selecting an enabled row calls its `onSelect`, emits `select`, then closes by default.
- Disabled rows are dimmed and do not call handlers or emit `select`.
- `dismissible` controls both backdrop dismissal and drag-to-close.
- `cancel` can be `true` for the label `Cancel`, a custom string, or `false` to hide the row.

### Action sheet item

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Row label. |
| `icon` | `string` | — | Leading Iconify icon name. |
| `avatar` | `AvatarProps` | — | Leading `VyAvatar`; takes the built-in position instead of `icon`. |
| `trailingIcon` | `string` | — | Trailing Iconify icon name. |
| `color` | `Color` | Neutral styling | Semantic row color. |
| `disabled` | `boolean` | `false` | Prevents selection. |
| `value` | `any` | — | Optional application value available on the emitted item. |
| `onSelect` | `(item: ActionSheetItem) => void` | — | Called before auto-close and the sheet-level `select` event completes. |
| `[key: string]` | `any` | — | Additional application data forwarded in slot props. |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `undefined` | Controlled open state used by `v-model:open`; takes precedence over `modelValue`. |
| `modelValue` | `boolean` | `undefined` | Convenience controlled state used by `v-model`. |
| `defaultOpen` | `boolean` | `false` | Initial state when uncontrolled. |
| `items` | `ActionSheetItem[] \| ActionSheetItem[][]` | `undefined` | Flat or grouped actions. |
| `title` | `string` | `undefined` | Uppercase section heading. |
| `description` | `string` | `undefined` | Supporting text below the title. |
| `overlay` | `boolean` | `true` | Renders the dimmed backdrop. |
| `dismissible` | `boolean` | `true` | Enables backdrop and drag dismissal. |
| `closeOnSelect` | `boolean` | `true` | Closes after an enabled item is selected. |
| `handle` | `boolean` | `true` | Shows the drag handle. |
| `cancel` | `boolean \| string` | `false` | Shows the cancel row and optionally customizes its label. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Row, label, and icon scale. |
| `class` | `any` | `undefined` | Classes merged onto the sheet content. |
| `ui` | `Partial<Record<ActionSheetSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and can be extended through the kit color registry.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `boolean` | Open-state update for `v-model:open`. |
| `update:modelValue` | `boolean` | Open-state update for `v-model`. |
| `select` | `ActionSheetItem` | An enabled item was selected. |
| `cancel` | none | The cancel row was tapped, before the sheet closes. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ open: boolean }` | Trigger content. |
| `header` | — | Replaces the title and description block. |
| `item-leading` | `{ item, index, iconColor }` | Replaces an item's icon or avatar. |
| `item-label` | `{ item, index }` | Replaces an item's label. |
| `item-trailing` | `{ item, index, iconColor }` | Replaces an item's trailing icon. |

## Styling and theming

Override globally through `appConfig.ui.actionSheet` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `overlay` | Full-screen backdrop. |
| `content` | Bottom sheet panel and maximum height. |
| `handle` | Drag indicator. |
| `header` | Heading and description wrapper. |
| `title` | Header title. |
| `description` | Header supporting text. |
| `list` | Scrollable action list. |
| `item` | Interactive action row. |
| `itemLeadingIcon` | Built-in leading icon. |
| `itemLeadingAvatar` | Built-in avatar wrapper. |
| `itemLabel` | Built-in label text. |
| `itemTrailingIcon` | Built-in trailing icon. |
| `separator` | Divider between item groups. |
| `cancel` | Cancel row container. |
| `cancelLabel` | Cancel row text. |

Variants are `size`, per-item `color`, and per-item `disabled`. Semantic colors tint the label, leading icon, and pressed background.

## Accessibility

The trigger exposes native button semantics and announces collapsed or expanded state. Give icon-only trigger content an `accessibility-label`. Ensure custom item slots retain a clear visible label, and avoid relying on color alone to identify destructive actions.

The current action rows and cancel row are tappable Lynx `view` elements without an explicit native button role. Treat this as a current accessibility limitation when choosing the component for critical actions and test the resulting experience with VoiceOver and TalkBack.

## Platform notes

- The sheet uses `@vyui/core` native Sheet primitives for presence, bottom anchoring, drag, snap, fling, and backdrop synchronization.
- Lynx SVG does not inherit `currentColor`, so built-in and custom icon slots receive resolved hex colors.
- The content list is vertically scrollable and capped at the dynamic viewport height.

## Related components

- [`Alert`](/components/alert) for persistent status messaging.
- `DropdownMenu` for an anchored action menu.
- `Modal` or `Drawer` for richer interactive content.
