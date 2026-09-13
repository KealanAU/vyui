import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'

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

const PMS = ['pnpm', 'yarn', 'bun', 'npm']
const TEMPLATE = fileURLToPath(new URL('../template', import.meta.url))

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    return (await rl.question(`? ${question} `)).trim()
  }
  finally {
    rl.close()
  }
}

function install(pm: string, cwd: string): Promise<void> {
  return new Promise((done, fail) => {
    // Windows shims are .cmd files, which Node refuses to spawn without a shell.
    const child = spawn(pm, ['install'], { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
    child.on('error', fail)
    child.on('close', code => (code === 0 ? done() : fail(new Error(`${pm} install exited with ${code}`))))
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

  const interactive = !values.yes && process.stdin.isTTY
  const pm = values.pm ?? PMS.find(p => process.env.npm_config_user_agent?.startsWith(p)) ?? 'npm'
  if (!PMS.includes(pm)) throw new Error(`Unknown --pm: ${pm} (expected ${PMS.join(', ')})`)

  let target = positionals[0] ?? 'my-vyui-app'
  if (interactive && !positionals[0]) target = (await ask(`App directory (${target})`)) || target

  const cwd = resolve(target)
  const name = basename(cwd)
  if (!/^[a-z0-9-~][a-z0-9-._~]*$/.test(name)) throw new Error(`Invalid app name: ${name} (use a valid npm package name)`)

  if (existsSync(cwd) && readdirSync(cwd).some(f => f !== '.DS_Store')) {
    if (!interactive && !values.yes) throw new Error(`${target} is not empty. Re-run with -y to scaffold anyway.`)
    if (interactive && !/^y(es)?$/i.test(await ask(`${target} is not empty. Scaffold into it anyway? (y/N)`))) return
  }

  cpSync(TEMPLATE, cwd, { recursive: true })
  // npm publish strips .gitignore files, so the template ships it renamed.
  renameSync(join(cwd, '_gitignore'), join(cwd, '.gitignore'))

  const pkgPath = join(cwd, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  pkg.name = name
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

  console.log(`✔ Scaffolded ${name} in ${cwd}`)
  if (!values['skip-install']) {
    console.log(`│ Installing dependencies with ${pm}…`)
    await install(pm, cwd)
  }

  const steps = [`cd ${target}`, values['skip-install'] && `${pm} install`, `${pm} run dev`].filter(Boolean)
  console.log(`\nNext steps:\n  ${steps.join('\n  ')}\n\nScan the QR with Lynx Go for on-device preview, or open the main.web.bundle URL for web.`)
}

main().catch((err) => {
  console.error(`✖ ${err instanceof Error ? err.message : String(err)}`)
  process.exitCode = 1
})
