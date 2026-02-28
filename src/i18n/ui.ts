export const languages = {
    it: 'Italiano',
    en: 'English',
};

export const defaultLang = 'it';

export const ui = {
    it: {
        /* view main */
        "main.title": "Appunti",
        "menu.title": "Lista Note",
        "menu.guideButton": "Guida di aiuto",
        /* view guide */
        "guide.backLink": "← Torna alle Note",
        "guide.title": "Guida dell'Applicazione",
        "guide.subtitle": "Tutto quello che c'è da sapere per usare al meglio le tue note.",
        "guide.noDocsFound": "Nessun manuale trovato. Controlla la tua cartella `src/content/docs/`.",
        /* view login */
        "login.title": "Accesso Utente",
        "login.username": "Utente",
        "login.password": "Password",
        "login.token": "Token (OTP)",
        "login.backLink": "← Torna alle Note",
        "login.message.startingLogin": "Accesso in corso...",
        "login.message.error": "Credenziali non valide",
        "login.message.success": "Accesso riuscito! Reindirizzamento in corso...",
        "login.message.errorConnection": "Errore di connessione. Riprova più tardi.",
        /* view admin */
        "admin.backLink": "← Torna alle Note",
        "admin.title": "Gestione File & Media",
        "admin.subtitle": "Area Riservata: Gestione Asset",
        "admin.description": "Qui puoi caricare immagini e gestire documenti per le tue note."
    },
    en: {
        /* view main */
        "main.title": "Notes",
        "menu.title": "Notes List",
        "menu.guideButton": "Help Guide",
        /* view guide */
        "guide.backLink": "← Back to Notes",
        "guide.title": "Application Guide",
        "guide.subtitle": "Everything you need to know to make the best use of your notes.",
        "guide.noDocsFound": "No manual found. Check your `src/content/docs/` folder.",
        /* view login */
        "login.title": "Login",
        "login.username": "Username",
        "login.password": "Password",
        "login.token": "Token (OTP)",
        "login.backLink": "← Back to Notes",
        "login.message.startingLogin": "Starting login...",
        "login.message.error": "Invalid credentials",
        "login.message.success": "Login successful! Redirecting...",
        "login.message.errorConnection": "Connection error. Please try again later.",
        /* view admin */
        "admin.backLink": "← Back to Notes",
        "admin.title": "File & Media Management",
        "admin.subtitle": "Reserved Area: Asset Management",
        "admin.description": "Here you can upload images and manage documents for your notes."
    },
} as const;
