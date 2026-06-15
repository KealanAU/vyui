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

// Pool of comment bodies/authors the generator cycles through so each
// load-more batch produces fresh-looking rows. The comments drawer is the
// primary load-more showcase: scrolling to the bottom keeps appending batches
// via makeComments() until COMMENTS_TOTAL is reached.
const BODIES = [
  'Does this support Android Lynx runtime yet or iOS only?',
  'Tailwind v3 on Lynx is such a good call — v4 is still chaotic',
  'VyFeedList load-more with no flicker = perfect infinite scroll',
  'The island dock UX is straight-up native iOS quality 🔥',
  'Watching this on repeat — open source when? 👀',
  'Pull-to-refresh finally feels native on Lynx 🙌',
  'How are the gesture worklets this smooth on the main thread?',
  'The drawer snap points are chef’s kiss 👌',
  'Wait, this is Vue running on Lynx? mind blown',
  'Saving this for the next project, instant follow',
]
const AUTHORS = ['@niko', '@yuki', '@petra', '@dario', '@anika', '@theo', '@mira', '@kaz', '@ivy', '@otto']

/**
 * Generate a batch of `count` synthetic comments starting at index `start`.
 * Lets the drawer demonstrate repeated load-on-scroll instead of a single
 * fixed second page — scroll down and more keep arriving.
 */
export function makeComments(start: number, count: number): Comment[] {
  return Array.from({ length: count }, (_, i) => {
    const n = start + i
    return {
      id: `c-gen-${n}`,
      author: AUTHORS[n % AUTHORS.length]!,
      text: BODIES[n % BODIES.length]!,
      likes: Math.max(3, 140 - n * 3),
      time: `${n + 2}m`,
    }
  })
}

/** Total comments the drawer loads across all batches (the N/total ceiling). */
export const COMMENTS_TOTAL = 45
