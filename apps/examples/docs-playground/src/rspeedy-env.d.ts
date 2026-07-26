/// <reference types="@lynx-js/rspeedy/client" />

declare module '@lynx-js/types' {
  interface GlobalProps {
    // The example id selected by the docs host (`<lynx-view global-props>`).
    example?: string
    // Set when the host page is itself on a phone, so the frame is fluid and
    // narrower than the 360px it gets on desktop.
    compact?: boolean
  }
}

declare module '@iconify-json/*/icons.json' {
  import type { IconifyJSON } from '@iconify/types'
  const data: IconifyJSON
  export default data
}

export {}
