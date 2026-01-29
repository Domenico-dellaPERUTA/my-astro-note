import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from "@astrojs/node";
import path from 'path';
import fs from 'fs';

// https://astro.build/config
export default defineConfig({
    output: "server",
    integrations: [svelte()],
    adapter: node({
        mode: 'standalone',
    }),
    vite: {
        server: {
            fs: {
                // Permette a Vite di accedere alla cartella WebApp fuori dal progetto
                allow: [
                    path.resolve(process.cwd()),
                    path.resolve(process.cwd(), '..', 'WebApp')
                ]
            }
        },
        // Plugin per servire file statici dalla cartella WebApp in locale (dev mode)
        plugins: [
            {
                name: 'serve-webapp-externally',
                configureServer(server) {
                    server.middlewares.use((req, res, next) => {
                        if (req.url?.startsWith('/WebApp/')) {
                            const relativePath = req.url.replace('/WebApp/', '');
                            const filePath = path.resolve(process.cwd(), '..', 'WebApp', relativePath);

                            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                                res.setHeader('Content-Type', 'image/auto'); // Semplificato
                                res.end(fs.readFileSync(filePath));
                                return;
                            }
                        }
                        next();
                    });
                }
            }
        ]
    }
});

