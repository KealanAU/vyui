// Mock video feed data. No real video files — each entry is a full-bleed
// gradient card with metadata. Gradients are Tailwind from-/to- pairs rendered
// as inline style strings so Lynx's CSS engine handles them uniformly.
// Keeping them inline avoids purging edge cases for dynamically-constructed
// class names.

export interface Video {
  id: string
  gradient: string   // CSS gradient value for the placeholder card
  caption: string
  author: string
  likes: number
  comments: number
  shares: number
}

// Ten seed videos. `refreshFeed()` clones and prepends these with new ids when
// PTR fires — see App.vue refreshFeed handler.
export const SEED_VIDEOS: Video[] = [
  {
    id: 'v1',
    gradient: 'linear-gradient(160deg, #667eea 0%, #764ba2 100%)',
    caption: 'Building UI components with vue-lynx 🚀',
    author: '@vyui',
    likes: 12400,
    comments: 342,
    shares: 891,
  },
  {
    id: 'v2',
    gradient: 'linear-gradient(160deg, #f093fb 0%, #f5576c 100%)',
    caption: 'Full-screen sheets with multi-snap drag 📱',
    author: '@kealan',
    likes: 9800,
    comments: 217,
    shares: 455,
  },
  {
    id: 'v3',
    gradient: 'linear-gradient(160deg, #4facfe 0%, #00f2fe 100%)',
    caption: 'Pull-to-refresh with native Lynx gestures 💧',
    author: '@ada',
    likes: 23100,
    comments: 589,
    shares: 1203,
  },
  {
    id: 'v4',
    gradient: 'linear-gradient(160deg, #43e97b 0%, #38f9d7 100%)',
    caption: 'Tailwind Variants theming in 60 seconds 🎨',
    author: '@grace',
    likes: 7650,
    comments: 98,
    shares: 310,
  },
  {
    id: 'v5',
    gradient: 'linear-gradient(160deg, #fa709a 0%, #fee140 100%)',
    caption: 'Worklet animations run on the main thread ⚡',
    author: '@vyui',
    likes: 18900,
    comments: 412,
    shares: 988,
  },
  {
    id: 'v6',
    gradient: 'linear-gradient(160deg, #a18cd1 0%, #fbc2eb 100%)',
    caption: 'VyFeedList virtualised scroll — 10k items 📁',
    author: '@kealan',
    likes: 5400,
    comments: 74,
    shares: 223,
  },
  {
    id: 'v7',
    gradient: 'linear-gradient(160deg, #ffecd2 0%, #fcb69f 100%)',
    caption: 'Island components: floating docks done right 🌴',
    author: '@ada',
    likes: 14200,
    comments: 301,
    shares: 672,
  },
  {
    id: 'v8',
    gradient: 'linear-gradient(160deg, #2af598 0%, #009efd 100%)',
    caption: 'Combobox with in-sheet typeahead search 🔍',
    author: '@grace',
    likes: 6100,
    comments: 153,
    shares: 289,
  },
  {
    id: 'v9',
    gradient: 'linear-gradient(160deg, #f77062 0%, #fe5196 100%)',
    caption: 'Keyboard-aware footer — chat UI in 20 lines 💬',
    author: '@vyui',
    likes: 31500,
    comments: 874,
    shares: 2109,
  },
  {
    id: 'v10',
    gradient: 'linear-gradient(160deg, #c3cfe2 0%, #c3cfe2 100%)',
    caption: 'Open source — ship beautiful Lynx UIs today 🌟',
    author: '@kealan',
    likes: 44000,
    comments: 1203,
    shares: 3410,
  },
]

// Additional batch used by the feed load-more handler (appended when the user
// scrolls to the bottom). Kept separate so the counter can show "+5 loaded".
export const LOAD_MORE_VIDEOS: Video[] = [
  {
    id: 'lm1',
    gradient: 'linear-gradient(160deg, #e0c3fc 0%, #8ec5fc 100%)',
    caption: 'Responsive layouts with Lynx flex primitives 📐',
    author: '@ada',
    likes: 8200,
    comments: 190,
    shares: 440,
  },
  {
    id: 'lm2',
    gradient: 'linear-gradient(160deg, #f6d365 0%, #fda085 100%)',
    caption: 'Custom icon sets via registerIconSet 🎭',
    author: '@grace',
    likes: 4900,
    comments: 67,
    shares: 198,
  },
  {
    id: 'lm3',
    gradient: 'linear-gradient(160deg, #89f7fe 0%, #66a6ff 100%)',
    caption: 'VyModal: centered dialogs with backdrop ✨',
    author: '@vyui',
    likes: 11300,
    comments: 245,
    shares: 601,
  },
  {
    id: 'lm4',
    gradient: 'linear-gradient(160deg, #fddb92 0%, #d1fdff 100%)',
    caption: 'Rating, Progress, Skeleton — display kit deep dive 📊',
    author: '@kealan',
    likes: 7800,
    comments: 133,
    shares: 347,
  },
  {
    id: 'lm5',
    gradient: 'linear-gradient(160deg, #96fbc4 0%, #f9f586 100%)',
    caption: 'VySwipeAction: swipe-to-delete gestures ❌',
    author: '@ada',
    likes: 9500,
    comments: 208,
    shares: 513,
  },
]
