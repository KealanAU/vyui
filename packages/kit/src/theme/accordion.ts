/**
 * Accordion theme — adapted from nuxt/ui v3.0.2 `theme/accordion.ts` for
 * Vue-Lynx. Dark rides the semantic tokens; `focus-visible:*` / `shadow-*` are
 * removed.
 *
 * Nuxt UI's `accordion-down` / `accordion-up` keyframes animate to
 * `height: auto`, which CSS can't do and Lynx doesn't support, so a measured px
 * height is tweened instead: `CollapsibleContent` writes the natural height
 * inline and the `content` slot's `transition-[height]` interpolates it.
 */
export default {
  slots: {
    root: 'w-full',
    item: 'border-b border-default last:border-b-0',
    header: 'flex flex-row',
    trigger:
      'group flex-1 flex flex-row items-center gap-1.5 font-medium text-sm py-3.5 min-w-0',
    content: 'overflow-hidden transition-[height] ease-out',
    // `body` is a wrapping <view> and `enableCSSInheritance: false` means its
    // `text-*` can't reach the nested content <text>, so the foreground color
    // moves onto `bodyText`; `body` keeps layout/sizing only.
    body: 'text-sm pb-3.5',
    bodyText: 'text-sm text-default',
    leadingIcon: 'shrink-0 size-5 text-muted',
    trailingIcon:
      'shrink-0 size-5 ms-auto text-muted group-ui-open:rotate-180 transition-transform duration-200',
    label: 'text-start break-words text-highlighted',
  },
  variants: {
    disabled: {
      true: { trigger: 'cursor-not-allowed opacity-75' },
    },
  },
  defaultVariants: {},
}
