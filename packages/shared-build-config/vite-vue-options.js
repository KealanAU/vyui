/**
 * Shared `@vitejs/plugin-vue` options for vyui packages (core, kit).
 *
 * Vite-flavored port of `vueLynxLoaderOptions` (the webpack `vue-loader`
 * form). Both target the Lynx custom runtime, not SSR: the SFC compiler must
 * emit client render functions only (never `ssrRender*`, which would pull in
 * `vue/server-renderer`), and `isNativeTag: () => true` makes Vue treat Lynx's
 * element tags (`view`, `text`, …) as native so it neither warns nor tries to
 * resolve them as components.
 *
 * The webpack-only knobs (`isServerBuild`, `experimentalInlineMatchResource`)
 * have no `@vitejs/plugin-vue` equivalent and are dropped — the plugin already
 * emits client render functions in a non-SSR build.
 *
 * Pass straight to `pluginVue(vueLynxViteOptions)`.
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
