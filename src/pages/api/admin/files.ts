import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/auth';
import fs from 'fs/promises';
import path from 'path';

// Cartella base per i file (esterna al progetto)
const BASE_DIR = path.resolve(process.cwd(), '..', 'WebApp');

// Helper per risolvere il percorso in modo sicuro (evita path traversal)
function safePath(relative: string = '') {
    const resolved = path.resolve(BASE_DIR, relative);
    if (!resolved.startsWith(BASE_DIR)) {
        throw new Error('Accesso non autorizzato fuori dalla cartella base');
    }
    return resolved;
}

export const GET: APIRoute = async ({ request, cookies }) => {
    if (!isAdmin(cookies)) {
        return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
    }

    const url = new URL(request.url);
    const subPath = url.searchParams.get('path') || '';

    try {
        const fullPath = safePath(subPath);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });

        const list = entries.map(entry => ({
            name: entry.name,
            isDir: entry.isDirectory(),
            path: path.join(subPath, entry.name)
        }));

        return new Response(JSON.stringify(list), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Errore durante la lettura della cartella' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, cookies }) => {
    if (!isAdmin(cookies)) {
        return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
    }

    try {
        const formData = await request.formData();
        const type = formData.get('type');
        const subPath = (formData.get('path') as string) || '';

        if (type === 'folder') {
            const name = formData.get('name') as string;
            if (!name) return new Response(JSON.stringify({ error: 'Nome cartella mancante' }), { status: 400 });

            const fullPath = safePath(path.join(subPath, name));
            await fs.mkdir(fullPath, { recursive: true });
            return new Response(JSON.stringify({ success: true }), { status: 201 });
        }

        if (type === 'file') {
            const file = formData.get('file') as File;
            if (!file) return new Response(JSON.stringify({ error: 'File non trovato' }), { status: 400 });

            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = file.name.replace(/\s+/g, '_'); // Sanitizzazione minima nome file
            const fullPath = safePath(path.join(subPath, filename));

            await fs.writeFile(fullPath, buffer);
            return new Response(JSON.stringify({ success: true }), { status: 201 });
        }

        if (type === 'rename') {
            const oldName = formData.get('oldName') as string;
            const newName = formData.get('newName') as string;
            if (!oldName || !newName) return new Response(JSON.stringify({ error: 'Nomi mancanti per rinominare' }), { status: 400 });

            const oldPath = safePath(path.join(subPath, oldName));
            const newPath = safePath(path.join(subPath, newName));

            await fs.rename(oldPath, newPath);
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        return new Response(JSON.stringify({ error: 'Operazione non valida' }), { status: 400 });

    } catch (error) {
        console.error('File API Error:', error);
        return new Response(JSON.stringify({ error: 'Errore durante l\'operazione' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
    if (!isAdmin(cookies)) {
        return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const subPath = url.searchParams.get('path') || '';
        if (!subPath) return new Response(JSON.stringify({ error: 'Path mancante' }), { status: 400 });

        const fullPath = safePath(subPath);
        await fs.rm(fullPath, { recursive: true, force: true });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Errore durante l\'eliminazione' }), { status: 500 });
    }
};
