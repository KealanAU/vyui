import type { Color } from './colors'

export default (colors: Color[]) => ({
  slots: {
    root: 'w-full max-w-[336px] flex flex-col gap-3',
    header: 'flex flex-row items-center justify-between gap-2',
    title: 'text-base font-semibold text-highlighted',
    nav: 'flex flex-row items-center gap-1',
    navButton: 'size-9 rounded-md flex items-center justify-center active:bg-elevated disabled:opacity-50',
    navIcon: 'size-5 text-muted',
    weekdays: 'flex flex-row',
    weekday: 'w-[14.285714%] text-center text-xs font-medium text-muted',
    weeks: 'flex flex-col gap-1',
    week: 'flex flex-row gap-1',
    day: 'flex-1 aspect-square rounded-md flex items-center justify-center active:bg-elevated disabled:opacity-40',
    dayText: 'text-sm text-highlighted',
    outsideDayText: 'text-dimmed',
    todayText: 'font-semibold',
    selectedDay: '',
    selectedDayText: 'text-white font-semibold',
    caveat: '',
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, ''])) as Record<Color, ''>,
    size: {
      sm: {
        root: 'max-w-[292px]',
        title: 'text-sm',
        navButton: 'size-8',
        navIcon: 'size-4',
        weekday: 'text-xs',
        dayText: 'text-xs',
      },
      md: {},
      lg: {
        root: 'max-w-[380px]',
        title: 'text-lg',
        navButton: 'size-10',
        navIcon: 'size-5',
        weekday: 'text-sm',
        dayText: 'text-base',
      },
    },
  },
  compoundVariants: [
    ...colors.map(color => ({
      color,
      class: {
        selectedDay: `bg-${color}-500 active:bg-${color}-600`,
      },
    })),
  ],
  defaultVariants: {
    color: 'primary' as const,
    size: 'md' as const,
  },
})
