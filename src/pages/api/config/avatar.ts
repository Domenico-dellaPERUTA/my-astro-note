import type { APIRoute } from 'astro';
import { getEntry } from "astro:content";
import fs from 'node:fs';
import path from 'node:path';
import { isAdmin } from '../../../lib/auth';

export const GET: APIRoute = async () => {
    try {
        const config = await getEntry("config", "avatar");
        if (!config) {
            return new Response(JSON.stringify({
                currentModel: "avatar.glb",
                cameraY: 1.3,
                cameraZ: 2.1,
                cameraTargetY: 1.55
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response(JSON.stringify(config.data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to load config" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export const POST: APIRoute = async ({ request, cookies }) => {
    if (!isAdmin(cookies)) {
        return new Response(JSON.stringify({ error: 'Accesso non autorizzato' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        const { currentModel, cameraY, cameraZ, cameraTargetY } = body;
        const configPath = path.join(process.cwd(), 'src', 'content', 'config', 'avatar.md');

        let yaml = `currentModel: "${currentModel}"`;
        if (cameraY !== undefined) yaml += `\ncameraY: ${cameraY}`;
        if (cameraZ !== undefined) yaml += `\ncameraZ: ${cameraZ}`;
        if (cameraTargetY !== undefined) yaml += `\ncameraTargetY: ${cameraTargetY}`;

        const content = `---
${yaml}
---

# Avatar Configuration
This file stores the selected avatar model and its camera view settings.
`;
        fs.writeFileSync(configPath, content);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to update config" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
