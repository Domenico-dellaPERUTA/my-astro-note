import { configDb } from '../db/mysql';

export async function getRawSiteConfig() {
    try {
        const defaultLang = await configDb.get('defaultLang');
        return { defaultLang: defaultLang || 'it' };
    } catch (e) {
        console.error("[getRawSiteConfig] Error reading config from DB:", e);
        return { defaultLang: 'it' };
    }
}