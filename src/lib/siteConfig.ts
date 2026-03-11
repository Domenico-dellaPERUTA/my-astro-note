import fs from 'node:fs/promises';
import path from 'node:path';

export async function getRawSiteConfig() {
    try {
        const configPath = path.join(process.cwd(), 'src/content/config/site.md');
        const content = await fs.readFile(configPath, 'utf-8');

        // Semplice parsing del frontmatter per defaultLang
        const match = content.match(/defaultLang:\s*"([^"]+)"/);
        if (match && match[1]) {
            return { defaultLang: match[1] };
        }
        return { defaultLang: "it" };
    } catch (e) {
        console.error("[getRawSiteConfig] Error reading site.md directly:", e);
        return { defaultLang: "it" };
    }
}
