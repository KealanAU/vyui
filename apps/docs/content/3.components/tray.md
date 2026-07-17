---
title: Tray
description: A morphing multi-view bottom sheet that grows to fit each view.
navigation:
  icon: i-lucide-square-dashed-bottom
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/Tray.vue
    target: _blank
---

## Overview

`VyTray` is a bottom sheet that hosts several named **views** and animates its height to fit whichever one is showing — the panel *grows into place* as you navigate rather than jumping. A back stack (`goBack`, `canGoBack`) makes it a natural home for short, branching flows: a menu that drills into a detail, a confirm step, a quick form.

::component-code
---
name: tray-example
height: 420px
---
::

::callout{icon="i-lucide-box"}
Built on the `@vyui/core` [`Sheet`](/components/sheet) primitives in `fitContent` mode, so the panel hugs its content. Reach for [`Drawer`](/components/drawer) instead when you want a fixed-height, snap-point sheet, or [`ActionSheet`](/components/action-sheet) for a simple list of actions.
::

## Usage

Give each screen a `VyTrayView` with a unique `id`. Only the active view mounts, and the tray measures it and morphs its height to match. Navigate with the controls exposed on the default slot (or [`useTray`](#usetray)).

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit/button'
import { VyTray } from '@vyui/kit/tray'
import { VyTrayView } from '@vyui/kit/tray-view'

const open = ref(false)
</script>

<template>
  <VyTray v-model:open="open" default-view="menu">
    <template #trigger>
      <VyButton label="Open tray" />
    </template>

    <template #default="{ setView }">
      <VyTrayView id="menu">
        <VyButton label="Share" @tap="setView('share')" />
        <VyButton label="Delete" @tap="setView('confirm')" />
      </VyTrayView>

      <VyTrayView id="share">…a taller view; the tray grows…</VyTrayView>
      <VyTrayView id="confirm">…a short view; the tray shrinks…</VyTrayView>
    </template>
  </VyTray>
</template>
```

The `#trigger` slot renders in normal flow; tapping it opens the tray to `defaultView`.

### Navigation and the back stack

`setView(id)` pushes the current view onto a history stack; `goBack()` pops it. `canGoBack` reflects whether there is anywhere to return to, so a Back control can hide itself on the first view. The default and footer slots both receive `{ open, close, setView, goBack, visible, view, canGoBack }`.

```vue
<template #default="{ setView, goBack, canGoBack }">
  <VyTrayView id="confirm">
    <VyButton v-if="canGoBack" label="← Back" @tap="goBack()" />
    <text>Delete item?</text>
  </VyTrayView>
</template>
```

### Persistent footer

The `#footer` slot mounts outside the morphing region, so it stays put — it does not unmount or re-animate as views change. Ideal for a primary action or a Close button that should be present on every view.

```vue
<template #footer="{ close }">
  <VyButton label="Close" block @tap="close()" />
</template>
```

### Floating and flush variants

`variant` sets the panel chrome. `floating` (the default) is a detached card that hovers with a gap and a border on all sides — the tray's signature look. `flush` anchors it to the screen edges with a rounded top only, matching a classic `Drawer` silhouette.

```vue
<VyTray v-model:open="open" variant="floating">…</VyTray>
<VyTray v-model:open="open" variant="flush">…</VyTray>
```

### useTray

Any component rendered inside the tray can drive it imperatively with `useTray()` — handy for custom triggers or deep view bodies that shouldn't thread callbacks through props.

```vue
<script setup lang="ts">
import { useTray } from '@vyui/kit/tray'

const tray = useTray()
// tray.setView('confirm'); tray.goBack(); tray.close()
</script>
```

### Keyboard awareness

Set `keyboard-aware` and the whole panel rises above the on-screen keyboard when an input inside it gains focus (Lynx; no-op on web). Because the panel is bottom-anchored and hugs its content, the tray grows its bottom padding by the keyboard height — handle, body, and footer all clear the keyboard while the panel background fills in behind it. Any `VyInput` or `VyTextarea` in the body **or** footer registers itself automatically; no per-input wrapping.

```vue
<VyTray v-model:open="open" keyboard-aware="lift">
  <VyInput v-model="reply" placeholder="Type a reply…" />
  <template #footer="{ close }">
    <VyButton label="Send" block @tap="close()" />
  </template>
</VyTray>
```

Two modes:

- `keyboard-aware="lift"` — rise only. Right for short and medium trays whose content fits above the keyboard.
- `keyboard-aware` / `keyboard-aware="scroll"` — rise, plus the body becomes a keyboard-aware scroll region that keeps the focused input in view. Right for tall content like a multi-field form.

::callout{icon="i-lucide-ruler"}
The scroll region only scrolls once its height is bounded — cap it through the `bodyScroll` ui slot (e.g. `:ui="{ bodyScroll: 'max-h-80' }"`). Left unbounded, the tray hugs its content and there is nothing to scroll.
::

```vue
<VyTray v-model:open="open" keyboard-aware :ui="{ bodyScroll: 'max-h-80' }">
  <VyInput v-model="form.name" placeholder="Name" />
  <VyTextarea v-model="form.bio" placeholder="Bio" />
  <VyInput v-model="form.website" placeholder="Website" />
  <template #footer>
    <VyInput v-model="form.note" placeholder="Footer note" />
  </template>
</VyTray>
```

## Features and behavior

- The panel height morphs between views via CSS `transition: height`; measured per view, so content of any height is supported.
- `open` and `view` are controllable through `v-model:open` / `v-model:view` and default through `default-open` / `default-view`.
- Only the active `VyTrayView` mounts — inactive views (and their state) unmount.
- Closing resets navigation to `defaultView` and clears the back stack, so a reopen starts clean.
- Drag-to-close, the slide-in/out, and the backdrop are inherited from the core `Sheet` engine; set `dismissible` to `false` to keep it open until dismissed in code.

## Props

::component-props{name="Tray"}
::

### VyTrayView

::component-props{name="TrayView"}
::

## Emits

::component-emits{name="Tray"}
::

## Slots

::component-slots{name="Tray"}
::

## Styling and theming

Override globally through `appConfig.ui.tray` or locally with the `ui` prop.

| UI slot | Purpose |
| --- | --- |
| `overlay` | The dim backdrop behind the panel. |
| `content` | The sheet panel. Carries the `variant` chrome (inset/border/radius). |
| `handle` | The drag pill at the top of the panel. |
| `morph` | The height-animated container. Its `transition-duration` comes from the `duration` prop. |
| `viewport` | Inner wrapper measured to drive the morph. |
| `body` | Padding around the active view. |
| `bodyScroll` | The keyboard-aware `<scroll-view>` around the body (rendered when `keyboardAware` is `'scroll'`/`true`). Cap its height here. |
| `footer` | The persistent footer region. |

## Accessibility

The panel announces as a dialog and traps focus, inherited from the core `SheetContent`. Give icon-only navigation controls an `accessibility-label`, and make sure a Back control is reachable when `canGoBack` is true. Because views mount and unmount as you navigate, test the morphing flow with VoiceOver and TalkBack to confirm focus lands sensibly on each view.

## Platform notes

- The height morph relies on animating between concrete pixel heights; Lynx animates `height` via CSS `transition` (not via main-thread style writes), which is what `VyTray` uses under the hood.
- The keyboard rise is driven by the focused input's per-element `keyboard` event — the reliable keyboard signal under vue-lynx (see [`KeyboardAware`](/components/keyboard-aware)). It is applied as panel padding rather than a transform so it cannot fight the sheet's main-thread drag physics.
- `floating` positions the panel with inset utilities that override the core edge-anchored sheet rules; on Lynx the later-injected utilities win.
- Open/close motion and drag physics come from the core `Sheet` primitives — see [`Sheet`](/components/sheet) for the underlying behavior.

## Related components

- [`Drawer`](/components/drawer) for a fixed-height, snap-point bottom sheet.
- [`Action Sheet`](/components/action-sheet) for a simple list of actions.
- [`Modal`](/components/modal) for a centered blocking dialog.
- [`Island`](/components/island) for a floating pill that morphs and expands in place.
