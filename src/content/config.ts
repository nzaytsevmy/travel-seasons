import { defineCollection, z, image } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: ({ image: img }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    coverImage: img(),
    author: z.string().default('Никита Зайцев'),
    tags: z.array(z.string()).default([]),
    tripDate: z.string().optional(),
    tripPlace: z.string().optional(),
    sourceType: z.enum(['personal', 'compilation', 'hybrid']).default('hybrid'),
    coverPosition: z.string().default('center'),
    coverPositionCard: z.string().default('center'),
    howto: z.object({
      name: z.string(),
      description: z.string().optional(),
      totalTime: z.string().optional(),
      estimatedCost: z.object({ currency: z.string(), value: z.string() }).optional(),
      steps: z.array(z.object({ name: z.string(), text: z.string() })),
    }).optional(),
  }),
});

export const collections = { blog };
