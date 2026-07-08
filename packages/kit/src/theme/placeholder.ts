/**
 * Placeholder theme — adapted from nuxt/ui v3 `theme/placeholder.ts`.
 *
 * A dashed-bordered, X-hatched panel used to mark out layout regions in demos
 * and docs. Sizes itself to whatever the caller passes via `class` (`h-48`,
 * `aspect-square`, etc.).
 */
export default {
  // No `w-full` — flex children already stretch cross-axis via
  // `align-items: stretch`, AND that path honours `m-*` margins. Setting
  // `w-full` here would make the box 100% of the parent BEFORE margins,
  // pushing it past the right edge of any parent it sits inside (e.g.
  // `w-full + m-4` overflows by 2rem). Callers outside a flex container can
  // add `w-full` themselves via `class`.
  base: 'relative overflow-hidden rounded-md border border-dashed border-accented bg-muted',
}
