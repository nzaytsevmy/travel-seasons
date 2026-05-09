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
  }),
});

const places = defineCollection({
  type: 'content',
  schema: ({ image: img }) => z.object({
    name: z.string(),
    nameEn: z.string(),
    country: z.string(),
    countrySlug: z.string(),
    type: z.enum([
      'park','mountain','beach','temple','district','city',
      'island','waterfall','lake','sight','lodge','route',
      'port','airport','region',
    ]),
    visited: z.boolean().default(false),
    quote: z.string().optional(),
    factsLine: z.string().optional(),
    sourceGuide: z.string().optional(),
    pubDate: z.coerce.date().default(() => new Date()),
    updatedDate: z.coerce.date().optional(),
    coverImage: img().optional(),
    bestMonths: z.array(z.string()).default([]),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
    price: z.string().optional(),
  }),
});

export const collections = { blog, places };
