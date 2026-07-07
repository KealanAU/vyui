---
"@vyui/core": patch
"@vyui/kit": patch
---

Sortable rows no longer drag list chrome along with the finger. The kit theme now renders each row as a transparent shell (the element core transforms) around a new `itemContent` pill slot, so only the pill visibly moves — the old `border-b` divider look is gone. `SortableItem` flips a `ui-dragging` class (+ `data-state="dragging"`) on the lifted row, and `VYUI_UI_STATES` gains `dragging` so themes can restyle the lifted pill (default: stronger pill border via `group-ui-dragging:`).
