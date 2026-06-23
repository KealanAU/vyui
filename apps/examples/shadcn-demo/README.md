# @vyui/shadcn-demo

A runnable Vue-Lynx app showing real `@vyui/kit` components under the **shadcn
style** — the same tokens + plugin override that `vyui init --style shadcn`
produces, applied here directly so you can run and iterate on the look.

```sh
pnpm --filter @vyui/shadcn-demo dev
```

Scan the LAN QR with [Lynx Explorer](https://lynxjs.org/) for an on-device
preview, or open the printed `main.web.bundle` URL for the web preview.

## How the style is applied

- **`src/index.css`** — shadcn design tokens (mirrors `styles/shadcn/style.css`):
  `primary` → zinc, `--ui-radius: 0.5rem`, neutral → slate.
- **`src/index.ts`** — bakes the runtime override into the plugin, exactly like
  the generated shadcn plugin:
  ```ts
  app.use(VyUI, { ui: { primary: 'zinc', button: { defaultVariants: { color: 'neutral' } } } })
  ```

Edit those two files to iterate. Compare against `apps/examples/kit-demo` (the
`default` style) to see the difference. For a no-Lynx visual comparison, see
[`demo/`](../../../demo) (`demo/index.html` opens in a browser).
