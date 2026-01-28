import pool from './mysql';
import crypto from 'crypto';

export interface User {
    id: number;
    username: string;
    password_hash: string; // Stored as base64 of the password
    created_at: Date;
}

// --- TOTP Helper Functions ---

function base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = new Uint8Array(encoded.length * 5 / 8 | 0);
    let index = 0;

    for (let i = 0; i < encoded.length; i++) {
        const char = encoded[i].toUpperCase();
        const val = alphabet.indexOf(char);
        if (val === -1) continue;

        value = (value << 5) | val;
        bits += 5;

        if (bits >= 8) {
            output[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return Buffer.from(output);
}

export function verifyTOTP(token: string, secret: string, window = 1): boolean {
    console.log('[verifyTOTP] Called with token:', token, 'secret:', secret, 'window:', window);

    if (!token || !secret) {
        console.log('[verifyTOTP] Missing token or secret');
        return false;
    }

    const key = base32Decode(secret);
    const timeStep = 30; // 30 seconds
    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / timeStep);

    console.log('[verifyTOTP] Current counter:', counter);

    // Check current time step +/- window
    for (let i = -window; i <= window; i++) {
        const c = counter + i;
        const b = Buffer.alloc(8);
        // Write counter as big-endian 64-bit integer
        b.writeUInt32BE(0, 0); // High 32 bits are 0 (unless we handle year 2038+)
        b.writeUInt32BE(c, 4);

        const hmac = crypto.createHmac('sha1', key);
        hmac.update(b);
        const digest = hmac.digest();

        const offset = digest[digest.length - 1] & 0xf;
        const code = (
            ((digest[offset] & 0x7f) << 24) |
            ((digest[offset + 1] & 0xff) << 16) |
            ((digest[offset + 2] & 0xff) << 8) |
            (digest[offset + 3] & 0xff)
        ) % 1000000;

        const currentToken = code.toString().padStart(6, '0');
        console.log(`[verifyTOTP] Window ${i}: generated=${currentToken}, match=${currentToken === token}`);

        if (currentToken === token) return true;
    }

    console.log('[verifyTOTP] No match found');
    return false;
}

// --- Database Functions ---

export const usersDb = {
    async getUser(username: string): Promise<User | null> {
        try {
            const [rows] = await pool.query<any[]>(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            return (rows as User[])[0] || null;
        } catch (error) {
            console.error('Database error in getUser:', error);
            throw error;
        }
    },

    async verifyLogin(username: string, passwordPlain: string, token: string): Promise<{ success: boolean; message: string }> {
        const user = await this.getUser(username);
        if (!user) {
            return { success: false, message: 'Utente non trovato' };
        }

        // Encode input password to base64 for comparison
        const inputBase64 = Buffer.from(passwordPlain).toString('base64');

        // Create SHA-256 hash of the base64 string
        const inputHash = crypto.createHash('sha256').update(inputBase64).digest('hex');

        // Log for debugging/manual DB update (remove in production)
        console.log(`Login attempt for ${username}. Input Base64: ${inputBase64}`);
        console.log(`Computed Hash (SHA-256): ${inputHash}`);
        console.log(`DB Stored Hash: ${user.password_hash}`);

        if (inputHash !== user.password_hash) {
            return { success: false, message: 'Password errata' };
        }

        // Verify OTP
        const secret = import.meta.env.TOTP_SECRET || '';
        console.log('\n=== DEBUG OTP VERIFICATION ===');
        console.log('TOTP_SECRET from env:', secret);
        console.log('Token ricevuto:', token);
        console.log('Username:', username);

        if (!verifyTOTP(token, secret)) {
            console.log('❌ OTP verification FAILED');
            console.log('===============================\n');
            return { success: false, message: 'Codice OTP non valido o scaduto' };
        }

        console.log('✅ OTP verification SUCCESS');
        console.log('===============================\n');

        return { success: true, message: 'Login effettuato' };
    }
};
