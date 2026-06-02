/**
 * Accordion theme — adapted from nuxt/ui v3.0.2 `theme/accordion.ts` for
 * Vue-Lynx. Light-mode only; `focus-visible:*` / `dark:*` / `shadow-*` removed.
 *
 * Nuxt UI relies on bespoke `accordion-down` / `accordion-up` keyframes; we
 * fall back to a plain `transition-all` since Lynx's CSS engine doesn't ship
 * those named keyframes by default.
 */
export default {
  slots: {
    root: 'w-full',
    item: 'border-b border-neutral-200 last:border-b-0',
    header: 'flex flex-row',
    trigger:
      'group flex-1 flex flex-row items-center gap-1.5 font-medium text-sm py-3.5 min-w-0',
    content: 'overflow-hidden',
    // `body` is a wrapping <view>; `enableCSSInheritance: false` means its
    // `text-*` can't reach the nested content <text>, so the foreground color
    // moves onto `bodyText` (applied to the string-content <text> in
    // Accordion.vue). `body` keeps layout/sizing only.
    body: 'text-sm pb-3.5',
    bodyText: 'text-sm text-neutral-700',
    leadingIcon: 'shrink-0 size-5 text-neutral-500',
    trailingIcon:
      'shrink-0 size-5 ms-auto text-neutral-500 group-data-[state=open]:rotate-180 transition-transform duration-200',
    label: 'text-start break-words text-neutral-900',
  },
  variants: {
    disabled: {
      true: { trigger: 'cursor-not-allowed opacity-75' },
    },
  },
  defaultVariants: {},
}
