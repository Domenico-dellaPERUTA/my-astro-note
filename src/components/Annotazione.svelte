<!--
---------------------------------------------------------------------------------------------------
 src/components/Annotazione.svelte 
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
    import { renderMarkdown } from "../utils/markdown";

    $: titolo = $notes.at($selectedNoteIndex)?.title ?? "";
    $: testo = $notes.at($selectedNoteIndex)?.content ?? "";

    let html = "";
    $: renderMarkdown(testo).then((res) => (html = res));

    async function saveNote(params: { title: string; content: string }) {
        if ($selectedNoteIndex === -1) return;

        const noteId = $notes[$selectedNoteIndex]?.id;
        if (!noteId) return;

        try {
            // Effettua la chiamata API per salvare la nota
            const response = await fetch(`/api/note/${noteId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const errorMessage = "Errore nel salvataggio";
                message.set({ text: errorMessage, type: "error" });
                throw new Error(errorMessage);
            } else {
                message.set({
                    text: `Nota "${params.title}" salvata con successo!`,
                    type: "success",
                });
                isEdit.set(false);
            }

            // Aggiorna lo store locale
            notes.update((notes) => {
                const updatedNotes = [...notes];
                updatedNotes[$selectedNoteIndex] = {
                    ...updatedNotes[$selectedNoteIndex],
                    title: params.title,
                    content: params.content,
                };
                return updatedNotes;
            });
        } catch (error) {
            const errorMessage = "Errore nel salvataggio della nota";
            message.set({ text: errorMessage, type: "error" });
            console.error(errorMessage + ":", error);
        }
    }
</script>

<!-- [ View ] ------------------------------------------------------------------------------------>
{#if $isEdit}
    <form
        class="annotazione"
        on:submit|preventDefault={() =>
            saveNote({ title: titolo, content: testo })}
    >
        <label for="titolo">Titolo:</label>
        <div>
            <input type="text" id="titolo" bind:value={titolo} />
            <input class="save" type="submit" value="💾 Salva" />
        </div>
        <label for="testo">Testo:</label>
        <div class="editor-container">
            <textarea id="testo" bind:value={testo}></textarea>
            <div class="markdown-legend">
                <h4>Markdown Help</h4>
                <ul>
                    <li><b>**Bold**</b></li>
                    <li><i>*Italic*</i></li>
                    <li># Header 1</li>
                    <li>## Header 2</li>
                    <li>- List item</li>
                    <li>[Link](url)</li>
                    <li>`Code`</li>
                    <li>```block```</li>
                </ul>
            </div>
        </div>
    </form>
{:else}
    <div class="annotazione">
        <h2>{titolo}</h2>
        <div class="testo">{@html html}</div>
    </div>
{/if}

<!-- [ Style ] ---------------------------------------------------------------------------------->
<style>
    .annotazione {
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-family: "Courier New", Courier, monospace;
        background-color: #f9f9f9;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }

    .editor-container {
        display: flex;
        gap: 15px;
    }

    .markdown-legend {
        width: 200px;
        padding: 10px;
        background: #eee;
        border-radius: 4px;
        font-size: 0.85rem;
        border: 1px solid #ccc;
        height: fit-content;
    }

    .markdown-legend h4 {
        margin: 0 0 10px 0;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
    }

    .markdown-legend ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .markdown-legend li {
        margin-bottom: 5px;
        font-family: monospace;
    }

    label {
        font-weight: bold;
    }

    input[type="text"],
    textarea,
    .testo {
        width: 90%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: "Courier New", Courier, monospace;
        font-size: large;
        display: inline;
    }

    .testo {
        border: 1px solid #cccccc00;
        width: 100%; /* Full width when viewing */
    }

    textarea {
        resize: vertical;
        height: 45rem;
        flex-grow: 1; /* Allow textarea to take remaining space */
        width: auto; /* Override previous width: 99% */
    }

    .save {
        align-self: flex-start;
        background-color: #4caf50;
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
