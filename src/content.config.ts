import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const collections = {
    docs: defineCollection({
        // Carica file .md dalla cartella src/content/docs
        loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
        schema: z.object({
            title: z.string(),
            description: z.string().optional(),
            order: z.number().default(0),
        }),
    }),
};
