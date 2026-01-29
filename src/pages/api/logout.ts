
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
    cookies.delete('user_session', {
        path: '/'
    });

    return new Response(JSON.stringify({ success: true, message: 'Logout effettuato' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
