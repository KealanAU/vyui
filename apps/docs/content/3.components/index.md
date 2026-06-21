---
title: Components
description: Detailed guides and interactive examples for every public component in @vyui/kit.
navigation:
  icon: i-lucide-layout-grid
---

Vy UI components are designed for Vue-Lynx applications targeting iOS, Android, and web. Each guide documents the public API, interaction behavior, styling hooks, accessibility considerations, and platform-specific details.

::callout{icon="i-lucide-flask-conical" color="warning"}
Vy UI is pre-alpha. The playgrounds below are browser previews of the documented interaction and visual states. The accompanying source is the real Vue-Lynx API to use in your application.
::

## Choose a layer

- **`@vyui/kit`** provides styled `Vy*` components with semantic colors, variants, sizes, and `ui` slot overrides.
- **`@vyui/core`** provides the lower-level behavioral primitives used by the kit.

The reference focuses on the public `@vyui/kit` surface. When a kit export directly exposes a core primitive, the guide calls that out.

## Browse from Z to A

The component reference is intentionally arranged in reverse alphabetical order while the library is being documented:

`ToggleGroup` · `Toggle` · `Toast` · `Textarea` · `Tabs` · `Switch` · `Swiper` · `SwipeAction` · `Stepper` · `Sortable` · `Slider` · `Skeleton` · `Separator` · `Select` · `Rating` · `RadioGroup` · `Progress` · `Popover` · `Placeholder` · `PinInput` · `NumberField` · `Modal` · `Label` · `KeyboardAware` · `IslandGroup` · `IslandButton` · `Island` · `Input` · `Icon` · `FormField` · `Form` · `FeedList` · `DropdownMenu` · `Drawer` · `Combobox` · `Chip` · `Checkbox` · `Card` · `Button` · `Badge` · `AvatarGroup` · `Avatar` · `AspectRatio` · `Alert` · `ActionSheet` · `Accordion`

## Playground model

Each component page includes:

1. An interactive browser preview for quickly exploring the component.
2. Copyable Vue-Lynx source using the actual package API.
3. Complete props, emits, slots, variants, and `ui` styling hooks.
4. Accessibility and native-platform notes.

