/// <reference types="@lynx-js/rspeedy/client" />

declare module '@lynx-js/types' {
  interface GlobalProps {}
}

declare module '@iconify-json/*/icons.json' {
  import type { IconifyJSON } from '@iconify/types'
  const data: IconifyJSON
  export default data
}

export {}
