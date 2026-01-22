<script lang="ts">
  import { selectedNoteIndex , notes, type Nota } from '../stores/notesStore';
  
  export let titolo = "Lista Note";
  //export let voci: string[] = [];

  function eliminaVoce(index: number) {
    notes.update(notes => notes.filter((_, i) => i !== index));
  }
  
  function aggiungiVoce() {
    const nuovaVoce = { title: `Appunto ${$notes.length + 1}`, content: `Contenuto dell'appunto ${$notes.length + 1}` };
    notes.update(notes => [...notes, nuovaVoce]);
  }
</script>

<aside class="menu-laterale">
  <h2>{titolo} <button on:click={aggiungiVoce}> ➕ </button></h2>
  <ul>
    {#each $notes as voce, index}
      <li>
        <button 
          type="button" 
          class={$selectedNoteIndex === index ? "selected" : ""} 
          on:click={() => selectedNoteIndex.set(index)}
        >
          {voce.title}
        </button>
        <button type="button" on:click={() => eliminaVoce(index)} class="elimina">🗑️</button>
      </li>
    {/each}
  </ul>
</aside>

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
  .elimina {
    margin-left: 0;
  }
</style>
