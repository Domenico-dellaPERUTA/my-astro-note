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
    type Nota,
  } from "../stores/notesStore";
  import { onMount } from "svelte";
  import MenuVoce from "./MenuVoce.svelte";

  export let titolo = "Lista Note";
  export let initialNotes: Nota[] = [];

  onMount(() => {
    if (initialNotes.length > 0) {
      notes.set(initialNotes);
    }
  });

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
          const response = await fetch(`/api/note/${nota.id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Errore nell'eliminazione");

          const datiBE = await fetch("/api/notes");
          const noteAggiornate = await datiBE.json();
          notes.set(noteAggiornate);

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

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, parentId }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Errore nella creazione");

      notes.update((currentNotes) => {
        const updatedNotes = [...currentNotes, data];
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
</script>

<!-- [ View ] ------------------------------------------------------------------------------------>
<aside class="menu-laterale">
  <h2>
    {titolo}
    {#if $userRole === "admin"}
      <button on:click={() => aggiungiVoce()} title="Nuova nota radice">
        ➕
      </button>
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
</style>
