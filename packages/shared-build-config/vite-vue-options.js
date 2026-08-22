/**
 * Shared `@vitejs/plugin-vue` options for vyui packages (core, kit).
 *
 * Targets the Lynx runtime, never SSR: client render functions only (an
 * `ssrRender*` would pull in `vue/server-renderer`), and `isNativeTag: () =>
 * true` so Vue treats Lynx tags (`view`, `text`, …) as native instead of
 * warning and trying to resolve them as components.
 *
 * @type {import('./vite-vue-options').VueLynxViteOptions}
 */
export const vueLynxViteOptions = {
  template: {
    compilerOptions: {
      isNativeTag: () => true,
      whitespace: 'condense',
      hoistStatic: false,
    },
  },
}
