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
  }),
});

export const collections = { blog };
