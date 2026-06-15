// Mock comment data. Two batches: `SEED_COMMENTS` loads immediately when the
// drawer opens; `LOAD_MORE_COMMENTS` appends on scrolltolower. This lets the
// N/10 counter update for both the video feed and the comments list.

export interface Comment {
  id: string
  author: string
  text: string
  likes: number
  time: string
}

export const SEED_COMMENTS: Comment[] = [
  { id: 'c1',  author: '@rin',    text: 'This is insane — shipping on mobile feels like cheating now 🚀', likes: 892, time: '2m' },
  { id: 'c2',  author: '@tycho',  text: 'The worklet animation is buttery smooth, no jank at all',        likes: 541, time: '5m' },
  { id: 'c3',  author: '@lena',   text: 'Finally a UI kit that treats Lynx as a first-class target ❤️',  likes: 379, time: '8m' },
  { id: 'c4',  author: '@marc',   text: 'How does the pull-to-refresh feel on device vs simulator?',       likes: 210, time: '12m' },
  { id: 'c5',  author: '@sora',   text: 'The sheet multi-snap is exactly what vaul does on web — nice 👏', likes: 188, time: '18m' },
]

export const LOAD_MORE_COMMENTS: Comment[] = [
  { id: 'c6',  author: '@niko',   text: 'Does this support Android Lynx runtime yet or iOS only?',         likes: 134, time: '24m' },
  { id: 'c7',  author: '@yuki',   text: 'Tailwind v3 on Lynx is such a good call — v4 is still chaotic',  likes: 99,  time: '31m' },
  { id: 'c8',  author: '@petra',  text: 'VyFeedList load-more with no flicker = perfect infinite scroll',  likes: 87,  time: '40m' },
  { id: 'c9',  author: '@dario',  text: 'The island dock UX is straight-up native iOS quality 🔥',         likes: 74,  time: '52m' },
  { id: 'c10', author: '@anika',  text: 'Watching this on repeat — open source when? 👀',                 likes: 61,  time: '1h' },
]
