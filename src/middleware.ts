import { defineMiddleware } from "astro:middleware";
import { getEntry } from "astro:content";

async function getDefaultLang() {
    const config = await getEntry("config", "site");
    return config?.data.defaultLang ?? "it";
}

export const onRequest = defineMiddleware(async (context, next) => {
    const url = new URL(context.request.url);
    const pathname = url.pathname;

    if (pathname === "/" || pathname === "" || pathname === "/index.html") {
        const defaultLang = await getDefaultLang();
        console.log(`[Middleware] Root access, redirecting to defaultLang: ${defaultLang}`);
        return context.redirect(`/${defaultLang}/`, 302);
    }

    return next();
});