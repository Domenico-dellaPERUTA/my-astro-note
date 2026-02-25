import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from "@astrojs/node";

export default defineConfig({
    output: "server",
    integrations: [svelte()],
    adapter: node({
        mode: 'standalone',
    }),
});
