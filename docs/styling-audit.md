# Styling audit — July 2026

State of the styling system across `@vyui/kit`, `@vyui/core`, the `styles/` overlays and
the example apps. Nuxt UI remains the north star; this audit measures where the
native-first (Lynx) trade-offs were made deliberately and where things have just drifted.

Verification notes: the "silent no-CSS" findings below were confirmed by compiling probe
classes through the real preset (`@vyui/kit/tailwind` + Tailwind 3), not inferred from
reading. Everything else is file-level inspection with line refs.

---

## 1. TL;DR

The **architecture is sound and better documented than most design systems** — a two-tier
CSS-var token layer, tailwind-variants slot themes, a three-level override chain
(tokens → `appConfig.ui` → `props.ui`), and token-only style overlays. The file-header
comments in `style.css` and the theme files are the de-facto convention docs and they are
good.

The problems are **enforcement and completion**, not design:

1. **Verified bug:** opacity modifiers on semantic colors (`bg-neutral-900/50`,
   `bg-neutral-100/50`) generate **no CSS at all** — every modal/drawer/tray overlay and
   every `soft` input-family variant references a class that doesn't exist.
2. ~~The `styles/shadcn` and `styles/rounded` overlays **violate the single-level `var()`
   rule** that the base `style.css` was just fixed for, and neither has the `.dark`
   neutral-inversion block — they're two generations behind the base token file.~~
   **Fixed** — see §4.2; a registry test now guards it.
3. **Fixed in #129:** the semantic surface-token tier (`--ui-bg`/`--ui-bg-muted`/
   `--ui-bg-elevated`/`--ui-bg-accented`/`--ui-bg-inverted`, `--ui-text-*`,
   `--ui-border-*`) now exists in `style.css` and is consumed by ~18 themes, so
   `bg-white` no longer means "white cards on a dark page" across most of the kit. The
   remaining stragglers are the **Island family** (`island.ts`, `islandButton.ts`, still
   raw `bg-white`/`border-black`/`text-slate-*`) and the `avatarGroup.ts` overlap-ring
   `border-white`, which is an intentional gap pending a `ring-bg`-equivalent token (see
   §5.1–5.2).
4. **Fixed 2026-07:** the safelist in `tailwind.js` emitted **~550 KB of utility CSS**
   (pre-minify) from combinatorial patterns, including dead `data-[…]` variants and
   unusable `ring-*` utilities. It now safelists the exact classes collected from the
   packaged theme configs (~84 KB in kit-demo) and offers an opt-in `components` filter;
   §7 describes the old mechanism.

---

## 2. The system as designed (layer map)

| Layer | Where | What it owns |
|---|---|---|
| Palette tier | `packages/kit/src/style.css` `--ui-color-{semantic}-{50..950}` | semantic → concrete Tailwind palette, `theme()` literals |
| Mode tier | `style.css` `--ui-{semantic}` | active shade per mode (-500 light / -400 dark) for `bg-primary` shorthands |
| Dark ramp | `style.css` `.dark` block | neutral ramp inversion + mode-tier shift; toggled by `useColorMode()` |
| Radius/border | `style.css` `--ui-radius` + `tailwind.js` scales | one var rescales all `rounded-*`; border widths halved globally |
| Tailwind preset | `packages/kit/src/tailwind.js` | wires semantic names → vars, safelist, `VYUI_UI_STATES` |
| Component themes | `packages/kit/src/theme/*.ts` (45 files) | tailwind-variants slot configs, ported from nuxt/ui |
| Engine | `useStyledComponent` + `utils/tv.ts` | package theme ⊕ `appConfig.ui[name]` ⊕ `props.ui` via `tv({ extend })` |
| Motion | core `presence.css` (keyframes) + kit `style.css` (modal choreography) + core `SheetContentImpl` (sheet slide) | `ui-entering/leaving/open` lifecycle classes |
| Icon color | `utils/resolveColor.ts` | bakes hex fills into `<svg>` (Lynx rasterizes; no `currentColor`) |
| Style overlays | `styles/rounded`, `styles/shadcn` | token-only restyles proving the layering |

