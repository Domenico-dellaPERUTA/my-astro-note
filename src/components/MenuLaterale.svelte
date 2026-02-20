<!--
---------------------------------------------------------------------------------------------------
 src/components/MenuLaterale.svelte 
---------------------------------------------------------------------------------------------------
-->
<!-- [ Controller ] ------------------------------------------------------------------------------>
<script lang="ts">
  import {
    selectedNoteIndex,
    notes,
    message,
    isEdit,
    userRole,
    clipboardNote,
    loadNotesFromDb,
    type Nota,
  } from "../stores/notesStore";
  import { onDestroy, onMount } from "svelte";
  import { actions } from "astro:actions";
  import MenuVoce from "./MenuVoce.svelte";

  export let titolo = "Lista Note";
  export let initialNotes: Nota[] = [];
  export let initialId: string | null = null;

  // Flag per indicare che lo stato è stato ripristinato e il salvataggio può iniziare
  let restored = false;

  onMount(() => {
    try {
      // 1. Inizializza le note se fornite
      if (initialNotes.length > 0) {
        notes.set(initialNotes);
      }

      // 2. Ripristina lo stato
      let idToRestore = null;

      // Lettura lato client (più robusta per SPA/Static/Apache)
      const urlParams = new URLSearchParams(window.location.search);
      const clientUrlId = urlParams.get("id");

      // Helper per sessionStorage sicuro (Firefox può lanciare errori in modalità privacy)
      const getSession = (key: string) => {
        try {
          return sessionStorage.getItem(key);
        } catch (e) {
          return null;
        }
      };

      const sessionLastId = getSession("lastSelectedNoteId");

      if (clientUrlId) {
        // Priorità 0: URL Client (vince su tutto perché è quello che l'utente vede)
        idToRestore = clientUrlId;
      } else if (initialId) {
        // Priorità 1: URL Server (se passato)
        idToRestore = initialId;
      } else {
        // Priorità 2: Sessione
        idToRestore = sessionLastId;
      }

      if (idToRestore && initialNotes.length > 0) {
        const idx = initialNotes.findIndex(
          (n) => n.id.toString() === idToRestore,
        );
        if (idx !== -1) {
          selectedNoteIndex.set(idx);
        }
      }

      const savedIsEdit = getSession("lastIsEdit");
      if (savedIsEdit === "true") {
        isEdit.set(true);
      }

      // 3. Dopo il ripristino, abilita il salvataggio automatico
      restored = true;
    } catch (err: any) {
      console.error("Error in onMount:", err);
    }
  });

  // Reactive statements per il salvataggio automatico in sessionStorage e aggiornamento URL
  $: if (restored && $notes.length > 0) {
    const note = $notes[$selectedNoteIndex];
    if (note) {
      const noteId = note.id.toString();
      try {
        sessionStorage.setItem("lastSelectedNoteId", noteId);
      } catch (e) {}

      // Aggiorna URL senza ricaricare la pagina
      if (typeof window !== "undefined") {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("id", noteId);
        window.history.pushState({}, "", newUrl.toString());
      }
    } else {
      try {
        sessionStorage.removeItem("lastSelectedNoteId");
      } catch (e) {}
    }
  }

  $: if (restored && typeof window !== "undefined") {
    try {
      sessionStorage.setItem("lastIsEdit", $isEdit.toString());
    } catch (e) {}
  }

  // Converte la lista delle note in una struttura ad albero
  $: listaAlbero = creaAlberoNote($notes);

  // Costruisce l'albero delle note
  function creaAlberoNote(lista: Nota[]): Nota[] {
    const nodoPrincipale: Nota[] = [];
    const mappa = new Map<number, Nota>();

    // Inizializza la mappa con i nodi e array children
    lista.forEach((note) => {
      mappa.set(note.id, { ...note, children: [] });
    });

    // Collega i figli ai loro genitori
    lista.forEach((note) => {
      const node = mappa.get(note.id)!;
      if (note.parent_id && mappa.has(note.parent_id)) {
        mappa.get(note.parent_id)!.children!.push(node);
      } else {
        nodoPrincipale.push(node);
      }
    });

    return nodoPrincipale;
  }

  async function seleziona(evento: CustomEvent<Nota>) {
    const nota = evento.detail;
    const indice = $notes.findIndex((n) => n.id === nota.id);
    selectedNoteIndex.set(indice);
    isEdit.set(false);
  }

  async function edita() {
    isEdit.set(true);
  }

  async function cancella(evento: CustomEvent<Nota>) {
    const nota = evento.detail;
    const indice = $notes.findIndex((n) => n.id === nota.id);

    message.set({
      text: `Vuoi davvero eliminare la nota "${nota.title}" e tutti i suoi figli?`,
      type: "confirmation",
      confirm: async () => {
        try {
          const { error } = await actions.deleteNote({ id: nota.id });
          if (error) throw new Error("Errore nell'eliminazione");

          await loadNotesFromDb();

          if ($selectedNoteIndex === indice) {
            selectedNoteIndex.set(-1);
          }
        } catch (error) {
          console.error(error);
          message.set({ text: "Errore durante l'eliminazione", type: "error" });
        }
      },
    });
  }

  async function aggiungiFiglio(evento: CustomEvent<Nota>) {
    const parent = evento.detail;
    await aggiungiVoce(parent.id);
  }

  async function aggiungiVoce(parentId?: number) {
    try {
      const title = `Nota [${$notes.length + 1}] - ${new Date().toLocaleDateString("it-IT", { year: "numeric", month: "2-digit", day: "2-digit" })}`;
      const content = `Contenuto della nota ${$notes.length + 1} ...`;

      const { data, error } = await actions.createNote({
        title,
        content,
        parentId,
      });

      if (error || !data) throw new Error("Errore nella creazione");

      notes.update((currentNotes) => {
        const updatedNotes = [...currentNotes, data as Nota];
        const newIndex = updatedNotes.findIndex((n) => n.id === data.id);
        selectedNoteIndex.set(newIndex);
        return updatedNotes;
      });
      isEdit.set(true);
    } catch (error) {
      const errorMessage = "Errore nella creazione della nota";
      message.set({ text: errorMessage, type: "error" });
      console.error(errorMessage + ":", error);
    }
  }

  async function incollaRadice() {
    const notaDaSpostare = $clipboardNote;
    if (!notaDaSpostare) return;

    try {
      const { error } = await actions.updateNote({
        id: notaDaSpostare.id,
        title: notaDaSpostare.title,
        content: notaDaSpostare.content,
        parentId: null, // Sposta alla radice
      });

      if (error) throw new Error("Errore nello spostamento");

      await loadNotesFromDb();
      clipboardNote.set(null);
      message.set({ text: "Nota spostata alla radice!", type: "success" });
    } catch (error) {
      console.error(error);
      message.set({ text: "Errore durante lo spostamento", type: "error" });
    }
  }
