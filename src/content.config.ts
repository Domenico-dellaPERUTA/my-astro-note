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
    config: defineCollection({
        loader: glob({ pattern: "**/*.md", base: "./src/content/config" }),
        schema: z.object({
            theme: z.string().default("default"),
            themeVariables: z.record(z.string(), z.any()).optional(),
            flowchart: z.record(z.string(), z.any()).optional(),
            themeCSS: z.string().optional(),
            currentModel: z.string().optional(),
            cameraY: z.number().optional(),
            cameraZ: z.number().optional(),
            cameraTargetY: z.number().optional(),
        }),
    }),
};
