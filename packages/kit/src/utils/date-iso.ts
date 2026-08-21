// ISO-string calendar math for `VyCalendar`. Deliberately host-`Date`-free
// (Sakamoto weekday, hand-rolled month arithmetic) because Lynx-native `Date`,
// timezone and locale-formatting behavior is still unverified. The
// DateValue-based `@vyui/core/date` module targets the future headless
// primitives; this is what the shipped component runs on today.

export interface Month {
  year: number
  month: number
}

/** A single day cell of a month grid, before component-state decoration. */
export interface IsoDayCell {
  iso: string
  day: number
  month: number
  year: number
  /** False for the leading/trailing days that belong to the adjacent month. */
  inMonth: boolean
}

export interface MonthGridOptions {
  /** Start weeks on Sunday (`0`) through Saturday (`6`). */
  weekStartsOn: number
  /** Always render six weeks (42 cells) so height stays stable across months. */
  fixedWeeks: boolean
}

export function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

/** Parses `YYYY-MM…`, clamping month to 1–12 and falling back to 2026-01. */
export function parseMonth(value: string): Month {
  const match = /^(\d{4})-(\d{2})/.exec(value)
  const year = match ? Number(match[1]) : 2026
  const month = match ? Number(match[2]) : 1
  return {
    year: Number.isFinite(year) ? year : 2026,
    month: Number.isFinite(month) ? Math.min(12, Math.max(1, month)) : 1,
  }
}

/** Canonicalizes any parseable date/month string to `YYYY-MM`. */
export function normalizeMonth(value: string): string {
  const { year, month } = parseMonth(value)
  return `${year}-${pad(month)}`
}

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** Sakamoto algorithm — weekday 0-6 (Sun-Sat) without constructing a `Date`. */
export function dayOfWeek(year: number, month: number, day: number): number {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const adjustedYear = month < 3 ? year - 1 : year
  return (adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400) + offsets[month - 1] + day) % 7
}

/** Adds `delta` months, rolling year boundaries. Returns a 1-based month. */
export function addMonths(year: number, month: number, delta: number): Month {
  const total = year * 12 + (month - 1) + delta
  return {
    year: Math.floor(total / 12),
    month: total % 12 + 1,
  }
}

function cell(year: number, month: number, day: number, inMonth: boolean): IsoDayCell {
  return { iso: toIso(year, month, day), day, month, year, inMonth }
}

/**
 * Builds the visible month grid as rows of 7 cells, padded with the adjacent
 * months' days. Structural only — `selected` / `today` / `disabled` decoration
 * is the component's job.
 */
export function buildMonthGrid(year: number, month: number, { weekStartsOn, fixedWeeks }: MonthGridOptions): IsoDayCell[][] {
  const cells: IsoDayCell[] = []
  const currentDays = daysInMonth(year, month)
  const firstWeekday = dayOfWeek(year, month, 1)
  const leadingCount = (firstWeekday - weekStartsOn + 7) % 7
  const previous = addMonths(year, month, -1)
  const previousDays = daysInMonth(previous.year, previous.month)

  for (let i = leadingCount; i > 0; i--)
    cells.push(cell(previous.year, previous.month, previousDays - i + 1, false))

  for (let day = 1; day <= currentDays; day++)
    cells.push(cell(year, month, day, true))

  const targetLength = fixedWeeks ? 42 : Math.ceil(cells.length / 7) * 7
  const next = addMonths(year, month, 1)
  for (let day = 1; cells.length < targetLength; day++)
    cells.push(cell(next.year, next.month, day, false))

  const rows: IsoDayCell[][] = []
  for (let i = 0; i < cells.length; i += 7)
    rows.push(cells.slice(i, i + 7))
  return rows
}
