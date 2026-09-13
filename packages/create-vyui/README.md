# create-vyui

Scaffold a Vue-Lynx + Vy UI app with the full wiring done, so `npm install
@vyui/kit` isn't a multi-step manual setup:

- `lynx.config.ts` — `includeWorkletPackages` for `@vyui/*` worklets, Tailwind
  `exclude` that lets kit classes through, QR plugin + both `lynx`/`web` envs
- `tailwind.config.ts` — Lynx preset + `createVyuiPreset()` + `VYUI_UI_STATES`
- `src/index.css` — Tailwind entry importing `@vyui/kit/style.css` tokens
- `src/index.ts` — `installIntlPolyfill` + `registerIconSet` + `provideVyUI`
- `src/App.vue` — `ToastProvider` + `OverlayRoot` hosts with a demo screen

## Usage

```bash
npm create vyui@latest my-app
cd my-app
npm run dev
```

Scan the printed QR with [Lynx Go](https://vyui.dev) for on-device preview, or
open the `main.web.bundle` URL for the web preview.

Options:

| Flag | Description |
| --- | --- |
| `<dir>` | Target directory (default `my-vyui-app`) |
| `--pm <name>` | Package manager (`pnpm`, `yarn`, `bun`, `npm`) |
| `--skip-install` | Scaffold files without installing dependencies |
| `-y, --yes` | Accept defaults / skip prompts |
| `-h, --help` | Show help |
