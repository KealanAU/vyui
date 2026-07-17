---
"@vyui/core": patch
---

Remove two unused shared exports that had no consumers. `useStateMachine` (`<Presence>` ships its own 1:1-ported state machine and never used it) is dropped from the public `@vyui/core` entry; `useForwardRef` (superseded by `useForwardExpose`) is dropped from the `@vyui/core/shared` entry.