Deliberate Lynx trade-offs, all documented in-file and all still correct:
no `hover:`/`focus-visible:` (use `active:`), no `ring-*` (use `border-*` +
flat `box-shadow`), no CSS inheritance (`fg` classes spread onto text-bearing slots),
`ui-*` class variants instead of `data-[state]` selectors (issue #9),
single-level `var()` resolution on device.

---

## 3. What's holding up well

- **Issue #9 is actually done in code.** No live `data-[state]` selector remains in any
  theme class string — only comments and the safelist still mention them.
- **The `base`/`fg` split** (surface on root, text color spread per slot) is applied
  consistently in the color-bearing themes, and `button.ts`'s `iconFg()` derives the SVG
  fill from the same `fg` string so class and baked hex can't drift.
- **Builder themes** (`(colors) => config`) thread `appConfig.ui.colors` reactively;
  static exports are correctly reserved for colorless themes.
- **Size scales are coherent**: `sm–xl` core everywhere, with intentional extensions
  (avatar/chip `2xl/3xl`, button `xs`) and reductions (actionSheet/calendar/sortable
  `sm–lg`).
- **The token-only overlay concept works** — `styles/rounded` restyles the whole kit by
  shipping just a CSS file.
- **The in-file documentation culture.** The `style.css` banner (sync contract, dark-mode
  rationale, single-level-var rule) is the best styling doc in the repo.

---

## 4. Verified defects

### 4.1 Opacity modifiers on semantic colors silently emit no CSS

The preset wires semantic colors to raw `var()` strings without `<alpha-value>`, so
Tailwind 3 **skips generating** any `/<alpha>` utility on them. Compiled through the real
preset: `bg-black/10` and `bg-white/80` emit rules; `bg-neutral-900/50` and
`bg-neutral-100/50` emit nothing. `button.ts:16-18` documents the rule ("no opacity color
modifiers … mimic with discrete shades").

**Update — soft-variant half fixed in #129, overlay half still open:**

| Class | Files | Status |
|---|---|---|
| `bg-neutral-900/50` overlay | `modal.ts:28`, `drawer.ts:18`, `tray.ts:26` | **STILL BROKEN** — confirmed unchanged; **no dim layer at all**, the fade animates a transparent view |
| `bg-neutral-900/40` overlay | `actionSheet.ts:27` | **STILL BROKEN** — same, plus a /40-vs-/50 drift |
| `bg-neutral-100/50` soft variant | `input.ts:68`, `select.ts:58`, `combobox.ts:54`, `textarea.ts:62`, `pinInput.ts:22`, `numberField.ts:60` | **FIXED** — all six now read `bg-muted active:bg-elevated disabled:bg-muted` (discrete surface tokens, no alpha) |

Remaining fix (overlays only):
- `bg-black/50` — compiles (black parses to rgb), is device-proven (island uses
  `bg-black/10`), and is dark-mode-correct without ramp participation. Hoist into one
  shared constant or slot-level convention so the dim level can't fork again.

A cheap guard: extend `tailwind.test.ts` to compile every theme's emitted class strings
and fail on classes that produce no CSS. That converts this whole class of bug from
"invisible on device" to "red test".

### 4.2 `styles/shadcn` and `styles/rounded` are behind the base token file

**FIXED.** Both overlays' mode tiers held **nested `var()` refs** (`--ui-primary:
var(--ui-color-primary-900)`) — the same two-level `var()` collapse the dark-mode
changeset fixed in the base `style.css` (mode tier must hold `theme()` literals; Lynx
resolves one level only). On device their `bg-primary` / `text-primary` shorthands
collapsed. Both now hold literals, and `registry-output.test.ts` asserts that no shipped
style's `style.css` declares a `--ui-*` token whose value opens with `var(` — so the
class of bug is now a red test rather than a device-only surprise.

Blast radius inside the library was **zero**: excluding comments, neither `@vyui/kit` nor
`@vyui/core` emits a single bare mode-tier utility — every component resolves the ramp
directly (`bg-${c}-500`, `text-${c}-600`). The mode tier exists purely as consumer-facing
API, so the bug only bit apps that wrote `bg-primary` / `text-error` themselves. That is
still worth fixing (it is a published contract), but it explains why nothing looked wrong
in the demos.

The second half of the original finding — "neither inverts the neutral ramp, so dark mode
flips accents but not surfaces/text" — was fixed earlier (both overlays now carry the full
semantic token set in `.dark`).

The base `style.css` sync contract now spans four hand-kept copies of the ramp blocks
(base + 3 overlays) plus `color-constants.js`. `registry-output.test.ts` now pins the part
that actually breaks silently — every style must declare every token the base declares, so
a new base token fails CI until the overlays follow. Value parity beyond that is still
unenforced (it is largely what a style *is*), except for `rounded`, which is asserted to
differ from the base in `--ui-radius` alone.

### 4.3 Two token roles the system has no name for

Porting LUNA (`styles/lunaris`) surfaced two gaps where an external system draws a
distinction vyui currently can't express. Neither is a luna-specific problem — both are
equally true of the base theme; LUNA just makes them legible by naming the tiers.

**No elevation tier.** `--ui-bg` does double duty as the page background *and* the
floating-panel background: `modal.ts:29`, `popover.ts:14`, `drawer.ts:19` and
`select.ts:29` all paint `bg-default`, and so does the app root. In light mode both are
white and nothing looks wrong. In dark, a popover is `slate-900` on a `slate-900` page —
separated only by its border. LUNA carries three surface tiers for exactly this
(`canvas` → `paper` → `paper-clear`, `#0d0d0d` → `#1a1a1a` → `#232323`). Fix is either a
new raised-surface token or pointing floating panels at `bg-muted`; both are kit-wide
changes across the component themes, and both want doing alongside §4.1.

**No on-accent foreground token.** `button.ts:45` hardcodes `text-white` for every solid
variant. That holds while solid surfaces are `bg-${c}-500`, but it is an assumption, not a
token — there is no `--ui-primary-content` to pair with `--ui-primary`. LUNA specifies one
per accent (`primary-content` is `#010101` on its light-pink dark-mode primary, i.e. black
text). No kit component paints on the mode tier today (§4.2), so nothing is currently
wrong; it becomes wrong the moment a component does, or a consumer sets an accent light
enough that white-on-it fails contrast.

### 4.4 `label.ts` is off-system

**Color claim fixed in #129:** `label.ts:10` previously used `text-gray-900` (Tailwind's
stock palette, not the `neutral` semantic). It now uses `text-highlighted`, a semantic
surface-tier token (§5.2) — confirmed by reading the current file. It rebrands and flips
in dark mode correctly.

Still open: `label.ts` relies on `after:content-['*']` for the required asterisk —
pseudo-element support on Lynx native is unverified; the required-asterisk may silently
not render on device (needs a device check, not a code fix, first).

### 4.5 Inline template classes bypass the theme layer

`Combobox.vue:237-238` hardcodes `text-neutral-900` / `text-neutral-400` on the display
label directly in the template. Those colors are unreachable by `appConfig.ui.combobox`
and `props.ui` — they belong in `combobox.ts` slots (`value` / `placeholder`, matching
nuxt/ui's slot names).

### 4.6 Comment rot

Harmless but misleading during exactly this kind of drift review:
- ~~`button.ts:19` "No dark mode"~~ — **fixed in #129.** Now reads "Dark mode rides the
  semantic tokens (`text-default`, `bg-elevated`, …), not `dark:` variants." Same fix
  landed in `tabs.ts`'s header comment ("Dark rides the semantic tokens").
- `tailwind.js:155-156` "data-[…] entries … can be dropped once #9 lands" — #9 landed.
- **Re-verified, still accurate:** `tabs.ts:18-25`, `stepper.ts:18`,
  `dropdownMenu.ts:48,97-98` still describe `data-[state=…]`/`group-data-[state=…]:`
  wiring the code no longer uses (the actual classes are `group-ui-active:`,
  `group-ui-completed:`, `ui-highlighted:`, `group-ui-highlighted:`, etc.). This is the
  older issue-#9 rot, unrelated to the dark-mode commit — line numbers and content are
  unchanged.

---

## 5. Dark mode readiness — the structural gap (mostly closed in #129)

The dark strategy (invert the neutral ramp, shift the mode tier) is elegant and correct
**for everything that reads the ramp**. §5.2 documents the semantic surface-token tier
that closes most of the remaining gap; §5.1 is kept as a historical record of what the
inventory looked like before that tier landed, annotated with what's still outstanding.

### 5.1 `bg-white` surface inventory (as of the original audit — now mostly migrated)

Hardcoded white surfaces that would NOT have flipped in dark mode at audit time:

- **Overlay/menu surfaces:** `modal.ts`, `drawer.ts`, `tray.ts`, `popover.ts`,
  `dropdownMenu.ts`, `toast.ts`, `combobox.ts`/`select.ts` content panels — **migrated to
  the surface-token tier in #129** (see §5.2).
- **Form chrome:** `input.ts`, `textarea.ts`, `numberField.ts`, `pinInput.ts`
  (`outline` variants), `checkbox.ts` unchecked box, `radioGroup.ts` base+indicator —
  **migrated in #129**, except the `radioGroup.ts` indicator knob and `switch.ts` thumb
  knob, which stay literal `bg-white` by design (same knob-white exception noted below).
- **Containers:** `card.ts`, `alert.ts` outline variant, `sortable.ts` item pill,
  `swipeAction.ts` content, `toggleGroup.ts` items — **migrated in #129**.
- **Island family — STILL NOT MIGRATED:** `island.ts` (`bg-white/80` + `border-black/5`),
  `islandButton.ts` (`text-slate-700/900` — raw slate, bypasses neutral entirely).
  Confirmed via grep, untouched by the dark-mode commit.
- **`avatarGroup.ts` — STILL A LITERAL, but intentional:** the avatar overlap ring
  (`border-white`) stands in for a `ring-bg`-style page-background color; the file's own
  comment explains there's no semantic equivalent for that yet. This is a known,
  deliberate gap, not a drive-by miss.

Whites that are **deliberate and should stay**: switch/slider/radio knob whites and
`text-white` on solid color fills — a -500 solid reads fine on both modes.

### 5.2 The semantic surface-token tier — SHIPPED in #129

This was the last missing piece of Nuxt UI parity, and it has landed. `style.css`
(~lines 171–247) now defines a full surface-token tier, redefined with concrete
`theme()` literals in both `:root` and `.dark` (never nested `var()` — the single-level
rule from §4.2 applies here too):

- **Text:** `--ui-text-dimmed`, `--ui-text-muted`, `--ui-text-toned`, `--ui-text`,
  `--ui-text-highlighted`, `--ui-text-inverted`
- **Background:** `--ui-bg`, `--ui-bg-muted`, `--ui-bg-elevated`, `--ui-bg-accented`,
  `--ui-bg-inverted`
- **Border:** `--ui-border`, `--ui-border-muted`, `--ui-border-accented`,
  `--ui-border-inverted`

Registered in `tailwind.js` as `text-*`/`bg-*`/`border-*` utilities (`text-highlighted`,
`bg-muted`, `bg-elevated`, `border-accented`, …).

Already consumed (confirmed via grep) by ~18 themes: `input.ts`, `textarea.ts`,
`select.ts`, `combobox.ts`, `numberField.ts`, `pinInput.ts`, `card.ts`, `modal.ts`,
`toast.ts`, `accordion.ts`, `alert.ts`, `radioGroup.ts` (base/legend/label/description —
indicator knob stays literal `bg-white` by design), `rating.ts`, `switch.ts`
(label/description — thumb knob stays literal by design), `swipeAction.ts`,
`toggleGroup.ts`, `label.ts` (§4.4), and others.

**What's left (not migrated, tracked as open findings):**
- Island family — `island.ts` + `islandButton.ts` (§5.1, drift table §6).
- `avatarGroup.ts` overlap-ring `border-white` — intentional gap pending a `ring-bg`
  equivalent (§5.1).

Payoff beyond dark mode: one `--ui-bg` override restyles every migrated component, and
the text hierarchy is now a named, greppable convention instead of ad-hoc
`neutral-900/500/400`.

### 5.3 Icon fills are mode-blind

`resolveColorHex` (`utils/resolveColor.ts`) resolves icon hex from the **JS plane**
(`appConfig.ui.primary` → `tailwindcss/colors`), while every class resolves from the
**CSS plane** (`--ui-color-*`). Two consequences:

- A consumer who rebrands via CSS vars only (the documented override path in
  `style.css:16-17`) gets mismatched icons — classes go rose, icons stay green.
- In dark mode, neutral **classes** flip via the inverted ramp but neutral **icon hex**
  does not — `text-neutral-700` icons resolve to slate-700 and go dark-on-dark.

Minimum fix: make `resolveColorHex` dark-aware (invert neutral shade lookups when the
active mode is dark — `useColorMode` already knows). Longer term, document loudly that
`ui.primary`/`ui.gray` must be kept in sync with any CSS-var rebrand, or derive both
from one config input (`defineVyuiConfig` is already positioned to be that input).

**Still accurate — no library-level fix landed.** Re-verified by reading
`packages/kit/src/utils/resolveColor.ts`: the `resolveColorHex` signature is unchanged,
still taking an explicit `shade` param rather than reading `useColorMode()` itself.
Commit 9490d0f ("bake icon color hex") added a per-consumer *workaround* instead — the
flashcards-demo example's `iconColors.ts` (`useIconColors()`) manually passed a
dark-aware shade at each `VyIcon` call site. That workaround is no longer in the tree:
the whole flashcards-demo app was deleted one commit later (`6d0262f`, "chore: remove
flashcards demo"). The pattern is still worth mining from git history (`git show
9490d0f:apps/examples/flashcards-demo/src/iconColors.ts`) as prior art for the eventual
library-level fix, but there is currently no live consumer demonstrating it.

---

## 6. Drift inventory (conventions that forked)

| Axis | State | Call |
|---|---|---|
| Upstream baseline | ~28 themes ported from nuxt/ui **v3.0.2**, 5 from **v4** (button, badge, avatar, avatarGroup, chip) | Pick v4 as the single reference; re-baseline v3 ports opportunistically (paddings/text sizes for the same `md` differ between generations) |
| Overlay dim | `/50` (modal, drawer, tray) vs `/40` (actionSheet) — both currently no-ops (§4.1) | One shared overlay class, set once |
| Motion ownership | keyframes in core `presence.css`; modal choreography in kit `style.css` via `vy-modal-*` markers; sheet slide inside core `SheetContentImpl`; toast hooks in core `ToastRoot` | Fine to keep split (each is load-bearing), but write the ownership map down — it's currently reconstructable only from four file headers |
| Focus ring | `shadow-[0_0_0_2px_var(--ui-color-{c}-200)]` template literal duplicated in `theme/input.ts:92` and `tailwind.js:191` with a "keep in sync" comment | Export one `focusRing(c)` helper from `theme/` used by both; textarea/select/pinInput should reuse it when they gain focus rings |
| Island family | Hardcoded `bg-white/80`, `border-black/5`, `text-slate-700/900` — a private Linear-style palette | The blur/translucency is the component's identity (keep), but route text through the neutral ramp / surface tokens so it rebrands and dark-flips |
| Config planes | Colors configured in 3 places: CSS vars, `createVyuiPreset({ colors })`, `provideVyUI({ ui })` — plus `ui.primary`/`ui.gray` for icon hex | Documented, but each pair is a manual sync contract; `defineVyuiConfig` should be the single input threaded to all three (it already covers preset+runtime) |

---

## 7. Payload: the safelist needs a diet

> **Fixed 2026-07** — the preset now walks the packaged theme configs and safelists the
> exact classes they emit for the configured color set (~84 KB in kit-demo), with an
> opt-in `components` filter for consumers using a subset of the kit. Kept for the
> record of the original mechanism and measurements.

`tailwind.js:145-193` brute-forces `(bg|text|ring|border) × 7 colors × 11 shades × 27
variants`. Measured output: **~550 KB of utility CSS** before minify, shipped into every
Lynx bundle regardless of usage.

- `ring-*` is safelisted but unusable on Lynx (the themes' own headers say so) — pure
  dead weight, drop it from the pattern.
- The 13 `data-[…]` variant entries are dead since #9 — drop.
- The variant list is a cross product, but real usage is sparse: `group-ui-*` variants
  are only ever paired with `text-*`, `hover:` never fires on Lynx, `bg-*` needs only
  `active:` and a couple of `ui-*` states. Splitting the single pattern into 2–3
  per-utility patterns (bg × active/ui-states, text × group-ui-states, border × base)
  would cut the emitted CSS by well over half without losing any class the themes
  actually template.
- The surface-token tier (§5.2) shrinks the need further: fixed neutral surfaces stop
  being template literals entirely and become statically scannable classes.

---

## 8. Consolidation plan (priority order)

**P0 — broken on device today**
1. Replace all alpha-modifier classes (§4.1): overlays → shared `bg-black/50`-style
   constant; soft variants → discrete shades. Add the compile-time "class emits CSS" test.
2. ~~Fix `styles/shadcn` + `styles/rounded`: mode tier → `theme()` literals; add the `.dark`
   neutral inversion block (§4.2).~~ **Done**, with a nested-`var()` guard in
   `registry-output.test.ts`. Ramp-parity across the (now five) `style.css` files is still
   hand-kept — see §4.2.

**P1 — before dark mode is called done**
3. ~~Introduce the semantic surface-token tier and migrate the `bg-white` +
   `text-neutral-900/500/400` + `border-neutral-200/300` inventory (§5.1–5.2).
   Keep knob whites and solid-fill `text-white`.~~ **DONE in #129** — tier shipped in
   `style.css`, consumed by ~18 themes. Remaining stragglers: Island family +
   `avatarGroup.ts` ring (§5.1).
4. Make `resolveColorHex` mode-aware for neutral; document the CSS-var ↔ `ui.primary`
   sync requirement (§5.3).
5. Fix `label.ts` (`text-gray-900` → semantic — **DONE in #129**; device-verify
   `after:content` — **still open**) and move `Combobox.vue`'s inline text colors into
   theme slots (§4.4–4.5, still open).

**P2 — hygiene and payload**
6. Safelist diet (§7): drop `ring` + `data-[…]`, split per-utility patterns.
7. Extract the shared `focusRing(c)` helper; delete the hand-sync comment pair.
8. Sweep the stale comments (§4.6).

**P3 — keep it from drifting again**
9. Write `docs/styling.md` — promote the conventions that currently live only in file
   headers into one page: token tiers + single-level `var()` rule, `base`/`fg` split,
   `ui-*` state classes, discrete-shades-not-alpha, surface-token usage, motion ownership
   map, the list of sync contracts and which test guards each.
10. Re-baseline the v3.0.2 ports against nuxt/ui v4 as components get touched; note the
    port version in one constant instead of 40 headers.

---

## 9. Proposed convention cheat-sheet (to seed `docs/styling.md`)

- **Color:** semantic names only (`primary…error`, `neutral`). Never stock palettes
  (`gray-*`, `slate-*`) in themes; never hex. `black`/`white` only for knobs, solid-fill
  text, and overlay dims.
- **Surfaces/text/borders:** surface tokens (`bg-default/elevated/muted`,
  `text-highlighted/muted/dimmed`, `border-default/accented`) once §5.2 lands; the
  neutral ramp directly until then. Never `bg-white`.
- **Alpha:** no `/<alpha>` on semantic colors — discrete shades (`/10`→`-50`,
  `/15`→`-100`, `/25`→`-200`, `/50`→`-300`). `/<alpha>` on literal `black`/`white` is fine.
- **State:** `active:` for touch feedback (no `hover:`/`focus-visible:`); `ui-*` classes
  for component state (never `data-[state]`); `group-ui-*` on child slots because
  inheritance is off.
- **Vars:** any `--ui-*` token consumed by a utility must hold a concrete value
  (`theme()` literal) — one `var()` hop maximum on device.
- **Themes:** builder export iff the theme emits per-color variants; `base`/`fg` split
  for anything with a colored surface; icon color derived from the `fg` string
  (`iconFg` pattern), never a second source.
- **Motion:** keyframes live in core `presence.css`; choreography binds via
  `ui-entering/leaving/open` lifecycle classes (never `data-[state]` — the
  mount→enter gap and close-vs-fresh-mount ambiguity are why); component markers
  (`vy-modal-*`) tag the elements, kit CSS owns the timing.
- **New classes from template literals:** must be covered by the safelist, and the
  safelist must be covered by a compile test.
