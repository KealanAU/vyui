---
title: Lynx-native a11y & shared gestures
description: Accessibility now resolves through Lynx-native APIs, and gesture physics moves into one shared engine.
date: 2026-05-30
package: core
version: v0.0.3
---

Accessibility is wired through Lynx-native APIs instead of DOM assumptions, and the Swiper's gesture physics is extracted into a shared engine behind `useDragGesture` with a generic `pickSnap` helper — ready to power any swipe-driven primitive.
