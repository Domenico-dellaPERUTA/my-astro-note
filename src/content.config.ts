import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { notesDb } from './db/mysql';

export const collections = {
    notes: defineCollection({
        loader: async () => {
            const notes = await notesDb.getAll();
            return notes.map(note => ({
                id: note.id.toString(),
                title: note.title,
                content: note.content,
                parentId: note.parent_id,
                type: note.type || 'note',
                position: note.position,
                createdAt: note.created_at,
                updatedAt: note.updated_at,
            }));
        },
        schema: z.object({
            title: z.string(),
            content: z.string(),
            parentId: z.number().nullable().optional(),
            type: z.enum(['note', 'quiz', 'slide', 'diagram']).default('note'),
            position: z.number().default(0),
            createdAt: z.date(),
            updatedAt: z.date(),
        }),
    }),
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
