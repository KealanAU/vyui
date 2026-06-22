import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { join } from 'node:path'

// ── tiny ANSI colors (zero-dep) ───────────────────────────────────────────────
const wrap = (code: number) => (s: string) => `\x1b[${code}m${s}\x1b[0m`
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

/** Detect the package manager from a lockfile, walking up from `cwd`. */
export function detectPackageManager(cwd: string): 'pnpm' | 'yarn' | 'bun' | 'npm' {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun'
  return 'npm'
}

/** Install npm packages with the detected package manager. */
export function installDeps(pm: string, deps: string[], cwd: string): Promise<void> {
  const args = pm === 'npm' ? ['install', ...deps] : ['add', ...deps]
  return new Promise((resolvePromise, reject) => {
    const child = spawn(pm, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
    child.on('error', reject)
    child.on('close', code => (code === 0 ? resolvePromise() : reject(new Error(`${pm} ${args[0]} exited with ${code}`))))
  })
}
