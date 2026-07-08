// VyApp is the runtime root shell (see components/App.vue) — one slot, no
// variants. `bg-default` paints the base surface token so the background flips
// with the `.dark` ramp out of the box; `w-full h-full` fills the viewport.
// Override via `appConfig.ui.app`, the `ui.root` prop, or a conflicting
// `class` utility (tailwind-merge lets the consumer's class win).
export default {
  slots: {
    root: 'w-full h-full bg-default',
  },
}
