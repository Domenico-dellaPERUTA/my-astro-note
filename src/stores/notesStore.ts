// src/stores/notesStore.ts
import { writable } from 'svelte/store';

/* ---------[ Stato ]----------------------------------------------- */

// stato delle note in modifica o visualizzazione
// stato delle note in modifica o visualizzazione
export const isEdit = writable(false);

// Vista corrente: 'notes' o 'login'
export type ViewState = 'notes' | 'login';
export const currentView = writable<ViewState>('notes');

// Ruolo utente: 'guest' o 'admin'
export type UserRole = 'guest' | 'admin';

// Inizializza dal localStorage se disponibile (solo lato client)
const initialRole: UserRole = (typeof window !== 'undefined' && localStorage.getItem('userRole') as UserRole) || 'guest';
export const userRole = writable<UserRole>(initialRole);

// Registra i cambiamenti nel localStorage
if (typeof window !== 'undefined') {
    userRole.subscribe(val => {
        localStorage.setItem('userRole', val);
    });
}

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

//indice della nota selezionata
export const selectedNoteIndex = writable(0);

export type Nota = {
    id: number;
    title: string;
    content: string;
    parent_id?: number | null;
    children?: Nota[]; // Per la visualizzazione ad albero
    created_at?: Date;
    updated_at?: Date;
};
// store delle note
export const notes = writable<Nota[]>([]);

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
export async function createNote(title: string, content: string, parentId?: number) {
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, parentId })
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