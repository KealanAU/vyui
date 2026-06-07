# Data attributes

Vy UI components expose two families of `data-*` attributes. Both are part of the
public surface — you can target them from styles and rely on them in tests.

- **State attributes** (`data-state`, `data-disabled`, …) — reactive; reflect the
  current state of a component. Use them to style by state.
- **Structural markers** (`data-vyui-*`) — static; tag a specific element inside a
  component so it can be selected without a wrapper or extra ref.

Because Vy UI follows the shadcn-style "own your components" model, these names are
a convention, not a hard contract: if you vendor a component into your app you can
rename or remove them. The tables below are the canonical defaults so you know what
ships and what's safe to target.

## State attributes (reactive)

Applied by the primitives and flipped as state changes. Style on them directly,
e.g. `[data-state="open"]` / `[data-disabled]`.

| Attribute | Values | Where |
| --- | --- | --- |
| `data-state` | `open` / `closed`, `checked` / `unchecked`, `active` / `inactive`, `on` / `off` (component-dependent) | Accordion, Button, Checkbox, Collapsible, Combobox, Dialog, DropdownMenu, Popover, Progress, RadioGroup, Rating, Select, Sheet, Stepper, Switch, Tabs, Toast, Toggle, Navigation |
| `data-disabled` | present when disabled | All interactive components |
| `data-orientation` | `horizontal` / `vertical` | Accordion, RadioGroup, Rating, Separator, Slider, Stepper, Tabs |
| `data-readonly` | present when read-only | Input, Textarea, NumberField |
| `data-highlighted` | present when highlighted | Combobox item |
| `data-selected` | present on the selected page | Pagination |
| `data-value` / `data-max` | numeric | Progress, DropdownMenu item |
| `data-complete` | present when all cells filled | PinInput |
| `data-type` | component-specific kind | Toast, Pagination |
| `data-busy` | present during a transition | Dialog trigger / close |
| `data-submitting` | present while submitting | Form submit button |
| `data-linear` | present in linear mode | Stepper |
| `data-front` / `data-expanded` / `data-position` | stack/layout state | Toast |

> The state-attribute set per component mirrors Reka UI / Radix conventions. When
> in doubt, inspect the rendered output or the component's `.vue` source.

## Structural markers (`data-vyui-*`)

Static hooks that mark a known element inside a component. They are namespaced under
`data-vyui-` so they don't collide with your own attributes and are easy to find and
override. Each is the stable selector for that element.

| Marker | Component | Marks |
| --- | --- | --- |
| `data-vyui-aspect-ratio` | AspectRatio | root |
| `data-vyui-collection-item` | Accordion, and any `Collection` consumer | each registered item |
| `data-vyui-combobox-item` | Combobox | each item |
| `data-vyui-combobox-group` | Combobox | each group |
| `data-vyui-combobox-empty` | Combobox | empty-state node |
| `data-vyui-draggable` | Draggable | root |
| `data-vyui-feed-list` | FeedList | the `<list>` |
| `data-vyui-feed-list-empty` | FeedList | empty-state node |
| `data-vyui-list` | List | the `<list>` |
| `data-vyui-list-item` | List | each item |
| `data-vyui-scroll-view` | ScrollView | the `<scroll-view>` |
| `data-vyui-sheet-backdrop` | Sheet | backdrop |
| `data-vyui-sheet-content` | Sheet | content surface |
| `data-vyui-sheet-handle` | Sheet | drag handle |
| `data-vyui-sheet-view` | Sheet | view container |
| `data-vyui-slider-impl` | Slider | the track implementation node |
| `data-vyui-sortable-root` | Sortable | root |
| `data-vyui-sortable-item` | Sortable | each item |
| `data-vyui-swipe-action` | SwipeAction | root |
| `data-vyui-swiper-root` | Swiper | root |
| `data-vyui-swiper-item` | Swiper | each item |

### Changing a marker

A marker is just a string. Where it's applied inline in a `.vue` template, edit the
attribute on that element. The one exception is the collection marker, which is a
shared constant so `Collection` and its consumers (e.g. Accordion) stay in sync:

```ts
// packages/core/src/components/Collection/Collection.ts
const ITEM_DATA_ATTR = 'data-vyui-collection-item'
```

Change it there and every collection-based component follows. If you rename any
marker, update the matching selectors in that component's tests.
