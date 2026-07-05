/**
 * Author a @vyui/kit project config ONCE, feed it to both planes:
 *   - build-time:  createVyuiPreset(config)  — generates + safelists the palette
 *   - runtime:     provideVyUI(app, config)  /  app.use(VyUI, config)
 * so the classes Tailwind emits and the variant the runtime selects can't drift.
 *
 * Plain `.js` (like `tailwind.js` / `theme/color-constants.js`) with a sibling
 * `.d.ts`, exported from the light `@vyui/kit/config` entry — so Tailwind's
 * jiti config loader can import it from `tailwind.config.ts` WITHOUT pulling the
 * Vue component barrel (`@vyui/kit`) into the Node build path.
 *
 * IMPORTANT: runtime config does not CREATE styling. Tailwind (the preset)
 * emits the class surface at build time; this config only selects from it. A
 * color listed here still resolves to nothing unless the preset generated it
 * and a matching `--ui-color-<name>-*` CSS var exists.
 *
 * Normalizes the authoring shape into the canonical `{ ui }` bag both consumers
 * read (the runtime injects it; components read it via `useAppConfig()`):
 *   - `theme`      → palette + semantic selection (primary/gray/colors/icons)
 *   - `components` → per-component tailwind-variants overrides (button, input …)
 *
 * @param {import('./config').VyuiConfig} [config]
 * @returns {import('./config').ResolvedVyuiConfig}
 */
export function defineVyuiConfig(config = {}) {
  const { theme = {}, components = {} } = config
  return { ui: { ...theme, ...components } }
}
