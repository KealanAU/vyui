// Issue #10 regression guard. Asserts the emitted declarations carry no DOM
// global types so Lynx-native consumers (no DOM lib) can `tsc` against us.
//
// Requires `dist/` to exist. CI runs `pnpm build` before `pnpm test`; locally
// the test builds types on demand if `dist/` is missing so the guard never
// silently no-ops.

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { scanForDomLeaks } from './scan-dts'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const distDir = resolve(packageRoot, 'dist')

describe('emitted .d.ts (issue #10)', () => {
  it('contains no DOM global types', () => {
    if (!existsSync(distDir)) {
      // Build once so the guard runs even on a cold checkout.
      execSync('pnpm build-types', { cwd: packageRoot, stdio: 'inherit' })
    }

    const leaks = scanForDomLeaks(distDir)
    const report = leaks
      .map(l => `  ${l.file.replace(`${packageRoot}/`, '')}: /${l.token}/ ×${l.count}`)
      .join('\n')

    expect(
      leaks,
      `DOM types leaked into emitted .d.ts (Lynx consumers have no DOM lib):\n${report}`,
    ).toEqual([])
  })
})
