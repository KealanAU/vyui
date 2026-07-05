---
"@vyui/kit": patch
---

**Breaking:** components are now exported under a single canonical `Vy*` name only. The bare aliases (`Button`, `Card`, `Icon`, `AspectRatio`, …) have been removed so there is one name per component — the same one the `VyUI` plugin registers globally. Update imports from `import { Button } from '@vyui/kit'` to `import { VyButton } from '@vyui/kit'`. The unprefixed `Icon`/`AspectRatio` primitives remain available from `@vyui/core`.
