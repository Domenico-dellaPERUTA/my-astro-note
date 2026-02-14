import type { APIRoute } from 'astro';
import { notesDb } from '../../../db/mysql';
import { isAdmin } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
    if (!isAdmin(cookies)) {
        return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
    }

    try {
        const { noteId, direction } = await request.json();

        if (!noteId || !['up', 'down'].includes(direction)) {
            return new Response(JSON.stringify({ error: 'Parametri non validi' }), { status: 400 });
        }

        const note = await notesDb.getById(noteId);
        if (!note) {
            return new Response(JSON.stringify({ error: 'Nota non trovata' }), { status: 404 });
        }

        // Get siblings ordered by position
        const allNotes = await notesDb.getAll();
        const siblings = allNotes
            .filter(n => n.parent_id === note.parent_id)
            .sort((a, b) => a.position - b.position);

        const currentIndex = siblings.findIndex(n => n.id === note.id);
        if (currentIndex === -1) throw new Error('Note not found in siblings');

        let swapTargetIndex = -1;
        if (direction === 'up' && currentIndex > 0) {
            swapTargetIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < siblings.length - 1) {
            swapTargetIndex = currentIndex + 1;
        }

        if (swapTargetIndex !== -1) {
            const targetNote = siblings[swapTargetIndex];

            // Swap positions
            const newPos = targetNote.position;
            const targetNewPos = note.position;

            // Update both notes
            // We need to use update method which now supports position
            // But we need to pass all args. Ideally we should have a specific method for position
            // For now, let's reuse update checking strict types

            await notesDb.update(note.id, note.title, note.content, note.parent_id, note.type, newPos);
            await notesDb.update(targetNote.id, targetNote.title, targetNote.content, targetNote.parent_id, targetNote.type, targetNewPos);

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: false, message: 'No move needed' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Reorder error:', error);
        return new Response(JSON.stringify({ error: 'Errore nel riordinamento' }), {
            status: 500
        });
    }
};
