/**
 * `VyLabel` theme. nuxt/ui v3 has no standalone Label (it lives inside
 * FormField), so this is a minimal single-part design: a `base` slot with
 * `size` and `required` variants. When `required` is true we append a red
 * asterisk via the `after:` pseudo-element, matching the convention used by
 * nuxt/ui's FormField label.
 */
export default {
  slots: {
    base: 'font-medium text-neutral-900 select-none',
  },
  variants: {
    size: {
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
    },
    required: {
      true: "after:content-['*'] after:ms-0.5 after:text-red-500",
    },
  },
  defaultVariants: {
    size: 'md' as const,
    required: false as const,
  },
}
