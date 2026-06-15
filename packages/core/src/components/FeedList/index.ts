// vyui original component — not part of reka-ui. Generic virtualized list
// backed by Lynx's native `<list>` element with load-more on scroll-to-lower.
// Pull-to-refresh is intentionally not implemented — see FeedList.vue /
// REFRESH-PHYSICS.md for why (native `<refresh>` is unused upstream and absent
// from the OSS runtime).
export {
  default as FeedList,
  type FeedListEmits,
  type FeedListProps,
} from './FeedList.vue'
