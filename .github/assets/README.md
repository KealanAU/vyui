# Brand assets

The "Vy" mark derives from `apps/docs/public/favicon.svg`; accents use the
demo apps' sky/slate palette on the brand near-black (`#17191c`).

| File | Use |
| --- | --- |
| `logo.svg` / `logo-white.svg` | Standalone mark, light / dark backgrounds |
| `avatar.svg` → `avatar.png` (512×512) | GitHub profile / org avatar upload |
| `social-preview.svg` → `social-preview.png` (1280×640) | Repo social preview |

## Manual upload steps (no API exists for either)

- **Social preview** — repo **Settings → General → Social preview** → upload
  `social-preview.png`. Becomes the Open Graph card for repo *and release*
  links shared on Slack/X/Discord/LinkedIn.
- **Avatar** — repos have no avatar of their own; trending/lists show the
  owner's. Upload `avatar.png` as the user/org profile picture if the "Vy"
  tile should appear there.

## Regenerating PNGs from the SVGs (macOS)

```sh
cd .github/assets
qlmanage -t -s 512 -o . avatar.svg && mv avatar.svg.png avatar.png
qlmanage -t -s 1280 -o . social-preview.svg && mv social-preview.svg.png social-preview.png
sips -c 640 1280 social-preview.png   # qlmanage pads to square; crop the band
```

The SVGs use `<text>` with the system font stack (matching the favicon), so
rasterize on macOS for the SF-rendered glyphs; generic SVG converters without
those fonts will drift.
