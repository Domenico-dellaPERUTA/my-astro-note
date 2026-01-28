// src/lib/auth.ts
import type { AstroCookies } from 'astro';

export function isAdmin(cookies: AstroCookies): boolean {
    const session = cookies.get('user_session');

    if (!session) return false;

    try {
        const userData = session.json();
        return userData && userData.role === 'admin';
    } catch (e) {
        return false;
    }
}
