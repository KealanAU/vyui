/**
 * Author a @vyui/kit project config ONCE, feed it to both planes —
 * `createVyuiPreset(config)` at build time and `provideVyUI(app, config)` at
 * runtime — so the classes Tailwind emits and the variant the runtime selects
 * can't drift.
 *
 * Plain `.js` with a sibling `.d.ts`, exported from the light `@vyui/kit/config`
 * entry, so Tailwind's jiti loader can import it WITHOUT pulling the Vue
 * component barrel into the Node build path.
 *
 * IMPORTANT: runtime config does not CREATE styling. The preset emits the class
 * surface at build time; this only selects from it, so a color listed here
 * resolves to nothing unless the preset generated it and a matching
 * `--ui-color-<name>-*` CSS var exists.
 *
 * Normalizes the authoring shape into the canonical `{ ui }` bag both consumers
 * read: `theme` → palette + semantic selection, `components` → per-component
 * tailwind-variants overrides.
 *
 * @param {import('./config').VyuiConfig} [config]
 * @returns {import('./config').ResolvedVyuiConfig}
 */
export function defineVyuiConfig(config = {}) {
  const { theme = {}, components = {} } = config
  return { ui: { ...theme, ...components } }
}
