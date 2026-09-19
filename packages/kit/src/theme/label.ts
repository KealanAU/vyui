/**
 * `VyLabel` theme. nuxt/ui v3 has no standalone Label (it lives inside
 * FormField), so this is a minimal single-part design: a `base` slot with
 * `size` and `required` variants.
 */
export default {
  slots: {
    base: 'font-medium text-highlighted',
  },
  variants: {
    size: {
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
    },
    required: {
      // See formField.ts: an `after:` asterisk cannot paint on Lynx.
      true: '',
    },
  },
  defaultVariants: {
    size: 'md' as const,
    required: false as const,
  },
}
