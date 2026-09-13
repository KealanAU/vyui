import type { VyUIPluginOptions } from '@vyui/kit'

// Single-source config: imported by `tailwind.config.ts` (class generation)
// and `src/index.ts` (runtime selection). Keep both in sync by editing here.
export default {
  ui: {
    primary: 'green',
    gray: 'slate',
  },
} satisfies VyUIPluginOptions
