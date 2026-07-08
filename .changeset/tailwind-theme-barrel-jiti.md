---
"@vyui/kit": patch
---

Fix tailwind preset failing to load from source under jiti (`Cannot find module './theme/index.js'`) — import the theme barrel with an explicit `.ts` extension; Vite still emits `./theme/index.js` in dist.
