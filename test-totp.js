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

function generateTOTP(secret) {
    const key = base32Decode(secret);
    const timeStep = 30;
    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / timeStep);

    const b = Buffer.alloc(8);
    b.writeUInt32BE(0, 0);
    b.writeUInt32BE(counter, 4);

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

    return code.toString().padStart(6, '0');
}

const secret = 'JBSWY3DPEHPK3PXP';
const token = generateTOTP(secret);
console.log('Secret TOTP:', secret);
console.log('Token corrente generato:', token);
console.log('');
console.log('Inserisci questo token nel form di login per verificare.');
console.log('Il token cambia ogni 30 secondi.');
