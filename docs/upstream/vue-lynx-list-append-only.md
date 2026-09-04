# vue-lynx's `<list>` bridge is append-only

`<list>` children under vue-lynx 0.5.1 (and 0.4.x) can only ever grow at the
tail. Removing a `<list-item>` — or inserting one before an existing sibling —
never reaches the native list, so a list that shrinks keeps ghost rows and the
next append fails with:

```
Error for duplicated list item-key. Last diff result is DiffResult:
item_keys:[1,…,50,__vyui_feed_footer__,], insertions:[40,…,49], removals:[],
Current diff result is DiffResult:
item_keys:[1,…,50,__vyui_feed_footer__,21,…,30,], insertions:[51,…,60], removals:[],
```

(vyui repro: kit-demo's FeedList tab — load to 50 items, hit "Reset feed". The
reset shrinks to 20 rows and drops the footer; native sees neither, then the
follow-up load-more re-inserts keys 21–30 that it thinks are still there.)

## Cause

`main-thread/dist/list-apply.js`:

- `insertListItem(parentId, child, childId)` **pushes**; the `anchorId` the
  `INSERT` op carries is dropped on the floor for list parents.
- `flushListUpdates()` only reports items past a `listItemsReported` **count**,
  and hardcodes `removeAction: []` / `updateAction: []`.
- `ops-apply.js`'s `REMOVE` case calls `__RemoveElement(parent, child)` for list
  children — the list's own data source (`listItems`) is never touched, so the
  row survives in the native diff.

The `update-list-info` protocol supports all three actions; `@lynx-js/react`
implements them in `runtime/lib/listUpdateInfo.js`
(`ListUpdateInfoRecording.__toAttribute`): `removeAction` holds indices into the
**old** child list, insertion `position` is the index in the **new** one.

## Local fix

`patches/vue-lynx@0.5.1.patch` extends `list-apply.js` / `ops-apply.js` to that
contract: the anchor is honoured, `removeListItem` shrinks the array on
`REMOVE`, and `flushListUpdates` diffs the reported key order against the
current one. Pure reorders (same keys, new order) still emit nothing — the
native list does not reorder, which is why FeedList documents "replace the keys
rather than permuting existing ones".

Re-port on any vue-lynx bump; drop it if upstream ships a real list diff.

## Consumers are still on the unpatched runtime

The patch only covers this repo (dev app, docs, CI). Anyone installing
`@vyui/core` gets stock vue-lynx, so a `VyFeedList` whose `items` shrink
(refresh, filter, delete-a-row) hits the same error until upstream fixes it or
they apply the same patch.
