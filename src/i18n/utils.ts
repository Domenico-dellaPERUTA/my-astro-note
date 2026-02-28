// src/i18n/utils.ts

type Translations = Record<string, string>;

/**
 * Carica il file JSON delle traduzioni
 */
async function loadTranslations(lang: string): Promise<Translations> {
  const translations = await import(`./locales/${lang}.json`);
  return translations.default || translations;
}


/**
 * Carica le traduzioni e restituisci la funzione t()
 */
export async function useTranslations(lang: string) {
  const translations = await loadTranslations(lang);
  
  return function i18n(key: string): string {
    return translations[key] || key; // Ritorna la chiave stessa se non troviamo la traduzione
  };
}