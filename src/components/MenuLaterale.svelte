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
    type Nota,
  } from "../stores/notesStore";
  import { onMount } from "svelte";

  export let titolo = "Lista Note";
  export let initialNotes: Nota[] = [];

  onMount(() => {
    if (initialNotes.length > 0) {
      notes.set(initialNotes);
    }
  });

  async function eliminaVoce(index: number) {
    const noteId = $notes[index]?.id;
    if (!noteId) return;

    try {
      message.set({
        text: `Vuoi davvero, eliminare la nota "${$notes[index].title}" ?`,
        type: "confirmation",
        confirm: async () => {
          const response = await fetch(`/api/note/${noteId}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Errore nell'eliminazione");

          notes.update((notes) => notes.filter((_, i) => i !== index));

          if ($selectedNoteIndex === index) {
            selectedNoteIndex.set(-1);
          }
        },
      });
    } catch (error) {
      const errorMessage = "Errore nell'eliminazione della nota";
      message.set({ text: errorMessage, type: "error" });
      console.error(errorMessage + ":", error);
    }
  }

  async function aggiungiVoce() {
    try {
      const title = `Nota [${$notes.length + 1}] - ${new Date().toLocaleDateString("it-IT", { year: "numeric", month: "2-digit", day: "2-digit" })}`;
      const content = `Contenuto della nota ${$notes.length + 1} ...`;

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Errore nella creazione");

      notes.update((notes) => [...notes, data]);
      selectedNoteIndex.set($notes.length - 1); // Seleziona la nuova nota
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
  <h2>{titolo} <button on:click={aggiungiVoce}> ➕ </button></h2>
  <ul>
    {#each $notes as voce, index}
      <li>
        <!-- voce menu -->
        <button
          type="button"
          class={$selectedNoteIndex === index ? "selected" : ""}
          on:click={() => {
            selectedNoteIndex.set(index);
            isEdit.set(false);
          }}
        >
          {voce.title}
        </button>
        <!-- pulsante modifica voce menu -->
        <button type="button" on:click={() => isEdit.set(true)} class="modifica"
          >✏️</button
        >
        <!-- pulsante eliminazione voce menu -->
        <button
          type="button"
          on:click={() => eliminaVoce(index)}
          class="elimina">🗑️</button
        >
      </li>
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
  }

  h2 button:hover {
    background: #444;
    border-color: #fff;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0;
    border-bottom: 1px solid #444;
    color: #ccc;
    transition: background-color 0.2s;
  }

  li:hover {
    background-color: #383838;
  }

  li > button:first-child {
    flex: 1;
    padding: 12px 15px;
    text-align: left;
    background: none;
    border: none;
    color: #ccc;
    cursor: pointer;
    font-family: var(--font-main);
    font-size: 1rem;
    transition: color 0.2s;
  }

  li > button:first-child:hover {
    color: #fff;
    background: none;
  }

  .selected {
    background-color: #d45d5d !important; /* Highlight red tape */
    color: #fff !important;
    position: relative;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  }

  .selected::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: #fff;
  }

  li > button {
    margin: 0;
  }
  button {
    margin-right: 10px;
    cursor: pointer;
    font-size: 1rem;
    background: none;
    border: none;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  button:hover {
    opacity: 1;
  }

  .elimina:hover {
    filter: grayscale(0) !important;
    transform: scale(1.1);
  }
</style>
