# @vyui/cli

shadcn-style CLI for adding [`@vyui/kit`](../kit) styled components into your
own project. Instead of depending on a styled-component package, you copy the
component source in and own it — the headless `@vyui/core` primitives stay an
installed npm dependency (the Radix model).

## Usage

```bash
# 1. Pick a style + set up vyui.config.json, shared files, install @vyui/core
npx @vyui/cli init                 # prompts for style when >1 is available
npx @vyui/cli init --style default

# 2. Add components (their dependencies come along automatically)
npx @vyui/cli add button
npx @vyui/cli add toast        # also pulls in button, avatar, chip
npx @vyui/cli add --all        # everything in the registry

# List the styles the registry offers
npx @vyui/cli styles
```

### Options

| Flag | Description |
| --- | --- |
| `--registry <url>` | Registry base URL (default `https://vyui.dev/r`) |
| `--style <name>` | Style to use (`init`; default comes from the registry) |
| `--base-color <name>` | Neutral/gray palette (`init`; e.g. `slate`, `zinc`, `stone`) |
| `--all` | Add every component in the registry (`add`) |
| `--overwrite` | Overwrite files that already exist |
| `--skip-install` | Don't install npm dependencies |
| `-y, --yes` | Accept defaults / skip prompts |
| `--cwd <dir>` | Run against another directory |

## Styles

The registry is namespaced by *style* (`<registry>/<style>/…`). `default` is the
canonical kit; the `style` chosen at `init` is stored in `vyui.config.json` and
every `add` pulls from that namespace. To re-style a project, change `style` in
the config (then re-`add --overwrite`).

### Authoring a style — work from the cheapest layer up

vyui separates **structure** (`.vue`), **appearance** (`theme/*.ts`), and
**tokens** (`style.css` CSS vars + the Tailwind preset). A style is registered
in the `STYLES` array of `tools/gen-registry.ts` with an optional overlay dir
(mirroring `packages/kit/src`, **only the files you change**) and an optional
`appConfig` of baked-in theme overrides:

```ts
const STYLES = [
  { name: 'default' },                                          // sources from packages/kit/src
  { name: 'rounded', overlay: resolve(root, 'styles/rounded') }, // token-only overlay
  {
    name: 'shadcn',
    overlay: resolve(root, 'styles/shadcn'),                    // tokens (style.css)
    appConfig: { primary: 'zinc', button: { defaultVariants: { color: 'neutral' } } },
  },
]
```

1. **Token layer (primary).** An overlay with just `style.css` and/or
   `tailwind.js`. Because every `rounded-*` utility resolves off `--ui-radius`,
   border weights off the preset's `borderWidth`, the neutral palette off the
   `--ui-color-neutral-*` block, and icons off `theme/icons`, most restyling —
   **radius, neutral palette, border weight, icon set** — lives here and reuses
   every base `.vue` + `theme/*.ts` untouched. The shipped `rounded` style is a
   worked example: it overlays **only `style.css`** (a larger `--ui-radius`) and
   its generated `r/rounded/` registry reuses all base components verbatim.
2. **Theme overrides (per-component, no file copy).** Set `appConfig` on the
   style. The values are baked into that style's `plugin.ts` `defaultConfig.ui`,
   and each component picks them up at runtime via `appConfig.ui[name]` →
   `tv({ extend: tv(base), ...overrides })`. This changes slots / variants /
   `defaultVariants` **without copying a theme file**, so it never drifts from
   the base. The shipped `shadcn` style uses this: `appConfig.ui.button`
   flips the default button to the near-black `neutral` solid, and `primary:
   'zinc'` aligns baked SVG icon fills with the zinc token palette.
3. **Full-file overlay (escape hatch).** Drop a replacement `theme/*.ts` (or
   `.vue`) into the overlay dir **only** when a slot's *structure* must differ in
   a way override data can't express. The overlay wins per file — but you then
   own that copy and must track base changes, so prefer layers 1–2.

> See the rendered `default` vs `shadcn` comparison in [`demo/`](../../demo) —
> open `demo/index.html` in a browser.

## Theming: install-time vs runtime

There are two distinct theming axes; they do **not** overlap, so know which one
you're reaching for.

**Install-time (styles / tokens).** The `style` + `--base-color` you pick at
`init`, materialised in the copied `style.css` and `vyui-preset.js`. This is
where **radius, the neutral/gray palette, and border weights** live. `--base-color`
substitutes the chosen palette (`slate`/`zinc`/`stone`/…) into the
`--ui-color-neutral-*` ramp and the plugin's `gray` default at copy time. To
change these after install you edit the CSS vars / preset in your own copy.

**Runtime (`appConfig` via the `VyUI` plugin).** The `ui` options you pass to
`app.use(VyUI, { ui: { primary, gray, … } })` (and per-component `ui`
overrides). These flow through `useAppConfig`.

> **Caveat — runtime `primary` is not a full recolor.** `appConfig.ui.primary`
> only affects (a) the variant **color list** and (b) the **baked SVG icon
> fills** (Lynx `<svg>` can't inherit `currentColor`, so `resolveColor.ts` bakes
> the hex at render). The actual `bg-primary-*` / `text-primary-*` Tailwind
> class surfaces resolve through the `--ui-color-primary-*` **CSS vars**, so
> setting `primary` at runtime does **not** recolor those surfaces — that
> requires editing the CSS vars / tokens (the install-time layer). Treat runtime
> `primary` as "pick from the existing palettes for icons + variants", not
> "rebrand the whole component set".

## How it works

`init` writes `vyui.config.json` describing your import aliases + on-disk paths,
then copies the shared library (`useAppConfig`, `resolveColor`, the Tailwind
preset, `style.css`, the `VyUI` plugin, …) into your project.

`add` fetches a component manifest from the registry, recursively resolves its
`registryDependencies`, writes every file to your configured directories, and
**rewrites the relative imports** in the copied source to your aliases. Bare
imports (`@vyui/core`, `vue`, `tailwind-variants`) are left untouched and
installed as npm dependencies.

The registry itself is generated from `@vyui/kit` source by
`tools/gen-registry.ts` and served as static JSON from the docs site.

## After `init`

1. Register the plugin: `app.use(VyUI)` (from your `lib` alias).
2. Add the Tailwind preset to your `tailwind.config`.
3. Import `style.css` once in your bundle/CSS entry.
