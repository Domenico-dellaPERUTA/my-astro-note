# ✏️ Appunti - Retro Typewriter Note App

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

Una potente e raffinata applicazione per la gestione di note gerarchiche, caratterizzata da un'estetica vintage "Retro Typewriter". Progettata per essere veloce, sicura e facile da organizzare.

---

## 🚀 Caratteristiche Principali

*   **🎨 Estetica Premium**: Interfaccia curata ispirata alle macchine da scrivere classiche, con font monospazio e animazioni fluide.
*   **🌳 Struttura Gerarchica**: Organizza le tue note in alberi infiniti (cartelle e sotto-note).
*   **✂️ Taglia e Incolla**: Sposta intere branche della tua gerarchia con un clic grazie alla funzione Move avanzata.
*   **📝 Markdown Potenziato**: 
    *   Sintassi standard (Grassetti, Code Blocks, Liste, etc.)
    *   `++Sottolineato++` personalizzato.
    *   Stile *Corsivo Handwriting* (Scrittura a mano).
*   **🔗 Wiki Personale**: Collegamenti rapidi tra le note con supporto per il **Deep Linking** tramite URL parameters.
*   **📁 Gestione Media**: File manager integrato per caricare immagini e documenti direttamente nelle note.
*   **🔐 Sicurezza Avanzata**:
    *   **Modalità Ospite**: Lettura sicura senza permessi di modifica.
    *   **Area Admin**: Accesso protetto da password (hash SHA-256) e **2FA (TOTP)**.
*   **❓ Questionari Interattivi**: Crea quiz a risposta multipla con score automatico e **timer** integrato.
*   **⚡ Performance**: Rendering lato server (SSR) con Astro per un caricamento istantaneo.

---

## 📂 Struttura del Progetto

```text
├── public/                 # Asset statici pubblici
├── src/
│   ├── components/         # Componenti UI (Svelte)
│   │   ├── MenuLaterale.svelte   # Navigazione gerarchica
│   │   ├── Annotazione.svelte    # Editor e Visualizzazione
│   │   ├── Quiz.svelte           # Componente Quiz interattivo
│   │   └── ...
│   ├── content/docs/       # Guida utente integrata (Markdown)
│   ├── db/                 # Logica Database (MySQL)
│   ├── lib/                # Utility (Auth, Personalizzazione Markdown)
│   ├── pages/              # Rotte Astro e API Endpoints
│   └── stores/             # Gestione stato (Svelte Stores)
├── astro.config.mjs        # Configurazione Astro & Vite
└── .env                    # Variabili d'ambiente (da creare)
```

---

## 🛠️ Installazione e Configurazione

### 1. Database MySQL
L'app richiede un database MySQL. Esegui questo script per preparare l'ambiente:

```sql
CREATE DATABASE IF NOT EXISTS appunti_db;
USE appunti_db;

-- Tabella Note (con supporto gerarchico)
CREATE TABLE notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  parent_id INT DEFAULT NULL,
  type VARCHAR(20) DEFAULT NULL, -- 'note' o 'quiz'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- Tabella Utenti (per accesso Admin)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, -- SHA-256 del base64 della password
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Configurazione `.env`
Crea un file `.env` nella root del progetto con i seguenti parametri:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=la_tua_password
DB_NAME=appunti_db
DB_PORT=3306

# Autenticazione (TOTP)
TOTP_SECRET=la_tua_chiave_privata # Cambia con una chiave Base32 sicura
```

### 3. Gestione File (Configurazione Percorso)
L'app è configurata per leggere i file multimediali da una cartella esterna (default: `/Library/WebServer/WebApp`). Puoi modificare questo percorso in `astro.config.mjs` per adattarlo al tuo sistema.

---

## 🏃‍♂️ Sviluppo e Build

### Ambiente di Sviluppo
1.  Installa le dipendenze: `npm install`
2.  Avvia: `npm run dev`
3.  Apri: [http://localhost:4321](http://localhost:4321)

### Build per Produzione
Per generare la versione ottimizzata:
```bash
npm run build
```
Puoi testare la build localmente con `npm run preview`.

### Deployment
Il progetto include script di utility per il deployment su macOS (Apache/Launchd):
*   `deploy.sh`: Script per automatizzare il build e lo spostamento dei file.
*   `com.notes.astro.plist`: Configurazione per Launchd per avviare l'app come servizio.

---

## ❓ Sintassi Quiz

Puoi creare un quiz in qualsiasi nota usando la seguente sintassi:

```markdown
:::quiz Titolo del Quiz
::time 10min

? Qual è la domanda?
- [ ] Risposta sbagliata
- [x] Risposta corretta
- [ ] Altra risposta sbagliata
:::
```

*   `::time`: Definisce il tempo limite (es. `5min`, `30s`).
*   `?`: Inizia una domanda.
*   `- [x]`: Indica la risposta corretta.

---

## 📖 Guida all'uso

L'applicazione include una **Guida Utente** integrata accessibile direttamente dall'interfaccia.
Per i dettagli sulla formattazione speciale e sulle funzionalità avanzate, consulta la sezione "Guida" nel menu laterale dell'app.

## 📄 Licenza
Rilasciato sotto licenza MIT.