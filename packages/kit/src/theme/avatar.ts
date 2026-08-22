// Ported from nuxt/ui v4 `src/theme/avatar.ts` — see `./button.ts` for the
// shared Lynx adaptations.
import type { Color } from './colors'

const colorVariant = (c: string) => ({
  root: `bg-${c}-100`,
  text: `text-${c}-600`,
  icon: `text-${c}-600`,
})

export default (colors: Color[]) => ({
  slots: {
    root: 'flex flex-row items-center justify-center shrink-0 select-none rounded-full align-middle overflow-hidden',
    image: 'h-full w-full rounded-[inherit] object-cover',
    text: 'font-medium truncate',
    icon: 'shrink-0',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, colorVariant(c)])) as Record<Color, ReturnType<typeof colorVariant>>,
    size: {
      'xs': { root: 'size-8 text-base' },
      'sm': { root: 'size-9 text-lg' },
      'md': { root: 'size-10 text-xl' },
      'lg': { root: 'size-11 text-[22px]' },
      'xl': { root: 'size-12 text-2xl' },
      '2xl': { root: 'size-14 text-3xl' },
      '3xl': { root: 'size-16 text-4xl' },
    },
  },
  defaultVariants: {
    size: 'md' as const,
    color: 'neutral' as const,
  },
})
