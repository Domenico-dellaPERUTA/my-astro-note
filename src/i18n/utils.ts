// src/i18n/utils.ts

import { ui, defaultLang } from './ui';

/**
 * Carica le traduzioni e restituisci la funzione t()
 */
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}