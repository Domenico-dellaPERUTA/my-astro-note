// src/stores/notesStore.ts
import { writable } from 'svelte/store';

/* ---------[ Stato ]----------------------------------------------- */

// stato delle note in modifica o visualizzazione
// stato delle note in modifica o visualizzazione
// Inizializza leggendo dalla sessione se possibile (safe mode per Firefox)
let initialIsEdit = false;
if (typeof window !== 'undefined') {
    try {
        initialIsEdit = sessionStorage.getItem('lastIsEdit') === 'true';
    } catch (e) {
        console.warn('SessionStorage non disponibile (Firefox strict mode?):', e);
    }
}
export const isEdit = writable(initialIsEdit);

// Vista corrente: 'notes' o 'login'
export type ViewState = 'notes' | 'login';
export const currentView = writable<ViewState>('notes');

// Ruolo utente: 'guest' o 'admin'
export type UserRole = 'guest' | 'admin';

// Inizializza sempre come 'guest' ad ogni apertura dell'app
export const userRole = writable<UserRole>('guest');


/* ---------[ Messaggi ]-------------------------------------------- */
// Tipo di messaggio per notifiche all'utente

export type Message = {
    text: string;
    type: 'info' | 'error' | 'success' | 'confirmation';
    confirm?: () => Promise<void>;
};

export const message = writable<Message>({
    text: '',
    type: 'info',
    confirm: undefined
});

/* ---------[ Note ]------------------------------------------------ */

// indice della nota selezionata
export const selectedNoteIndex = writable(0);

export type Nota = {
    id: number;
    title: string;
    content: string;
    parent_id?: number | null;
    type?: 'note' | 'quiz' | null;
    children?: Nota[]; // Per la visualizzazione ad albero
    created_at?: Date;
    updated_at?: Date;
};
// store delle note
// store delle note
export const notes = writable<Nota[]>([]);

// store per la nota in fase di spostamento (Taglia/Incolla)
export const clipboardNote = writable<Nota | null>(null);


/* ---------[ Funzioni Note/DB ]------------------------------------ */

// Funzione per caricare le note dal database
export async function loadNotesFromDb() {
    try {
        const response = await fetch('/api/notes');
        if (!response.ok) throw new Error('Errore nel caricamento delle note');

        const data = await response.json();
        notes.set(data);
    } catch (error) {
        const errorMessage = 'Errore nel caricamento delle note';
        message.set({ text: errorMessage, type: 'error' });
        console.error(errorMessage + ':', error);
    }
}

// Funzione per creare una nota
export async function createNote(title: string, content: string, parentId?: number, type: 'note' | 'quiz' = 'note') {
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, parentId, type })
        });

        if (!response.ok) throw new Error('Errore nella creazione della nota');
        const newNote = await response.json();

        notes.update(n => [...n, newNote]);
    } catch (error) {
        const errorMessage = 'Errore nella creazione della nota';
        message.set({ text: errorMessage, type: 'error' });
        console.error(errorMessage + ':', error);
    }
}

// Funzione per eliminare una nota
export async function deleteNote(id: number) {
    try {
        const response = await fetch(`/api/notes/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Errore nell\'eliminazione della nota');

        notes.update(n => n.filter(note => note.id !== id));
    } catch (error) {
        const errorMessage = 'Errore nell\'eliminazione della nota';
        message.set({ text: errorMessage, type: 'error' });
        console.error(errorMessage + ':', error);
    }
}