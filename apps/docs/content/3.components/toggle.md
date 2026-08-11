---
title: Toggle
description: Switch a button between pressed and unpressed states.
navigation:
  icon: i-lucide-toggle-right
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Toggle.vue
    target: _blank
---

## Overview

`VyToggle` is a two-state button for options such as bold text, favorites, or pinned tools. It wraps the core toggle primitive with semantic colors, four visual variants, responsive sizing, and optional Iconify content.

::component-code
---
name: toggle-example
height: 120px
---
::

## Usage

Bind the pressed state with `v-model`. Add an `accessibility-label` when the toggle contains only an icon.

::component-code
---
name: toggle-example
---
::

### Text content

The default slot replaces the built-in icon, so it can contain text or a custom composition.

::component-code
---
name: toggle-text
---
::

### Disabled

Set `disabled` to prevent taps and dim the control, in both the unpressed and pressed states.

::component-code
---
name: toggle-disabled
---
::

## Features and behavior

- Tapping an enabled toggle inverts `modelValue` and emits `update:modelValue`.
- The kit component defaults `modelValue` to `false`; use `v-model` to retain user changes in application state.
- `disabled` prevents taps, applies disabled semantics, and dims the control.
- The default slot takes precedence over `icon`.
- The root exposes `data-state="on"` or `data-state="off"` and matching `ui-on` or `ui-off` classes through the core primitive.
- Additional attributes, including native Lynx accessibility attributes, are inherited by the root toggle.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | Pressed state, normally bound with `v-model`. |
| `disabled` | `boolean` | `false` | Prevents interaction and applies disabled styling and semantics. |
| `color` | `Color` | `'primary'` | Semantic color used for the pressed appearance. |
| `variant` | `'solid' \| 'outline' \| 'soft' \| 'ghost'` | `'ghost'` | Pressed-state surface and foreground treatment. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Padding, text size, gap, and built-in icon size. |
| `icon` | `string` | `undefined` | Iconify name rendered when the default slot is empty. |
| `class` | `any` | `undefined` | Classes merged onto the root toggle. |
| `ui` | `Partial<Record<ToggleSlot, any>>` | `undefined` | Per-instance theme slot overrides. |

`Color` defaults to `primary`, `secondary`, `success`, `info`, `warning`, `error`, or `neutral`, and supports consumer registry extensions.

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `boolean` | Emitted with the inverted pressed state after an enabled tap. |

## Slots

| Slot | Props | Description |
| --- | --- | --- |
| `default` | `{ modelValue: boolean, state: 'on' \| 'off', pressed: boolean, disabled: boolean }` | Replaces the built-in icon; same prop contract as the core primitive. |

## Styling and theming

Override globally through `appConfig.ui.toggle` or locally with `ui`.

| UI slot | Purpose |
| --- | --- |
| `base` | Root layout, shape, typography, spacing, surface, and interaction states. |
| `icon` | Built-in icon size and foreground color. |

The theme combines `color`, `variant`, `size`, and the internal `pressed` state.

| Variant | Pressed appearance |
| --- | --- |
| `solid` | Semantic filled surface with a white icon. |
| `outline` | Semantic border and foreground with a light active surface. |
| `soft` | Light semantic surface and semantic foreground. |
| `ghost` | Transparent surface with semantic foreground and active feedback. |

The unpressed state uses a neutral icon and neutral active feedback regardless of `color`. The `size` variant changes root spacing and the `icon` slot from `size-5` through `size-7`.

## Accessibility

The core primitive exposes the root as a focusable native button and announces `pressed` or `not pressed`. Disabled toggles use the native disabled trait.

Provide `accessibility-label` for icon-only toggles. Text in the default slot gives sighted users context, but an explicit native label remains the safest choice when the control's purpose is not self-evident. The current accessibility layer targets Lynx native attributes; web ARIA bridging is not currently added by the primitive.

## Platform notes

- The component renders a Lynx `view` through the core primitive and responds to the Lynx `tap` event.
- Lynx SVG does not inherit `currentColor`, so the theme places foreground classes directly on the built-in icon slot.
- The default theme uses vyui's semantic surface/text/border tokens, so it adapts automatically under dark mode (see [Theming → Dark Mode](/theming/dark-mode)).

## Built on `@vyui/core`

`VyToggle` composes the headless `@vyui/core` toggle primitive. Use it directly when you need full control over markup and styling.

### `Toggle` props

::component-props{name="Toggle"}
::

## Related components

- [`Toggle Group`](/components/toggle-group) for a related set of single- or multiple-selection toggles.
- [`Switch`](/components/switch) for an immediately applied on/off setting.
- [`Button`](/components/button) for a one-time action without persistent pressed state.
