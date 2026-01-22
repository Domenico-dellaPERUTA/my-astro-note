<script lang="ts">
    import { selectedNoteIndex, notes, type Nota } from '../stores/notesStore';
  
   // export let listaNote: string[] = [];
    export let testo = "";

    $: titolo = $notes.at($selectedNoteIndex)?.title ?? "";
    $: testo = $notes.at($selectedNoteIndex)?.content ?? "";

    function saveNote(params: { title: string; content: string }) {
        if ($selectedNoteIndex === -1) return;
        notes.update(notes => {
            const updatedNotes = [...notes];
            updatedNotes[$selectedNoteIndex] = { title: params.title, content: params.content };
            return updatedNotes;
        });
    }
</script>

<form class="annotazione" on:submit|preventDefault={() => saveNote({ title: titolo, content: testo })}>
    <label for="titolo">Titolo:</label>
    <div><input type="text" id="titolo" bind:value={titolo} /> <input class="save" type="submit" value="💾 Salva" /></div>
    <label for="testo">Testo:</label>
    <textarea id="testo" bind:value={testo}></textarea>
</form>

<style>
    .annotazione {
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-family: 'Courier New', Courier, monospace;
        background-color: #f9f9f9;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }

    label {
        font-weight: bold;
    }

    input[type="text"], textarea {
        width: 90%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: 'Courier New', Courier, monospace;
        font-size: large;
        display: inline;
    }

    textarea {
        resize: vertical;
        height: 45rem;
        width: 99%;
    }
    .save {
        align-self: flex-start;
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin-top: 10px;
        cursor: pointer;
        border-radius: 4px;
    }
</style>