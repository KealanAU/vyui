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
2. The `styles/shadcn` and `styles/rounded` overlays **violate the single-level `var()`
   rule** that the base `style.css` was just fixed for, and neither has the `.dark`
   neutral-inversion block — they're two generations behind the base token file.
3. **`bg-white` is hardcoded as the surface color in ~20 themes.** Dark mode inverts the
   neutral ramp, but `bg-white` doesn't ride the ramp — dark mode currently means white
   cards, modals, menus and inputs on a dark page. This is the one structural gap vs
   Nuxt UI: the missing **semantic surface-token tier** (`bg-default` / `bg-elevated` /
   `text-muted` / `border-default`).
4. The safelist in `tailwind.js` emits **~550 KB of utility CSS** (pre-minify) and still
   ships dead `data-[…]` variants and unusable `ring-*` utilities.

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
modifiers … mimic with discrete shades") — these files never got the memo:

| Class | Files | Effect on device |
|---|---|---|
| `bg-neutral-900/50` overlay | `modal.ts:28`, `drawer.ts:18`, `tray.ts:26` | **no dim layer at all** — the fade animates a transparent view |
| `bg-neutral-900/40` overlay | `actionSheet.ts:27` | same, plus a /40-vs-/50 drift |
| `bg-neutral-100/50` soft variant | `input.ts:68`, `select.ts:58`, `combobox.ts:54`, `textarea.ts:62`, `pinInput.ts:22`, `numberField.ts:60` | soft resting surface is transparent; only `active:bg-neutral-100` paints |

Fix options (pick one, apply everywhere):
- **Overlays:** `bg-black/50` — compiles (black parses to rgb), is device-proven
  (island uses `bg-black/10`), and is dark-mode-correct without ramp participation.
  Hoist into one shared constant or slot-level convention so the dim level can't fork again.
- **Soft variants:** discrete shade per the button convention — `bg-neutral-50
  active:bg-neutral-100 disabled:bg-neutral-50`.

A cheap guard: extend `tailwind.test.ts` to compile every theme's emitted class strings
and fail on classes that produce no CSS. That converts this whole class of bug from
"invisible on device" to "red test".

### 4.2 `styles/shadcn` and `styles/rounded` are behind the base token file

