<script lang="ts">
    import {
        selectedNoteIndex,
        notes,
        message,
        isEdit,
        type Nota,
    } from "../stores/notesStore";
    import { marked } from "marked";
    import DOMPurify from "dompurify";

    $: titolo = $notes.at($selectedNoteIndex)?.title ?? "";
    $: testo = $notes.at($selectedNoteIndex)?.content ?? "";

    //$: html = DOMPurify.sanitize(marked.parser(testo));

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
        <textarea id="testo" bind:value={testo}></textarea>
    </form>
{:else}
    <div class="annotazione">
        <h2>{titolo}</h2>
        <!--
    <div class="testo">{@html html}</div>
    -->
        <div class="testo">{testo}</div>
    </div>
{/if}

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
    }

    textarea,
    .testo {
        resize: vertical;
        height: 45rem;
        width: 99%;
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
