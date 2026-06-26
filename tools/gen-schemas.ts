/**
 * Generates the JSON Schemas published at vyui.dev and referenced by the
 * `$schema` keys the CLI and registry emit:
 *
 *   apps/docs/public/schema.json           ← vyui.config.json   (VyuiConfig)
 *   apps/docs/public/registry-index.json   ← <style>/index.json (RegistryIndex)
 *   apps/docs/public/registry-styles.json  ← styles.json        (RegistryStyles)
 *
 * These are derived (not hand-maintained): the alias categories come from the
 * CLI's `ALIAS_CATEGORIES`, so adding a category flows into the config schema
 * automatically, and a drift test (`packages/cli/src/schemas.test.ts`) fails if
 * a committed file diverges from this generator. Run standalone via
 * `pnpm gen:schemas`; also invoked at the end of `pnpm gen:registry`.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ALIAS_CATEGORIES } from '../packages/cli/src/config.js'

const BASE = 'https://vyui.dev'
const DRAFT = 'https://json-schema.org/draft/2020-12/schema'
/** Kebab-case identifier (component + style names). */
const KEBAB = '^[a-z0-9]+(?:-[a-z0-9]+)*$'

const nonEmptyString = { type: 'string', minLength: 1 } as const
const optionalSchemaRef = { type: 'string' } as const

/** Shared `aliases` / `paths` shape — one non-empty string per alias category. */
function categories() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [...ALIAS_CATEGORIES],
    properties: Object.fromEntries(ALIAS_CATEGORIES.map(key => [key, nonEmptyString])),
  }
}

/** Schema for `vyui.config.json` — mirrors `VyuiConfig`. */
export function buildConfigSchema() {
  return {
    $schema: DRAFT,
    $id: `${BASE}/schema.json`,
    title: 'vyui.config.json',
    type: 'object',
    additionalProperties: false,
    required: ['registry', 'style', 'baseColor', 'aliases', 'paths', 'tailwind'],
    properties: {
      $schema: optionalSchemaRef,
      registry: nonEmptyString,
      style: nonEmptyString,
      baseColor: nonEmptyString,
      aliases: { $ref: '#/$defs/categories' },
      paths: { $ref: '#/$defs/categories' },
      tailwind: {
        type: 'object',
        additionalProperties: false,
        required: ['config', 'css'],
        properties: { config: nonEmptyString, css: nonEmptyString },
      },
    },
    $defs: { categories: categories() },
  }
}

/** Schema for a style's `index.json` — mirrors `RegistryIndex`. */
export function buildRegistryIndexSchema() {
  return {
    $schema: DRAFT,
    $id: `${BASE}/registry-index.json`,
    title: 'vyui registry index',
    type: 'object',
    additionalProperties: false,
    required: ['registry', 'style', 'components'],
    properties: {
      $schema: optionalSchemaRef,
      registry: nonEmptyString,
      style: nonEmptyString,
      components: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'type', 'dependencies', 'registryDependencies'],
          properties: {
            name: { type: 'string', pattern: KEBAB },
            type: { const: 'registry:ui' },
            dependencies: { $ref: '#/$defs/stringArray' },
            registryDependencies: { $ref: '#/$defs/stringArray' },
          },
        },
      },
    },
    $defs: {
      stringArray: { type: 'array', items: nonEmptyString, uniqueItems: true },
    },
  }
}

/** Schema for the registry root `styles.json` — mirrors `RegistryStyles`. */
export function buildRegistryStylesSchema() {
  return {
    $schema: DRAFT,
    $id: `${BASE}/registry-styles.json`,
    title: 'vyui registry styles',
    type: 'object',
    additionalProperties: false,
    required: ['registry', 'default', 'styles'],
    properties: {
      $schema: optionalSchemaRef,
      registry: nonEmptyString,
      default: nonEmptyString,
      styles: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: { type: 'string', pattern: KEBAB },
      },
    },
  }
}

/** Published filename → builder. */
export const SCHEMAS: Record<string, () => object> = {
  'schema.json': buildConfigSchema,
  'registry-index.json': buildRegistryIndexSchema,
  'registry-styles.json': buildRegistryStylesSchema,
}

/** Canonical on-disk form: pretty JSON + trailing newline (repo convention). */
export function serializeSchema(build: () => object): string {
  return `${JSON.stringify(build(), null, 2)}\n`
}

/** Write all schemas into a docs `public/` directory. */
export function writeSchemas(publicDir: string): void {
  for (const [file, build] of Object.entries(SCHEMAS)) {
    writeFileSync(join(publicDir, file), serializeSchema(build))
  }
  console.log(`[gen-schemas] wrote ${Object.keys(SCHEMAS).join(', ')}  →  ${publicDir}`)
}

// Run directly (`tsx tools/gen-schemas.ts`) — but stay a no-op side effect when
// imported (gen-registry, tests), since `argv[1]` is the importer then.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/docs/public')
  writeSchemas(publicDir)
}