Both overlays' mode tiers hold **nested `var()` refs** (`--ui-primary:
var(--ui-color-primary-900)` — `shadcn/style.css:110-115,122-127`;
`rounded/style.css:110-115,125-131`). This is the exact two-level `var()` collapse the
pending dark-mode changeset just fixed in the base `style.css` (mode tier must hold
`theme()` literals — Lynx resolves one level only). On device these overlays' `bg-primary`
shorthands will collapse.

Both also have a `.dark` block that only shifts the mode tier — **neither inverts the
neutral ramp**, so dark mode under either overlay flips accents but not surfaces/text.

The base `style.css` sync contract now spans three hand-kept copies of the ramp blocks
(base + 2 overlays) plus `color-constants.js`. That contract needs either a generator
(the `__VYUI_GRAY__` machinery already rewrites these files at init — extend it) or a
parity test that parses all three CSS files against `SEMANTIC_TO_PALETTE_DEFAULT`.

### 4.3 `label.ts` is off-system

`label.ts:10` uses `text-gray-900` — `gray` is Tailwind's stock palette, not the `neutral`
semantic (slate). It won't rebrand with `--ui-color-neutral-*` overrides and won't flip in
dark mode. `label.ts:20` also relies on `after:content-['*']` — pseudo-element support on
Lynx native is unverified; the required-asterisk may silently not render on device
(needs a device check, not a code fix, first).

### 4.4 Inline template classes bypass the theme layer

`Combobox.vue:237-238` hardcodes `text-neutral-900` / `text-neutral-400` on the display
label directly in the template. Those colors are unreachable by `appConfig.ui.combobox`
and `props.ui` — they belong in `combobox.ts` slots (`value` / `placeholder`, matching
nuxt/ui's slot names).

### 4.5 Comment rot

Harmless but misleading during exactly this kind of drift review:
- `button.ts:19` "No dark mode" — dark mode is landing in the current changeset.
- `tailwind.js:155-156` "data-[…] entries … can be dropped once #9 lands" — #9 landed.
- `tabs.ts:18-25`, `stepper.ts:18`, `dropdownMenu.ts:48,97-98` still describe
  `data-[state]` wiring the code no longer uses.

---

## 5. Dark mode readiness — the structural gap

The dark strategy (invert the neutral ramp, shift the mode tier) is elegant and correct
**for everything that reads the ramp**. The problem is what doesn't:

### 5.1 `bg-white` surface inventory

Hardcoded white surfaces that will NOT flip in dark mode:

- **Overlay/menu surfaces:** `modal.ts`, `drawer.ts`, `tray.ts`, `popover.ts`,
  `dropdownMenu.ts`, `toast.ts`, `combobox.ts`/`select.ts` content panels
- **Form chrome:** `input.ts`, `textarea.ts`, `numberField.ts`, `pinInput.ts`
  (`outline` variants), `checkbox.ts` unchecked box, `radioGroup.ts` base+indicator
- **Containers:** `card.ts`, `alert.ts` outline variant, `sortable.ts` item pill,
  `swipeAction.ts` content, `toggleGroup.ts` items
- **Island family:** `island.ts` (`bg-white/80` + `border-black/5`),
  `islandButton.ts` (`text-slate-700/900` — raw slate, bypasses neutral entirely)

Whites that are **deliberate and should stay**: switch/slider/radio knob whites and
`text-white` on solid color fills — a -500 solid reads fine on both modes.

### 5.2 The right fix: the semantic surface-token tier

This is the last missing piece of Nuxt UI parity. Nuxt v3/v4 put `bg-default`,
`bg-elevated`, `bg-muted`, `text-highlighted/default/muted/dimmed`, `border-default/
accented` between the palette and the components, and dark mode is defined **once** at
that tier. vyui skipped it (the Lynx preset only emits `theme.colors` utilities —
`button.ts:62-64` notes this), so every theme inlined `bg-white` + a private
`neutral-900/500/400` text hierarchy instead.

Adapting it to Lynx is straightforward and there was already a spike of this work (on the
stale `feat/dark-mode-color-mode-switch` branch — worth mining, not merging):

- Add `--ui-bg`, `--ui-bg-elevated`, `--ui-bg-muted`, `--ui-text`, `--ui-text-muted`,
  `--ui-text-dimmed`, `--ui-border`, `--ui-border-accented` to `style.css`, **holding
  `theme()` literals per mode** (the single-level `var()` rule forbids
  `--ui-bg: var(--ui-color-neutral-50)` — same constraint as the mode tier; this is why
  the tokens must be redefined concretely inside `.dark`, and why the sync-contract
  generator/test from §4.2 matters more once this tier exists).
- Register them in `tailwind.js` as `backgroundColor`/`textColor`/`borderColor` extensions
  (`bg-default`, `bg-elevated`, `text-muted`, `border-default`, …).
- Migrate the §5.1 inventory mechanically: `bg-white` → `bg-default` (form chrome,
  cards) or `bg-elevated` (floating surfaces), `text-neutral-900` → `text-highlighted`,
  `text-neutral-500` → `text-muted`, `text-neutral-400` → `text-dimmed`,
  `border-neutral-200` → `border-default`, `border-neutral-300` → `border-accented`.

Payoff beyond dark mode: one `--ui-bg` override restyles every component, and the ad-hoc
`900/500/400` text hierarchy becomes a named, greppable convention.

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
2. Fix `styles/shadcn` + `styles/rounded`: mode tier → `theme()` literals; add the `.dark`
   neutral inversion block (§4.2). Add ramp-parity test across the three style.css files.

**P1 — before dark mode is called done**
3. Introduce the semantic surface-token tier and migrate the `bg-white` +
   `text-neutral-900/500/400` + `border-neutral-200/300` inventory (§5.1–5.2).
   Keep knob whites and solid-fill `text-white`.
4. Make `resolveColorHex` mode-aware for neutral; document the CSS-var ↔ `ui.primary`
   sync requirement (§5.3).
5. Fix `label.ts` (`text-gray-900` → semantic; device-verify `after:content`) and move
   `Combobox.vue`'s inline text colors into theme slots (§4.3–4.4).

**P2 — hygiene and payload**
6. Safelist diet (§7): drop `ring` + `data-[…]`, split per-utility patterns.
7. Extract the shared `focusRing(c)` helper; delete the hand-sync comment pair.
8. Sweep the stale comments (§4.5).

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
