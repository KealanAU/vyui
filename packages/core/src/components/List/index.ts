// Bare-bones wrapper around Lynx's native `<list>` element. Pair with
// `ListItem` (which keeps `item-key` kebab-cased for `<list>`'s diff). For
// pull-to-refresh + load-more, reach for `FeedList` instead.
export {
  default as List,
  type ListEmits,
  type ListProps,
  type ScrollToOptions,
} from './List.vue'

export {
  default as ListItem,
  type ListItemProps,
} from './Item.vue'
