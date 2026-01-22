import { writable } from 'svelte/store';

export const selectedNoteIndex = writable(-1);

export type Nota = {
    title: string;
    content: string;
};

export const notes = writable<Nota[]>([]);