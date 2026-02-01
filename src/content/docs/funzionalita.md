---
title: "Gestione delle Note"
description: "Come creare, modificare ed eliminare le tue note."
order: 3
---
# Gestione delle Note

In questa sezione imparerai a gestire i tuoi contenuti.

## Creare una nuova nota
Fai clic sul pulsante **➕** nel menu laterale per creare una nuova nota alla radice. Se vuoi creare una nota all'interno di un'altra, usa l'icona "aggiungi" accanto al titolo della nota madre.

## Modificare una nota
Seleziona una nota dalla lista e fai clic su **📝 Modifica**. Ricordati di salvare le modifiche!

## Eliminare una nota
Fai clic sull'icona **🗑️** per eliminare una nota. **Attenzione**: l'eliminazione di una nota eliminerà anche tutte le sue "figlie".

## Spostare una nota (Taglia e Incolla)
Puoi riorganizzare l'albero delle note spostando una nota in una nuova posizione.

1.  **Taglia**: Accanto al titolo della nota che vuoi spostare, fai clic sull'icona delle forbici **✂️**. La nota entrerà in modalità "taglio".
2.  **Scegli la destinazione**:
    *   Per spostarla **all'interno** di un'altra nota: fai clic sull'icona della cartella/appunti **📋** accanto alla nota di destinazione.
    *   Per spostarla alla **radice** (root): fai clic sul pulsante **📋 Incolla alla radice** che appare in cima al menu laterale.
3.  **Annulla**: Se cambi idea, fai clic sulla **❌** accanto alla nota tagliata per annullare l'operazione.

> [!NOTE]
> Quando sposti una nota, tutti i suoi contenuti e le sue note "figlie" verranno spostati insieme a lei, mantenendo la gerarchia intatta.

## Formattazione Avanzata
L'editor supporta il classico Markdown ma con alcune **funzionalità speciali**:

- **Sottolineato**: Usa il doppio più per sottolineare il testo.
  - Esempio: `++testo sottolineato++` → <u>testo sottolineato</u>
- **Stile "Mano"**: Il testo in corsivo (`*testo*` o `_testo_`) viene visualizzato con un font che simula la scrittura a mano, ideale per appunti personali o enfasi.

## Collegamenti tra Note
Puoi creare facilmente collegamenti interni tra le tue note per costruire una wiki personale.

1. Entra in modalità **Modifica** ✏️.
2. Nel menu laterale, accanto al titolo della nota che vuoi linkare, clicca sull'icona della catena **🔗**.
3. Il link Markdown (es. `[Titolo](/?id=123)`) verrà copiato negli appunti.
4. Incollalo nel testo della nota che stai scrivendo.

## Gestione Media (Immagini e File)
Se sei un amministratore, puoi gestire i file multimediali tramite il pulsante **📁 File** nella barra superiore.

1. **Caricamento**: Puoi caricare immagini o documenti nella cartella `WebApp`.
2. **Inserimento nelle Note**: 
   - Nel File Manager, clicca sull'icona della catena **🔗** accanto a un file per copiare negli appunti il codice Markdown.
   - Incolla questo codice nel testo della tua nota per visualizzare il file (es: `![immagine](/WebApp/foto.jpg)`).
3. **Organizzazione**: Crea cartelle, rinomina o elimina i file per tenere tutto in ordine.

