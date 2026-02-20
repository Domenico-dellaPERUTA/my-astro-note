import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { usersDb } from '../db/users';
import { notesDb } from '../db/mysql';
import { isAdmin } from '../lib/auth';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { getEntry } from "astro:content";

// --- Configurazione File Manager ---
const BASE_DIR = '/Library/WebServer/WebApp';

function safePath(relative: string = '') {
    const resolved = path.resolve(BASE_DIR, relative);
    if (!resolved.startsWith(BASE_DIR)) {
        throw new Error('Accesso non autorizzato fuori dalla cartella base');
    }
    return resolved;
}

export const server = {
    // --- Autenticazione ---
    login: defineAction({
        accept: 'json',
        input: z.object({
            username: z.string(),
            password: z.string(),
            token: z.string(),
        }),
        handler: async (input, context) => {
            const { username, password, token } = input;
            const { cookies } = context;

            try {
                const result = await usersDb.verifyLogin(username, password, token);

                if (result.success) {
                    // Set a session cookie
                    cookies.set('user_session', JSON.stringify({ username, role: 'admin' }), {
                        path: '/',
                        httpOnly: true,
                        maxAge: 60 * 60 * 24 // 1 day
                    });

                    return { success: true, message: 'Login effettuato' };
                } else {
                    return { success: false, message: result.message };
                }
            } catch (error) {
                console.error('Action Error:', error);
                return { success: false, message: 'Errore interno del server' };
            }
        },
    }),
    logout: defineAction({
        handler: async (_, context) => {
            context.cookies.delete('user_session', {
                path: '/',
            });
            return { success: true, message: 'Logout effettuato' };
        },
    }),

    // --- Gestione Note ---
    listNotes: defineAction({
        handler: async () => {
            try {
                const notes = await notesDb.getAll();
                return notes;
            } catch (error) {
                console.error('Action Error (listNotes):', error);
                throw new Error('Errore nel caricamento delle note');
            }
        },
    }),

    getNote: defineAction({
        input: z.object({
            id: z.number(),
        }),
        handler: async (input) => {
            try {
                const note = await notesDb.getById(input.id);
                if (!note) throw new Error('Nota non trovata');
                return note;
            } catch (error) {
                console.error('Action Error (getNote):', error);
                throw error;
            }
        },
    }),

    createNote: defineAction({
        accept: 'json',
        input: z.object({
            title: z.string(),
            content: z.string(),
            parentId: z.number().optional(),
            type: z.enum(['note', 'quiz', 'slide', 'diagram']).optional(),
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) {
                throw new Error('Accesso non autorizzato');
            }

            try {
                const id = await notesDb.create(input.title, input.content, input.parentId, input.type);
                const newNote = await notesDb.getById(id);
                return newNote;
            } catch (error) {
                console.error('Action Error (createNote):', error);
                throw error;
            }
        },
    }),

    updateNote: defineAction({
        accept: 'json',
        input: z.object({
            id: z.number(),
            title: z.string(),
            content: z.string(),
            parentId: z.number().nullable().optional(),
            type: z.enum(['note', 'quiz', 'slide', 'diagram']).optional(),
            position: z.number().optional(),
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) {
                throw new Error('Accesso non autorizzato');
            }

            try {
                await notesDb.update(input.id, input.title, input.content, input.parentId, input.type, input.position);
                return { success: true };
            } catch (error) {
                console.error('Action Error (updateNote):', error);
                throw error;
            }
        },
    }),

    deleteNote: defineAction({
        input: z.object({
            id: z.number(),
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) {
                throw new Error('Accesso non autorizzato');
            }

            try {
                await notesDb.delete(input.id);
                return { success: true };
            } catch (error) {
                console.error('Action Error (deleteNote):', error);
                throw error;
            }
        },
    }),

    reorderNote: defineAction({
        accept: 'json',
        input: z.object({
            noteId: z.number(),
            direction: z.enum(['up', 'down']),
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) {
                throw new Error('Accesso non autorizzato');
            }

            try {
                const { noteId, direction } = input;
                const note = await notesDb.getById(noteId);
                if (!note) throw new Error('Nota non trovata');

                const allNotes = await notesDb.getAll();
                const siblings = allNotes
                    .filter(n => n.parent_id === note.parent_id)
                    .sort((a, b) => a.position - b.position);

                const currentIndex = siblings.findIndex(n => n.id === note.id);
                if (currentIndex === -1) throw new Error('Nota non trovata nei fratelli');

                let swapTargetIndex = -1;
                if (direction === 'up' && currentIndex > 0) {
                    swapTargetIndex = currentIndex - 1;
                } else if (direction === 'down' && currentIndex < siblings.length - 1) {
                    swapTargetIndex = currentIndex + 1;
                }

                if (swapTargetIndex !== -1) {
                    const targetNote = siblings[swapTargetIndex];
                    const newPos = targetNote.position;
                    const targetNewPos = note.position;

                    await notesDb.update(note.id, note.title, note.content, note.parent_id, note.type, newPos);
                    await notesDb.update(targetNote.id, targetNote.title, targetNote.content, targetNote.parent_id, targetNote.type, targetNewPos);

                    return { success: true };
                }

                return { success: false, message: 'Nessun movimento necessario' };
            } catch (error) {
                console.error('Action Error (reorderNote):', error);
                throw error;
            }
        },
    }),

    // --- Gestione File (Admin) ---
    listFiles: defineAction({
        input: z.object({
            path: z.string().optional().default(''),
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) throw new Error('Operazione non autorizzata');
            try {
                const fullPath = safePath(input.path);
                const entries = await fs.readdir(fullPath, { withFileTypes: true });
                return entries.map(entry => ({
                    name: entry.name,
                    isDir: entry.isDirectory(),
                    path: path.join(input.path, entry.name)
                }));
            } catch (error) {
                console.error('Action Error (listFiles):', error);
                throw new Error('Errore durante la lettura dei file');
            }
        }
    }),

    createFolder: defineAction({
        accept: 'json',
        input: z.object({
            path: z.string(),
            name: z.string(),
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) throw new Error('Operazione non autorizzata');
            try {
                const fullPath = safePath(path.join(input.path, input.name));
                await fs.mkdir(fullPath, { recursive: true });
                return { success: true };
            } catch (error) {
                console.error('Action Error (createFolder):', error);
                throw new Error('Errore nella creazione della cartella');
            }
        }
    }),

    uploadFile: defineAction({
        accept: 'form',
        input: z.object({
            path: z.string(),
            file: z.any(), // File object dalla form
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) throw new Error('Operazione non autorizzata');
            try {
                const file = input.file as File;
                const buffer = Buffer.from(await file.arrayBuffer());
                const filename = file.name.replace(/\s+/g, '_');
                const fullPath = safePath(path.join(input.path, filename));
                await fs.writeFile(fullPath, buffer);
                return { success: true };
            } catch (error) {
                console.error('Action Error (uploadFile):', error);
                throw new Error('Errore durante l\'upload del file');
            }
        }
    }),

    renameFile: defineAction({
        accept: 'json',
        input: z.object({
            path: z.string(),
            oldName: z.string(),
            newName: z.string(),
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) throw new Error('Operazione non autorizzata');
            try {
                const oldPath = safePath(path.join(input.path, input.oldName));
                const newPath = safePath(path.join(input.path, input.newName));
                await fs.rename(oldPath, newPath);
                return { success: true };
            } catch (error) {
                console.error('Action Error (renameFile):', error);
                throw new Error('Errore durante la ridenominazione');
            }
        }
    }),

    deleteFile: defineAction({
        input: z.object({
            path: z.string(),
        }),
        handler: async (input, context) => {
            if (!isAdmin(context.cookies)) throw new Error('Operazione non autorizzata');
            try {
                const fullPath = safePath(input.path);
                await fs.rm(fullPath, { recursive: true, force: true });
                return { success: true };
            } catch (error) {
                console.error('Action Error (deleteFile):', error);
                throw new Error('Errore durante l\'eliminazione');
            }
        }
    }),

    // --- Configurazioni e Modelli ---
    config: {
        getAvatarConfig: defineAction({
            handler: async () => {
                try {
                    const config = await getEntry("config", "avatar");
                    return config ? config.data : {
                        currentModel: "avatar.glb",
                        cameraY: 1.3,
                        cameraZ: 2.1,
                        cameraTargetY: 1.55
                    };
                } catch (error) {
                    console.error('Action Error (getAvatarConfig):', error);
                    throw new Error('Errore nel caricamento della configurazione avatar');
                }
            }
        }),

        updateAvatarConfig: defineAction({
            accept: 'json',
            input: z.object({
                currentModel: z.string(),
                cameraY: z.number().optional(),
                cameraZ: z.number().optional(),
                cameraTargetY: z.number().optional(),
            }),
            handler: async (input, context) => {
                if (!isAdmin(context.cookies)) throw new Error('Operazione non autorizzata');
                try {
                    const configPath = path.join(process.cwd(), 'src', 'content', 'config', 'avatar.md');
                    let yaml = `currentModel: "${input.currentModel}"`;
                    if (input.cameraY !== undefined) yaml += `\ncameraY: ${input.cameraY}`;
                    if (input.cameraZ !== undefined) yaml += `\ncameraZ: ${input.cameraZ}`;
                    if (input.cameraTargetY !== undefined) yaml += `\ncameraTargetY: ${input.cameraTargetY}`;

                    const content = `---\n${yaml}\n---\n\n# Avatar Configuration\nThis file stores the selected avatar model and its camera view settings.\n`;
                    await fs.writeFile(configPath, content);
                    return { success: true };
                } catch (error) {
                    console.error('Action Error (updateAvatarConfig):', error);
                    throw new Error('Errore nel salvataggio della configurazione avatar');
                }
            }
        }),

        getMermaidConfig: defineAction({
            handler: async () => {
                try {
                    const config = await getEntry("config", "mermaid");
                    if (!config) throw new Error("Configurazione non trovata");
                    return config.data;
                } catch (error) {
                    console.error('Action Error (getMermaidConfig):', error);
                    throw new Error('Errore nel caricamento della configurazione mermaid');
                }
            }
        }),

        listModels: defineAction({
            handler: async () => {
                try {
                    const modelsDir = path.join(process.cwd(), 'public', 'models');
                    if (!fsSync.existsSync(modelsDir)) return [];
                    const files = await fs.readdir(modelsDir);
                    return files.filter(f => f.endsWith('.glb'));
                } catch (error) {
                    console.error('Action Error (listModels):', error);
                    throw new Error('Errore nel caricamento dei modelli');
                }
            }
        })
    }
};
