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
      const title = `Appunto ${$notes.length + 1}`;
      const content = `Contenuto dell'appunto ${$notes.length + 1}`;

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
    background-color: #7b7b7f;
    border-right: 2px solid #dddddd;
    padding: 0rem;
    margin: 0rem;
    color: #ffffff;
    font-family: "Courier New", Courier, monospace;
    font-size: medium;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 15px;
    color: #fff;
    margin: 0.5rem;
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
    border-bottom: 1px solid #ffffff;
    color: #fff;
  }

  li > button:first-child {
    flex: 1;
    padding: 10px;
    text-align: left;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    font-family: "Courier New", Courier, monospace;
    font-size: medium;
  }

  .selected {
    background-color: #2e6a32 !important;
  }

  li > button:first-child:hover {
    background-color: #444449;
  }
  li > button {
    margin: 0;
    padding-left: 1rem;
  }
  button {
    margin-left: 10px;
    cursor: pointer;
    font-size: 1rem;
    right: 0rem;
  }
  .elimina,
  .modifica {
    margin-left: 0;
  }
</style>
