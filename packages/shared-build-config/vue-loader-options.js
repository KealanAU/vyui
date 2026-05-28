/**
 * Shared Vue loader options for vyui packages (core, ui).
 *
 * Both packages target the Lynx custom runtime, not SSR, and they need the
 * SFC compiler to emit client-side render functions only — never the
 * `ssrRender*` helpers that would require `vue/server-renderer`. They also
 * need `isNativeTag: () => true` so Vue treats Lynx's element tags
 * (`view`, `text`, etc.) as native and doesn't warn or attempt component
 * resolution for them.
 *
 * Pass this object straight to `pluginVue({ vueLoaderOptions: ... })`.
 *
 * @type {import('./vue-loader-options').VueLynxLoaderOptions}
 */
export const vueLynxLoaderOptions = {
  isServerBuild: false,
  experimentalInlineMatchResource: false,
  compilerOptions: {
    isNativeTag: () => true,
    whitespace: 'condense',
    hoistStatic: false,
  },
}
