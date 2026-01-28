import crypto from 'crypto';

function base32Decode(encoded) {
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

function verifyTOTP(token, secret, window = 1) {
    console.log('\n=== DEBUG VERIFY TOTP ===');
    console.log('Token ricevuto:', token);
    console.log('Secret:', secret);
    console.log('Window:', window);

    if (!token || !secret) {
        console.log('❌ Token o secret mancante');
        return false;
    }

    const key = base32Decode(secret);
    console.log('Key decodificata (hex):', key.toString('hex'));

    const timeStep = 30; // 30 seconds
    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / timeStep);

    console.log('Timestamp corrente:', now);
    console.log('Counter corrente:', counter);
    console.log('');

    // Check current time step +/- window
    for (let i = -window; i <= window; i++) {
        const c = counter + i;
        const b = Buffer.alloc(8);
        // Write counter as big-endian 64-bit integer
        b.writeUInt32BE(0, 0); // High 32 bits are 0
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
        console.log(`Window ${i}: counter=${c}, token generato=${currentToken}, match=${currentToken === token ? '✅' : '❌'}`);

        if (currentToken === token) {
            console.log('\n✅ TOKEN VALIDO!');
            return true;
        }
    }

    console.log('\n❌ NESSUN MATCH TROVATO');
    return false;
}

const secret = 'JBSWY3DPEHPK3PXP';
const token = process.argv[2] || '000000';

console.log('Testing TOTP verification...');
const result = verifyTOTP(token, secret, 1);
console.log('\nRisultato finale:', result ? '✅ SUCCESSO' : '❌ FALLITO');
