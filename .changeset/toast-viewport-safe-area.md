---
"@vyui/core": patch
---

Toast viewport now pads its docked edge by the container safe-area insets (via `useSafeArea`), so bottom toasts clear the iPhone home indicator and top toasts clear the notch — the same insets the Sheet panels already honor.
