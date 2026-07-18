# Date primitives (`@vyui/core/date`) — pending

Status: **parked, not yet consumed.** Kept deliberately; see the utilization
audit (Finding 2).

## What exists

`packages/core/src/date/` is a melt-ui port (`calendar.ts`, `comparators.ts`,
`types.ts`) built on `@internationalized/date` `DateValue` objects, published as
the `@vyui/core/date` subpath. It has grid/week/leap/range math and a test
(`calendar.test.ts`). **No component consumes it** — `useDateFormatter` only
uses the `hasTime` / `isZonedDateTime` / `toDate` helpers from it.

## Why it isn't wired up

The shipped `VyCalendar` (`packages/kit/src/components/Calendar.vue`)
deliberately avoids `DateValue`: it takes ISO strings at the public boundary and
does host-`Date`-free math (`packages/kit/src/utils/date-iso.ts`, unit-tested).
Native Lynx / PrimJS `Date`, timezone, and locale behavior is still unverified,
so building `DateValue`-based primitives now would ship an unproven runtime
dependency. Roadmap: [Calendar and date inputs](../../apps/docs/content/1.getting-started/5.roadmap.md).

## The plan (when Lynx date behavior is proven)

Reka-style headless date primitives (`CalendarRoot`, `CalendarGrid`,
`DatePicker`, …) built on `date/`'s `DateValue` math, with `VyCalendar`
migrated onto them. Until then:

- `date/` stays as the reference math for those primitives.
- `date-iso.ts` stays as the shipped `VyCalendar`'s runtime.
- Don't grow a third calendar-math implementation — extend one of these two.

If the `DateValue` direction is abandoned, removing `date/` + the `./date`
subpath + the `@internationalized/date` dependency is a clean deletion (this was
"Branch A" in the audit).
