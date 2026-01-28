// src/pages/api/note/[id].ts
import type { APIRoute } from 'astro';
import { notesDb } from '../../../db/mysql';
import { isAdmin } from '../../../lib/auth';

export const DELETE: APIRoute = async ({ params, cookies }) => {
    if (!isAdmin(cookies)) {
        return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
    }
    try {
        const id = parseInt(params.id!);
        await notesDb.delete(id);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Errore nell\'eliminazione' }), {
            status: 500
        });
    }
};

export const GET: APIRoute = async ({ params }) => {
    try {
        const id = parseInt(params.id!);
        const note = await notesDb.getById(id);

        if (!note) {
            return new Response(JSON.stringify({ error: 'Nota non trovata' }), {
                status: 404
            });
        }

        return new Response(JSON.stringify(note), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Errore nel caricamento' }), {
            status: 500
        });
    }
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
    if (!isAdmin(cookies)) {
        return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
    }
    try {
        const id = parseInt(params.id!);
        const { title, content } = await request.json();
        await notesDb.update(id, title, content);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Errore nell\'aggiornamento' }), {
            status: 500
        });
    }
};

