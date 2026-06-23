// Standalone Tailwind config for the static styles preview (demo/index.html).
// Uses the real @vyui/kit preset so radius/border/color scales match what the
// components actually render; the per-style CSS-var tokens live in input.css.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vyuiPreset from '../packages/kit/src/tailwind.js'

// Absolute so the content glob resolves regardless of the CWD the Tailwind CLI
// is invoked from (e.g. via `pnpm --filter`, which changes directory).
const here = dirname(fileURLToPath(import.meta.url))

export default {
  presets: [vyuiPreset],
  content: [join(here, 'index.html')],
}
