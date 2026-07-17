import { describe, expect, it } from 'vitest'
import { addMonths, buildMonthGrid, dayOfWeek, daysInMonth, isLeapYear, normalizeMonth, parseMonth } from './date-iso'

describe('parseMonth / normalizeMonth', () => {
  it('parses YYYY-MM(-DD) and ignores the day', () => {
    expect(parseMonth('2026-07-05')).toEqual({ year: 2026, month: 7 })
    expect(parseMonth('2026-07')).toEqual({ year: 2026, month: 7 })
  })
  it('clamps month and falls back on garbage', () => {
    expect(parseMonth('2026-13')).toEqual({ year: 2026, month: 12 })
    expect(parseMonth('nope')).toEqual({ year: 2026, month: 1 })
  })
  it('canonicalizes to YYYY-MM', () => {
    expect(normalizeMonth('2026-7-5')).toBe('2026-01') // no zero-pad ⇒ regex miss ⇒ fallback
    expect(normalizeMonth('2026-07-05')).toBe('2026-07')
  })
})

describe('isLeapYear / daysInMonth', () => {
  it.each([[2024, true], [2023, false], [2000, true], [1900, false]] as const)('leap %i → %s', (y, leap) => {
    expect(isLeapYear(y)).toBe(leap)
  })
  it('February tracks leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2023, 2)).toBe(28)
    expect(daysInMonth(2026, 4)).toBe(30)
    expect(daysInMonth(2026, 1)).toBe(31)
  })
})

describe('dayOfWeek (Sakamoto)', () => {
  it.each([
    [2026, 7, 5, 0], // Sun
    [2026, 7, 1, 3], // Wed
    [2000, 1, 1, 6], // Sat
  ] as const)('%i-%i-%i → %i', (y, m, d, wd) => {
    expect(dayOfWeek(y, m, d)).toBe(wd)
  })
})

describe('addMonths rolls year boundaries', () => {
  it('crosses Dec/Jan and full years', () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 })
    expect(addMonths(2026, 6, 12)).toEqual({ year: 2027, month: 6 })
  })
})

describe('buildMonthGrid', () => {
  const opts = { weekStartsOn: 0, fixedWeeks: true }

  it('fixed weeks ⇒ 6 rows of 7 = 42 cells', () => {
    const grid = buildMonthGrid(2026, 7, opts)
    expect(grid).toHaveLength(6)
    expect(grid.every(row => row.length === 7)).toBe(true)
    expect(grid.flat()).toHaveLength(42)
  })

  it('non-fixed weeks ⇒ whole weeks only', () => {
    const grid = buildMonthGrid(2026, 7, { weekStartsOn: 0, fixedWeeks: false })
    expect(grid.flat().length % 7).toBe(0)
    expect(grid.length).toBeLessThanOrEqual(6)
  })

  it('marks in-month vs adjacent days and covers the whole month', () => {
    const grid = buildMonthGrid(2026, 7, opts).flat()
    const inMonth = grid.filter(c => c.inMonth)
    expect(inMonth).toHaveLength(31)
    expect(inMonth[0].iso).toBe('2026-07-01')
    expect(inMonth[30].iso).toBe('2026-07-31')
  })

  it('weekStartsOn shifts the leading pad', () => {
    // July 2026 starts Wed. Sunday-start ⇒ 3 leading days; Monday-start ⇒ 2.
    const sun = buildMonthGrid(2026, 7, { weekStartsOn: 0, fixedWeeks: true }).flat()
    const mon = buildMonthGrid(2026, 7, { weekStartsOn: 1, fixedWeeks: true }).flat()
    expect(sun.findIndex(c => c.inMonth)).toBe(3)
    expect(mon.findIndex(c => c.inMonth)).toBe(2)
  })

  it('rolls the trailing pad into the next year for December', () => {
    const grid = buildMonthGrid(2026, 12, opts).flat()
    const trailing = grid.filter(c => !c.inMonth && c.iso > '2026-12-31')
    expect(trailing.every(c => c.year === 2027 && c.month === 1)).toBe(true)
  })
})
