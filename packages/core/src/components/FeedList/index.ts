// vyui original component — not part of reka-ui. Generic virtualized list
// backed by Lynx's native `<list>` element with pull-to-refresh + load-more.
// PTR works by wrapping the `<list>` in a `<refresh>` element (placing
// `<refresh-header>` directly inside `<list>` crashes iOS on create-UI).
export {
  default as FeedList,
  type FeedListEmits,
  type FeedListProps,
} from './FeedList.vue'
