import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from "@astrojs/node";

export default defineConfig({
    output: "server",
    integrations: [svelte()],
    adapter: node({
        mode: 'standalone',
    }),
    i18n: {
        defaultLocale: "it",
        locales: ["it", "en"],
        routing: {
            prefixDefaultLocale: true
        }
    }
});
