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

## Open questions / upstream

- **Why is `GlobalEventEmitter` `keyboardstatuschanged` not delivered to the
  vue-lynx background listener?** Confirm whether vue-lynx wires
  `lynx.getJSModule('GlobalEventEmitter')` to the same registry the native emit
  targets, or whether listeners must be registered through a different binding /
  thread. This is the root blocker for a global (input-agnostic) keyboard hook.
- **`KeyboardAware*` rework:** re-point `KeyboardAwareRoot` away from
  `useGlobalKeyboard` and onto the input's `keyboard` event relayed through
  `KeyboardAwareTrigger` (the Trigger already wraps the input and holds the root
  context). Consider switching the lift mechanism from the responder's
  `setNativeProps` transform to the flex-spacer model above.
- **Android:** verify the `keyboard` event payload field names and units.
