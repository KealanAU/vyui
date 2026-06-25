import { describe, expect, it } from 'vitest'
import type { RegistryFile } from './registry-schema.js'
import { defaultConfig } from './config.js'
import { rewriteImports } from './rewrite-imports.js'

describe('rewriteImports', () => {
  it('rewrites every generated placeholder category', () => {
    const config = defaultConfig('/registry', 'default', 'src', '~', 'slate')
    const file: RegistryFile = {
      path: 'components/Test.vue',
      target: 'Test.vue',
      type: 'registry:ui',
      content: [
        `import A from '@@vyui:components/A.vue'`,
        `import theme from '@@vyui:theme/test'`,
        `import { useX } from '@@vyui:composables/useX'`,
        `import { x } from '@@vyui:utils/x'`,
        `import type { X } from '@@vyui:lib/types'`,
        `import { ref } from 'vue'`,
      ].join('\n'),
    }

    expect(rewriteImports(file, config)).toBe([
      `import A from '~/components/vyui/A.vue'`,
      `import theme from '~/lib/vyui/theme/test'`,
      `import { useX } from '~/lib/vyui/composables/useX'`,
      `import { x } from '~/lib/vyui/utils/x'`,
      `import type { X } from '~/lib/vyui/types'`,
      `import { ref } from 'vue'`,
    ].join('\n'))
  })
})