</script>

<!-- [ View ] ------------------------------------------------------------------------------------>
<aside class="menu-laterale">
  <h2>
    {titolo}
    {#if $userRole === "admin"}
      <div style="display: inline-flex;">
        {#if $clipboardNote}
          <button
            on:click={() => incollaRadice()}
            title="Incolla come radice"
            style="background:#4a90e2; margin-right:5px;"
          >
            📋
          </button>
        {/if}
        <button on:click={() => aggiungiVoce()} title="Nuova nota radice">
          ➕
        </button>
      </div>
    {/if}
  </h2>

  <ul>
    {#each listaAlbero as rootNote (rootNote.id)}
      <MenuVoce
        nota={rootNote}
        indiceSelezionato={$notes[$selectedNoteIndex]?.id}
        on:select={seleziona}
        on:edit={edita}
        on:delete={cancella}
        on:add-child={aggiungiFiglio}
      />
    {/each}
  </ul>

  <div class="guida-link-container">
    <a href="/guida" class="guida-link"> 📖 Guida ed Help </a>
  </div>
</aside>

<!-- [ Style ] ---------------------------------------------------------------------------------->
<style>
  .menu-laterale {
    top: 0;
    width: 100%;
    height: 100%;
    background-color: var(--sidebar-bg); /* Dark metal look */
    border-right: 4px solid #1a1a1a;
    padding: 0rem;
    margin: 0rem;
    color: #e0e0e0;
    font-family: var(--font-main);
    font-size: medium;
    box-shadow: inset -5px 0 15px rgba(0, 0, 0, 0.5);
    overflow-y: auto;
  }

  h2 {
    font-size: 1.4rem;
    margin-bottom: 20px;
    color: #f4ecd8; /* Paper color text */
    margin: 1rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 2px dashed #555;
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 button {
    background: #d45d5d;
    border: 1px solid #555;
    color: #fff;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    padding: 0;
    font-size: 1.2rem;
    transition: all 0.2s;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  h2 button:hover {
    background: #444;
    border-color: #fff;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  .guida-link-container {
    margin-top: 2rem;
    padding: 1rem;
    border-top: 1px solid #444;
  }

  .guida-link {
    display: block;
    padding: 0.8rem;
    background-color: #3d3d3d;
    color: #f4ecd8;
    text-decoration: none;
    text-align: center;
    border-radius: 4px;
    border: 1px solid #555;
    transition: all 0.2s;
    font-weight: bold;
  }

  .guida-link:hover {
    background-color: #4d4d4d;
    border-color: var(--highlight);
    color: var(--highlight);
    transform: translateY(-2px);
  }
</style>
