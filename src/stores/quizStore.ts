import { writable } from 'svelte/store';

export interface QuizState {
    isActive: boolean;
    secondsLeft: number;
    answeredCount: number;
    totalQuestions: number;
    title: string;
}

export const quizActiveState = writable<QuizState>({
    isActive: false,
    secondsLeft: 0,
    answeredCount: 0,
    totalQuestions: 0,
    title: ''
});
