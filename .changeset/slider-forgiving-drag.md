---
"@vyui/core": patch
"@vyui/kit": patch
---

Make the Slider drag far more forgiving. The control now carries `hit-slop` and claims every slide angle, so a press no longer has to land inside the track's own thickness and an ancestor `<scroll-view>` no longer steals the gesture when the finger drifts off-axis. On Lynx web — which re-targets pointer events by position — a viewport-sized shield is raised for the length of a mouse drag, so the cursor can leave the control without stranding it. The kit theme pads the slider on its cross axis to give the thumb a finger-sized target.
