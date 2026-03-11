const url = `https://translate.googleapis.com/translate_a/single`;
const params = new URLSearchParams({
    client: 'gtx',
    sl: 'it',
    tl: 'en',
    dt: 't',
    q: 'Ciao, come stai?',
});

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
}).then(async r => {
    console.log("Status:", r.status);
    console.log("Body:", await r.text());
}).catch(console.error);
