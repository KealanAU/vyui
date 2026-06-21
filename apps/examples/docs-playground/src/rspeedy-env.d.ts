/// <reference types="@lynx-js/rspeedy/client" />

declare module '@lynx-js/types' {
  interface GlobalProps {
    // The example id selected by the docs host (`<lynx-view global-props>`).
    example?: string
  }
}

declare module '@iconify-json/*/icons.json' {
  import type { IconifyJSON } from '@iconify/types'
  const data: IconifyJSON
  export default data
}

export {}
