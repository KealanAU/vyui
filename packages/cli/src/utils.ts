import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { dirname, join } from 'node:path'

// ── tiny ANSI colors (zero-dep) ───────────────────────────────────────────────
// Honor NO_COLOR / FORCE_COLOR and skip ANSI on non-TTY (piped/CI) output so we
// don't corrupt logs. Computed once at module load.
const colorEnabled = (() => {
  if (process.env.FORCE_COLOR) return true
  if (process.env.NO_COLOR) return false
  return Boolean(process.stdout.isTTY)
})()
const wrap = (code: number) => (s: string) => (colorEnabled ? `\x1b[${code}m${s}\x1b[0m` : s)
export const c = {
  bold: wrap(1),
  dim: wrap(2),
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  cyan: wrap(36),
  gray: wrap(90),
}

export const log = {
  info: (m: string) => console.log(`${c.cyan('ℹ')} ${m}`),
  ok: (m: string) => console.log(`${c.green('✔')} ${m}`),
  warn: (m: string) => console.log(`${c.yellow('⚠')} ${m}`),
  err: (m: string) => console.error(`${c.red('✖')} ${m}`),
  step: (m: string) => console.log(`${c.gray('│')} ${m}`),
}

export async function confirm(question: string, fallback = true): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const ans = (await rl.question(`${c.cyan('?')} ${question} ${c.dim(fallback ? '(Y/n)' : '(y/N)')} `)).trim().toLowerCase()
    if (!ans) return fallback
    return ans === 'y' || ans === 'yes'
  }
  finally {
    rl.close()
  }
}

export async function prompt(question: string, fallback: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const ans = (await rl.question(`${c.cyan('?')} ${question} ${c.dim(`(${fallback})`)} `)).trim()
    return ans || fallback
  }
  finally {
    rl.close()
  }
}

type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm'

/** Map a corepack/`packageManager` field value (`pnpm@9.0.0`) to a known PM. */
function pmFromField(value: unknown): PackageManager | undefined {
  if (typeof value !== 'string') return undefined
  const name = value.split('@')[0]
  if (name === 'pnpm' || name === 'yarn' || name === 'bun' || name === 'npm') return name
  return undefined
}

/**
 * Detect the package manager by walking UP from `cwd` through ancestor
 * directories until a lockfile (or a `package.json` with a `packageManager`
 * corepack hint) is found. In a monorepo the lockfile lives at the workspace
 * root, not the package cwd. Falls back to `npm` at the filesystem root.
 */
export function detectPackageManager(cwd: string): PackageManager {
  let dir = cwd
  for (;;) {
    if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm'
    if (existsSync(join(dir, 'yarn.lock'))) return 'yarn'
    if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun'
    if (existsSync(join(dir, 'package-lock.json'))) return 'npm'

    // Corepack hint in package.json when no lockfile is present.
    const pkgPath = join(dir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { packageManager?: string }
        const pm = pmFromField(pkg.packageManager)
        if (pm) return pm
      }
      catch {
        // ignore unreadable/invalid package.json and keep walking up
      }
    }

    const parent = dirname(dir)
    if (parent === dir) break // reached filesystem root
    dir = parent
  }
  return 'npm'
}

/** Install npm packages with the detected package manager. */
export function installDeps(pm: string, deps: string[], cwd: string): Promise<void> {
  const args = pm === 'npm' ? ['install', ...deps] : ['add', ...deps]
  const command = process.platform === 'win32' ? `${pm}.cmd` : pm
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('close', code => (code === 0 ? resolvePromise() : reject(new Error(`${pm} ${args[0]} exited with ${code}`))))
  })
}
