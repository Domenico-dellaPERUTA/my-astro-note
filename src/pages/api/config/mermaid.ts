import { getEntry } from "astro:content";

export async function GET() {
    try {
        const config = await getEntry("config", "mermaid");

        if (!config) {
            return new Response(JSON.stringify({ error: "Config validation failed" }), {
                status: 500,
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
