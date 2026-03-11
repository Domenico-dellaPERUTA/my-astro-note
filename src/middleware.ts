import { defineMiddleware } from "astro:middleware";
import fs from "node:fs";
import path from "node:path";

import { getRawSiteConfig } from "./lib/siteConfig";

// Funzione helper per leggere la lingua di default dal file MD (ora usa l'utility)
async function getDefaultLang() {
    const config = await getRawSiteConfig();
    return config.defaultLang;
}

export const onRequest = defineMiddleware(async (context, next) => {
    const url = new URL(context.request.url);
    const pathname = url.pathname;

    // Gestiamo il redirect solo per la root esatta "/"
    if (pathname === "/" || pathname === "" || pathname === "/index.html") {
        const defaultLang = await getDefaultLang();
        console.log(`[Middleware] Root access, redirecting to defaultLang: ${defaultLang}`);
        // Usiamo 302 per evitare cache persistente del browser in questa fase
        return context.redirect(`/${defaultLang}/`, 302);
    }

    // Altrimenti prosegui normally
    return next();
});
