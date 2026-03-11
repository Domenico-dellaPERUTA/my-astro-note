const sourceLang = "it";
const targetLang = "en";
const text = "Lezione 1";

const url = `https://translate.googleapis.com/translate_a/single`;
const params = new URLSearchParams({
    client: 'gtx',
    sl: sourceLang,
    tl: targetLang,
    dt: 't',
    q: text,
});

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
    },
    body: params.toString()
}).then(async response => {
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Data:", JSON.stringify(data).substring(0, 100));
    const translatedText = data[0].map((item) => item[0]).join("");
    console.log("Translated:", translatedText);
}).catch(console.error);
