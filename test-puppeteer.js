import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        page.on('console', msg => {
            console.log('BROWSER LOG:', msg.text());
        });

        page.on('pageerror', err => {
            console.error('BROWSER ERROR:', err.toString());
        });

        console.log("Navigating to /en/ ...");
        await page.goto('http://localhost:4321/en/', { waitUntil: 'networkidle0' });

        console.log("Waiting for translation to finish or fail...");
        await new Promise(r => setTimeout(r, 6000));

        await browser.close();
    } catch (e) {
        console.error("Puppeteer error:", e);
    }
})();
