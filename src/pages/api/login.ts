
import type { APIRoute } from 'astro';
import { usersDb } from '../../db/users';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const data = await request.json();
        const { username, password, token } = data;

        console.log("\n=== DATI RICEVUTI DAL SERVER ===");
        console.log("Username ricevuto:", username);
        console.log("Password ricevuta (lunghezza):", password?.length, "caratteri");
        console.log("Token ricevuto:", token);
        console.log("Token tipo:", typeof token);
        console.log("Token lunghezza:", token?.length);
        console.log("================================\n");

        if (!username || !password || !token) {
            return new Response(JSON.stringify({ message: 'Dati mancanti' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const result = await usersDb.verifyLogin(username, password, token);

        if (result.success) {
            // Set a session cookie
            cookies.set('user_session', JSON.stringify({ username, role: 'admin' }), {
                path: '/',
                httpOnly: true,
                maxAge: 60 * 60 * 24 // 1 day
            });

            return new Response(JSON.stringify({ success: true, message: 'Login effettuato' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ success: false, message: result.message }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ message: 'Errore interno del server' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
