# ✏️ Appunti - Note Taking App

Una semplice ma elegante applicazione per prendere appunti, costruita con **Astro**, **Svelte** e **MySQL**. 
L'app presenta un design "Retro Typewriter" con supporto completo per il **Markdown** (inclusi grassetti, corsivi, liste e blocchi di codice).

## 🚀 Caratteristiche

*   **Tema Vintage**: Interfaccia ispirata alle vecchie macchine da scrivere.
*   **Editor Markdown**: Scrivi i tuoi appunti usando la sintassi Markdown.
*   **Preview Istantanea**: Visualizza subito la formattazione dei tuoi testi.
*   **Salvataggio su DB**: Le note sono persistenti grazie a MySQL.
*   **SSR**: Rendering lato server per performance ottimali.

## 📂 Struttura del Progetto

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Annotazione.svelte      # Editor note principale
│   │   ├── BarraPrincipale.svelte  # Header dell'applicazione
│   │   ├── MenuLaterale.svelte     # Sidebar con lista note
│   │   └── Messaggio.svelte        # Toast di notifica
│   ├── db/
│   │   └── mysql.ts                # Configurazione e query MySQL
│   ├── layouts/
│   │   └── Layout.astro            # Layout base (CSS globali, font)
│   ├── pages/
│   │   ├── api/                    # API Endpoints
│   │   └── index.astro             # Pagina principale (Appunti)
│   ├── stores/
│   │   └── notesStore.ts           # Gestione stato Svelte
│   └── utils/
│       └── markdown.ts             # Utility parsing Markdown
├── astro.config.mjs                # Configurazione Astro
├── package.json
└── README.md
```

---

## 🛠️ Installazione e Sviluppo

Segui questi passaggi per installare ed eseguire l'applicazione in locale.

### 1. Clona il Repository
Scarica il codice sorgente sul tuo computer:
```bash
git clone <URL_DEL_TUO_REPOSITORY>
cd my-astro
```

### 2. Installa le Dipendenze
Installa i pacchetti necessari tramite npm:
```bash
npm install
```

### 3. Configura il Database (MySQL)
Assicurati di avere un server MySQL in esecuzione. Poi crea il database e la tabella necessaria.

Esegui questo script SQL nel tuo client MySQL (es. Workbench, DBeaver o riga di comando):

```sql
-- Crea il database (se non esiste già)
CREATE DATABASE IF NOT EXISTS appunti_db;

USE appunti_db;

-- Crea la tabella 'notes'
CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  parent_id INT DEFAULT NULL, -- Per le note figlio
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE CASCADE
);

-- (Opzionale) Inserisci una nota di prova
INSERT INTO notes (title, content) VALUES ('Benvenuto', 'Questa è la tua prima nota in **Markdown**!');
```

### Aggiornamento Schema esistente (Migrations)
Se hai già creato la tabella, esegui:
```sql
ALTER TABLE notes ADD COLUMN parent_id INT DEFAULT NULL;
ALTER TABLE notes ADD CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE CASCADE;
```

### 4. Configura le Variabili d'Ambiente
Crea un file `.env` nella root del progetto (copia da un esempio se disponibile o crealo da zero) e inserisci le credenziali del database:

```env
DB_HOST=localhost
DB_USER=il_tuo_utente_mysql
DB_PASSWORD=la_tua_password_mysql
DB_NAME=appunti_db
DB_PORT=3306
```

### 5. Avvia l'App in Sviluppo
Ora sei pronto per lanciare il server di sviluppo:
```bash
npm run dev
```
L'app sarà disponibile all'indirizzo: [http://localhost:4321](http://localhost:4321)

---

## 📦 Build per Produzione

Per creare la versione ottimizzata per la produzione:

```bash
npm run build
```

Per visualizzare l'anteprima della build:
```bash
npm run preview
```

## 📄 Licenza
Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.