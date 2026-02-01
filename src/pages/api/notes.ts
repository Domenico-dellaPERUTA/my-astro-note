// src/pages/api/notes.ts
import type { APIRoute } from 'astro';
import { notesDb } from '../../db/mysql';
import { isAdmin } from '../../lib/auth';

export const GET: APIRoute = async () => {
    try {
        const notes = await notesDb.getAll();
        return new Response(JSON.stringify(notes), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Errore nel caricamento' }), {
            status: 500
        });
    }
};

export const POST: APIRoute = async ({ request, cookies }) => {
    // Controllo sicurezza lato server
    if (!isAdmin(cookies)) {
        return new Response(JSON.stringify({ error: 'Accesso non autorizzato' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        console.log('request', request);
        const { title, content, parentId, type } = await request.json();

        if (!title || !content) {
            return new Response(JSON.stringify({ error: 'title e content sono obbligatori' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const id = await notesDb.create(title, content, parentId, type);
        const newNote = await notesDb.getById(id);

        return new Response(JSON.stringify(newNote), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Errore nella creazione:', error);
        return new Response(JSON.stringify({ error: 'Errore nella creazione', details: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};