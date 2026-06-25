import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectProject } from './project-info.js'

describe('detectProject', () => {
  it('detects a standard Vue-Lynx project', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vyui-project-'))
    mkdirSync(join(cwd, 'src'))
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { 'vue-lynx': '^0.4.0' } }))
    writeFileSync(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }))
    writeFileSync(join(cwd, 'tailwind.config.ts'), 'export default {}')
    writeFileSync(join(cwd, 'src/index.css'), '@tailwind utilities;')
    writeFileSync(join(cwd, 'src/index.ts'), `import { createApp } from 'vue-lynx'\nimport './index.css'\ncreateApp({})\n`)

    expect(detectProject(cwd)).toMatchObject({
      appEntry: 'src/index.ts',
      tailwindConfig: 'tailwind.config.ts',
      css: 'src/index.css',
      isVueLynx: true,
      alias: { prefix: '@', srcDir: 'src' },
    })
  })
})
