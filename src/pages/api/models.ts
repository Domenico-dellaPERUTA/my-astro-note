import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const GET: APIRoute = async () => {
    try {
        const modelsDir = path.join(process.cwd(), 'public', 'models');
        if (!fs.existsSync(modelsDir)) {
            return new Response(JSON.stringify([]), { status: 200 });
        }
        const files = fs.readdirSync(modelsDir);
        const glbFiles = files.filter(f => f.endsWith('.glb'));
        return new Response(JSON.stringify(glbFiles), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Errore nel caricamento dei modelli' }), {
            status: 500
        });
    }
};
