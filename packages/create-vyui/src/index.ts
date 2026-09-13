import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HELP = `create-vyui — scaffold a Vue-Lynx + Vy UI app

Usage
  npm create vyui@latest [dir] [options]

Arguments
  [dir]                Target directory (default my-vyui-app)

Options
  --pm <name>          Package manager (pnpm, yarn, bun, npm)
  --skip-install       Scaffold files without installing dependencies
  -y, --yes            Accept defaults / skip prompts
  -h, --help           Show this help
`

type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm'

function templateDir(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [resolve(here, '../template'), resolve(here, '../../template')]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'package.json'))) return dir
  }
  throw new Error('create-vyui template not found next to the built CLI')
}

function detectPm(cwd: string): PackageManager {
  const ua = process.env.npm_config_user_agent ?? ''
  if (ua.startsWith('pnpm')) return 'pnpm'
  if (ua.startsWith('yarn')) return 'yarn'
  if (ua.startsWith('bun')) return 'bun'
  let dir = cwd
  for (;;) {
    if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm'
    if (existsSync(join(dir, 'yarn.lock'))) return 'yarn'
    if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun'
    if (existsSync(join(dir, 'package-lock.json'))) return 'npm'
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return 'npm'
}

function isDirEmpty(dir: string): boolean {
  if (!existsSync(dir)) return true
  return readdirSync(dir).filter(name => name !== '.DS_Store').length === 0
}

function validName(name: string): boolean {
  return /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)
}

async function prompt(question: string, fallback: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const ans = (await rl.question(`? ${question} (${fallback}) `)).trim()
    return ans || fallback
  }
  finally {
    rl.close()
  }
}

async function confirm(question: string, fallback = true): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const ans = (await rl.question(`? ${question} ${fallback ? '(Y/n)' : '(y/N)'} `)).trim().toLowerCase()
    if (!ans) return fallback
    return ans === 'y' || ans === 'yes'
  }
  finally {
    rl.close()
  }
}

function install(pm: PackageManager, cwd: string): Promise<void> {
  const command = process.platform === 'win32' ? `${pm}.cmd` : pm
  const args = pm === 'yarn' ? [] : ['install']
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' })
    child.on('error', reject)
    child.on('close', code => (code === 0 ? resolvePromise() : reject(new Error(`${pm} install exited with ${code}`))))
  })
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      pm: { type: 'string' },
      'skip-install': { type: 'boolean' },
      yes: { type: 'boolean', short: 'y' },
      help: { type: 'boolean', short: 'h' },
    },
  })

  if (values.help) {
    console.log(HELP)
    return
  }

  let target = positionals[0] ?? 'my-vyui-app'
  const yes = values.yes ?? false
  const skipInstall = values['skip-install'] ?? false
  const pmOpt = values.pm as string | undefined
  if (pmOpt && !['pnpm', 'yarn', 'bun', 'npm'].includes(pmOpt)) {
    console.error(`Unknown --pm: ${pmOpt} (expected pnpm, yarn, bun, or npm)`)
    process.exitCode = 1
    return
  }

  if (!yes && !positionals[0] && process.stdin.isTTY) {
    target = await prompt('App directory', target)
  }
  const name = target.split('/').filter(Boolean).pop() ?? target
  if (!validName(name)) {
    console.error(`Invalid app name: ${name} (use a valid npm package name)`)
    process.exitCode = 1
    return
  }

  const cwd = resolve(process.cwd(), target)
  if (!isDirEmpty(cwd)) {
    if (!yes && process.stdin.isTTY) {
      const overwrite = await confirm(`${target} is not empty. Scaffold into it anyway?`, false)
      if (!overwrite) return
    }
    else if (!yes) {
      console.error(`${target} is not empty. Re-run with -y to scaffold anyway.`)
      process.exitCode = 1
      return
    }
  }

  const pm = (pmOpt as PackageManager | undefined) ?? detectPm(process.cwd())
  mkdirSync(cwd, { recursive: true })
  cpSync(templateDir(), cwd, { recursive: true, filter: src => !src.endsWith('.DS_Store') })

  const pkgPath = join(cwd, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
  pkg['name'] = name
  if (pm === 'pnpm') pkg['packageManager'] = 'pnpm@11.4.0'
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

  console.log(`✔ Scaffolded ${name} in ${cwd}`)

  if (!skipInstall) {
    console.log(`│ Installing dependencies with ${pm}…`)
    await install(pm, cwd)
  }

  const run = pm === 'npm' ? 'npm run' : pm
  console.log(`\nNext steps:\n  cd ${target}${skipInstall ? `\n  ${pm === 'npm' ? 'npm install' : `${pm} install`}` : ''}\n  ${run} dev\n\nScan the QR with Lynx Go for on-device preview, or open the main.web.bundle URL for web.`)
}

const isEntry = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href
if (isEntry) {
  main().catch((err) => {
    console.error(`✖ ${err instanceof Error ? err.message : String(err)}`)
    process.exitCode = 1
  })
}

export { isDirEmpty, validName }
