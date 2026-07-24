---
'@vyui/kit': patch
---

Fix the default (`md`) Slider thumb rendering 0×0. Its size was `size-4.5`, and
Tailwind v3's spacing scale has no 4.5 step, so the class compiled to no CSS —
safelisted, no build warning. It is now `size-[18px]`, and the preset test suite
fails on any theme class using a fractional spacing step v3 cannot generate.
