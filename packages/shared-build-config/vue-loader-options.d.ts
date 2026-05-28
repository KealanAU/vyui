export interface VueLynxLoaderOptions {
  isServerBuild: false
  experimentalInlineMatchResource: false
  compilerOptions: {
    isNativeTag: (tag: string) => boolean
    whitespace: 'condense' | 'preserve'
    hoistStatic: boolean
  }
}

export const vueLynxLoaderOptions: VueLynxLoaderOptions
