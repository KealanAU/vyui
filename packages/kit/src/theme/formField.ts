/**
 * FormField theme — adapted from nuxt/ui v3.0.2 `theme/form-field.ts` for
 * Vue-Lynx. Provides the label / description / hint / help / error scaffold
 * around a field control (Input / Switch / RadioGroup / etc.).
 * Light-mode only; `dark:*`, `focus:*`, `focus-visible:*` classes dropped.
 */
export default {
  slots: {
    root: 'flex flex-col',
    wrapper: 'flex flex-col',
    labelWrapper: 'flex flex-row items-center justify-between',
    label: 'font-medium text-neutral-900',
    container: 'mt-1',
    description: 'text-neutral-500',
    error: 'mt-2 text-error-500',
    hint: 'text-neutral-500',
    help: 'mt-2 text-neutral-500',
  },
  variants: {
    size: {
      sm: {
        label: 'text-sm',
        description: 'text-sm',
        error: 'text-sm',
        hint: 'text-sm',
        help: 'text-sm',
      },
      md: {
        label: 'text-sm',
        description: 'text-sm',
        error: 'text-sm',
        hint: 'text-sm',
        help: 'text-sm',
      },
      lg: {
        label: 'text-base',
        description: 'text-base',
        error: 'text-base',
        hint: 'text-base',
        help: 'text-base',
      },
      xl: {
        label: 'text-lg',
        description: 'text-lg',
        error: 'text-lg',
        hint: 'text-lg',
        help: 'text-lg',
      },
    },
    required: {
      true: {
        label: "after:content-['*'] after:ms-0.5 after:text-error-500",
      },
    },
  },
  defaultVariants: {
    size: 'md' as const,
  },
}
