import { defineMiddleware } from "astro:middleware";
import fs from "node:fs";
import path from "node:path";

// Funzione helper per leggere la lingua di default dal file MD
function getDefaultLang() {
    try {
        const configPath = path.join(process.cwd(), "src", "content", "config", "site.md");
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, "utf-8");
            const match = content.match(/defaultLang:\s*["']?(\w+)["']?/);
            if (match && match[1]) {
                return match[1];
            }
        }
    } catch (e) {
        console.error("[Middleware] Errore lettura config:", e);
    }
    return "it"; // Fallback
}

export const onRequest = defineMiddleware(async (context, next) => {
    const url = new URL(context.request.url);
    const pathname = url.pathname;

    // Gestiamo il redirect solo per la root esatta "/"
    if (pathname === "/" || pathname === "" || pathname === "/index.html") {
        const defaultLang = getDefaultLang();
        console.log(`[Middleware] Root access, redirecting to defaultLang: ${defaultLang}`);
        // Usiamo 302 per evitare cache persistente del browser in questa fase
        return context.redirect(`/${defaultLang}/`, 302);
    }

    // Altrimenti prosegui normally
    return next();
});
