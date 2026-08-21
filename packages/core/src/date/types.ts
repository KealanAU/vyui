/*
  * Implementation ported from https://github.com/melt-ui/melt-ui/blob/develop/src/lib/internal/helpers/date/types.ts
*/

import type { DateValue } from '@internationalized/date'

export type { DateValue }

export type Matcher = (date: DateValue) => boolean

export type DateRange = {
  start: DateValue | undefined
  end: DateValue | undefined
}

export type Grid<T> = {
  /**
   * A `DateValue` representing the month — the source of truth for what the
   * grid depicts, since days from adjacent months may be included.
   */
  value: DateValue

  /** An array of arrays representing the weeks in the calendar: one sub-array
   *  per week, each holding that week's dates. Useful for table-style grids. */
  rows: T[][]

  /** Every date in the grid, including the adjacent-month fill days, as a flat
   *  array for custom rendering. */
  cells: T[]
}
