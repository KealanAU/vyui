import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: {
        include: '**',
        exclude: ['index.md', 'changelog/**'],
      },
      schema: z.object({
        package: z.enum(['core', 'kit']).optional(),
        // Components sidebar grouping — see CATEGORY_ORDER in useNavigation.ts.
        category: z.string().optional(),
        links: z.array(z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional(),
        })).optional(),
      }),
    }),
    changelog: defineCollection({
      type: 'page',
      source: 'changelog/**',
      schema: z.object({
        // 'core' renders on the left rail, 'kit' on the right.
        package: z.enum(['core', 'kit']),
        // ISO date (YYYY-MM-DD) — drives the interleaved timeline order.
        date: z.string(),
        // Release badge label, e.g. 'v0.0.3', 'Workspace'.
        version: z.string(),
        // Numeric SemVer sort key generated for deterministic same-day ordering.
        changelogOrder: z.number().optional(),
      }),
    }),
  },
})
