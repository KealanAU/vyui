---
title: Alert
description: Highlight important status, guidance, or feedback.
navigation:
  icon: i-lucide-triangle-alert
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Alert.vue
    target: _blank
---

## Overview

`VyAlert` displays a title, description, leading icon, actions, and an optional close control. Semantic color and visual variants make it suitable for informational, success, warning, and error messages.

::component-code
---
name: alert-example
height: 220px
---
::

## Usage

::component-code
---
name: alert-example
height: 220px
---
::

### Actions and dismissal

`orientation="vertical"` places actions below the copy. Horizontal orientation places them at the trailing edge.

::component-code
---
name: alert-closable
height: 220px
---
::

The alert does not manage or hide itself. When the close control is tapped it emits `update:open(false)`; the parent decides whether to remove it.

### Variants

Combine semantic colors with `solid`, `soft`, `outline`, `subtle`, or `ghost`.

::component-code
---
name: alert-variants
height: 520px
---
::

## Features and behavior

- Slot content takes precedence over `title` and `description` props.
- The close icon resolves from `closeIcon`, then `appConfig.ui.icons.close`, then `i-lucide-x`.
- In vertical orientation, actions render below the title and description.
- In horizontal orientation, actions and the close control share the trailing actions region.
- The description receives additional top spacing only when a title prop or title slot is present.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `undefined` | Title text, replaced by the `title` slot. |
| `description` | `string` | `undefined` | Supporting text, replaced by the `description` slot. |
| `icon` | `string` | `undefined` | Leading Iconify icon name. |
| `color` | `Color` | `'primary'` | Semantic color. |
| `variant` | `'solid' \| 'outline' \| 'subtle' \| 'soft' \| 'ghost'` | `'solid'` | Surface and foreground treatment. |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | Position of actions relative to content. |
| `close` | `boolean` | `false` | Shows the built-in close control. |
| `closeIcon` | `string` | App icon / `i-lucide-x` | Iconify name for the close control. |
| `class` | `any` | `undefined` | Classes merged onto the root. |
| `ui` | `Partial<Record<AlertSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `false` | Emitted when the built-in close control is tapped. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `leading` | `{ iconColor: string }` | Replaces the leading icon. |
| `title` | — | Replaces title text. |
| `description` | — | Replaces description text. |
| `actions` | — | Action controls, positioned by `orientation`. |
| `close` | `{ iconColor: string }` | Replaces the close region. |

## Styling and theming

Override globally through `appConfig.ui.alert` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `root` | Alert surface and orientation layout. |
| `wrapper` | Title and description column. |
| `title` | Title text. |
| `description` | Supporting text. |
| `icon` | Leading and built-in close icons. |
| `actions` | Actions and close-control region. |
| `close` | Built-in close hit area. |

The theme combines `color`, `variant`, `orientation`, and an internal `title` state. `solid` uses a filled semantic surface with white foreground; `outline`, `subtle`, `soft`, and `ghost` progressively reduce surface emphasis.

## Accessibility

Use a concise title and put additional detail in the description. Alerts are visually prominent but the wrapper does not currently add an assertive live-region announcement, so critical time-sensitive messaging may need application-level announcement handling.

The built-in close region is currently a tappable Lynx `view` without an explicit button role or accessibility label. For an accessible dismiss action, replace the `close` slot with a labeled control in your application.

## Platform notes

- The component renders Lynx `view` and `text` elements.
- SVG glyphs cannot inherit `currentColor` in Lynx, so `iconColor` is resolved to an explicit hex value and passed to built-in icons and custom icon slots.
- The default theme uses vyui's semantic surface/text/border tokens, so it adapts automatically under dark mode (see [Theming → Dark Mode](/theming/dark-mode)).

## Related components

- [`Drawer`](/components/drawer) for choosing an action from an edge sheet.
- `Toast` for transient feedback.
- `Banner` for page-wide announcements.
