// vyui original component — not part of reka-ui. Generic virtualized list
// backed by Lynx's native `<list>` element with a custom rubber-band
// pull-to-refresh (driven by `:main-thread-bindtouch*` worklets, gated to the
// top edge) + load-more on scroll-to-lower. See FeedList.vue and
// REFRESH-PHYSICS.md.
export {
  default as FeedList,
  type FeedListEmits,
  type FeedListProps,
  type FeedListRefreshState,
} from './FeedList.vue'
