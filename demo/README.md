# Styles preview

A static, browser-openable comparison of the `default` and `shadcn` registry
styles. **Open [`index.html`](./index.html) in any browser** — no Lynx runtime
or build needed.

Both columns render the *same* component class strings; each is scoped to its
style's tokens (CSS vars + `--ui-radius`) and built with the real
[`@vyui/kit` Tailwind preset](../packages/kit/src/tailwind.js), so the radius
scaling, `border-2`→1px mapping, and color resolution match what the actual
components render on device. It shows:

- the **default button** per style (`primary`/green vs the baked
  `appConfig.ui.button` → `neutral`/dark shadcn default),
- button variants (solid/outline/soft/ghost) with `primary` = green vs zinc,
- a bordered card + accordion rows showing the radius difference (0.25 ↔ 0.5rem).

## Regenerate

`styles.css` is prebuilt and committed so the page works on open. To rebuild
after editing `index.html` / `input.css`:

```bash
pnpm --filter @vyui/kit-demo exec tailwindcss \
  -c "$PWD/tailwind.config.mjs" -i "$PWD/input.css" -o "$PWD/styles.css" --minify
```

> This is a faithful *theme* preview, not the real Lynx components — structure
> (`<view>`/`<text>`, flex defaults) is approximated with HTML. For the real
> thing, scaffold a project with `vyui init --style shadcn` and run it on device.
