# Keyboard awareness under vue-lynx

How to react to the on-screen keyboard (e.g. lift a docked composer above it) in
a vue-lynx app. The short version: **listen to the `<input>`/`<textarea>`
element's own `keyboard` event, not the global `keyboardstatuschanged`.**

## The trap: `GlobalEventEmitter` is not delivered

The documented Lynx pattern (used by `lynx-ui`'s `KeyboardAwareRoot` and ported
into vyui's `KeyboardAware*` family via `useGlobalKeyboard`) subscribes to a
global event:

```ts
lynx.getJSModule('GlobalEventEmitter')
  .addListener('keyboardstatuschanged', (status, height) => { … })
```

On the iOS simulator the native side **does** emit this — the unified log shows:

```
[I:LynxKeyboardEventDispatcher.m] keyboard status is on / keyboard height is 336
call jsmodule:GlobalEventEmitter.emit.keyboardstatuschanged 0x…   ← the vue bg context
```

…but the listener registered from a vue-lynx component (`onMounted`) **never
fires**. The emit reaches the right background JS context, yet the vue-lynx-side
`GlobalEventEmitter` listener does not receive it. So vyui's `KeyboardAware*`
components are effectively inert on device under vue-lynx. (Upstream item — see
"Open questions" below.)

## What works: the element `keyboard` event

Lynx also dispatches keyboard show/hide **directly to the focused input
element**. Element events do reach the vue-lynx runtime (the input's
`focus`/`input`/`selection` events fire normally). The raw payload is:

```
{ show: 0 | 1, keyBoardHeight: number, safeAreaBottom: number }
```

Note the capital **B** in `keyBoardHeight`. Verified on the iOS simulator
(force the software keyboard with **Cmd+K**); Android field names may differ.

`@vyui/core`'s `Input`/`Textarea` (and `@vyui/kit`'s `VyInput`/`VyTextarea`)
surface this as a normalized **`keyboard`** event:

```ts
'keyboard': [info: { visible: boolean, height: number, safeAreaBottom: number }]
```

```vue
<VyInput @keyboard="onKb" />
<script setup>
function onKb({ visible, height }) {
  kbHeight.value = visible ? height : 0
}
</script>
```

## Applying the lift: flex spacer, not fixed-transform

Reactive `transform` / `bottom` on a `position: fixed` element did **not**
visibly repaint on the Lynx runtime in testing. The reliable approach is plain
reactive layout:

- Put the page in a `flex flex-col`; the scroll area is `flex-1 min-h-0`.
- The composer sits in normal flow at the bottom.
- Render a spacer **below** it whose height tracks the keyboard:
  `<view :style="{ height: kbHeight + 'px' }" />`.

Lynx overlays the keyboard (the page does not resize — layout stays full
height), so growing the spacer pushes the composer up by exactly the keyboard
height. Reset to `0` on `blur`.

Reference implementation: `apps/examples/vyai/src/sections/Composer.vue`.

## The lift math: viewport height, not screen height

The lynx-ui `KeyboardAwareRoot` computes the input's distance to the keyboard
as `SystemInfo.pixelHeight / pixelRatio - rect.bottom` — i.e. against the
**screen**. But `boundingClientRect` is relative to the **LynxView viewport**.
Under containers whose view doesn't fill the screen (Lynx Explorer's header),
the margin is inflated by the chrome above the view and the lift comes up
short by exactly that much (~50-100px — "the input is half hidden behind the
keyboard"). vyui's port measures the real viewport via
`lynx.createSelectorQuery().selectRoot()` and computes the margin against
that, falling back to the upstream screen math when the root query is
unavailable.

Three more shortfall sources fixed alongside (all deliberate divergences from
the React port):

- **`offset` sign.** Upstream ADDS the offset to the translate, which
  *reduces* the lift — a positive offset pushes the field INTO the keyboard.
  Both vyui props document offset as extra clearance, so vyui subtracts it
  (and adds it to the scroll target in scroll mode).
- **Trigger registration clobber.** Inputs reported focus to their wrapping
  `KeyboardAwareTrigger` AND self-registered with the root; the
  self-registration landed last, so the root measured the bare `<input>` and
  dropped the trigger's offset. A trigger now owns the registration when
  present.
- **Bare-input measurement in kit.** `VyInput` / `VyTextarea` render the
  visual field (border + padding) as a wrapper around the bare core input, so
  lifts cleared the inner input but left the field's bottom chrome behind the
  keyboard. Kit fields now wrap themselves in an as-child
  `KeyboardAwareTrigger`; nested triggers defer to the outermost one so a
  consumer's own trigger still wins, and a trigger without an explicit
  `offset` inherits the root's.

## Open questions / upstream

- **`GlobalEventEmitter` `keyboardstatuschanged` delivery is fixed upstream**
  in vue-lynx PR #193 ("route LEPUS global events to GlobalEventEmitter",
  ships after 0.4.2, plus a `useGlobalEvent` composable). vyui is pinned to
  0.4.2 (0.5.x Draggable regression), so the element `keyboard` event remains
  the primary signal; `useGlobalKeyboard` starts working on the day the pin
  moves past that release.
- **`KeyboardAware*` rework:** DONE — the root's primary signal is the input's
  `keyboard` event relayed through the trigger context;
  `useGlobalKeyboard` is retained as a harmless fallback.
- **Android:** verify the `keyboard` event payload field names and units.
