// @ts-nocheck
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
    output: "server", // SSR
    integrations: [svelte()],
    adapter: node({
        mode: 'standalone', // per deploy con node (server) o Docker
    }),
});
