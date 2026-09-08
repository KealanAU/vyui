---
"@vyui/core": patch
---

Fix FeedList pull-to-refresh never arming: the rubber-band was given the trigger threshold as its band width, so the painted offset saturated at exactly the threshold and `release to refresh` was only reachable on a knife-edge 2x-threshold drag. The band is now 2x the threshold, so a pull of `refreshThreshold` px arms the release.
