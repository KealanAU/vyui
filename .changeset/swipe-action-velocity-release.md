---
"@vyui/core": patch
---

SwipeAction: velocity-aware release.

A quick flick now opens/commits even on a short drag, while a slow drag respects
the position threshold. The in-flight snap animation is cancelled on touchstart
so a follow-up drag isn't masked by a `fill: 'forwards'` animation. Public
props/emits/slots are unchanged.
