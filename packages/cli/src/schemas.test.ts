import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SCHEMAS, serializeSchema } from '../../../tools/gen-schemas.js'

const publicDir = join(fileURLToPath(new URL('../../../', import.meta.url)), 'apps/docs/public')

describe('published JSON schemas', () => {
  // Guards against hand-edits / forgetting to run `pnpm gen:schemas`: each
  // committed file must byte-match what the generator produces from the types.
  it.each(Object.entries(SCHEMAS))('%s is up to date with the generator', (file, build) => {
    expect(readFileSync(join(publicDir, file), 'utf8')).toBe(serializeSchema(build))
  })
})
