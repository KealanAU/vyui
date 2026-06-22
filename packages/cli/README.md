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

A style is, for most components, just a different set of `theme/*.ts` files plus
its own `style.css` / Tailwind preset tokens — the component `.vue` files are
pure structure. Author one by creating an overlay dir mirroring
`packages/kit/src` (only the files you change) and registering it in the
`STYLES` array of `tools/gen-registry.ts`:

```ts
const STYLES = [
  { name: 'default' },                                   // sources from packages/kit/src
  { name: 'shadcn', overlay: resolve(root, 'styles/shadcn') }, // overlay wins per file
]
```

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
