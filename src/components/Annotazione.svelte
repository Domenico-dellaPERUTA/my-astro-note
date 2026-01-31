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
    import { renderMarkdown } from "../lib/markdown";

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
        </div>
        <label for="testo">Testo (Markdown):</label>
        <div class="editor-container">
            <textarea id="testo" bind:value={testo}></textarea>
            <div class="sidebar-tools">
                <button class="save" type="submit">💾 SALVA NOTA</button>
                <div class="markdown-legend">
                    <h4>Markdown Help</h4>
                    <ul>
                        <li><b>**Bold**</b></li>
                        <li><i>*Italic*</i></li>
                        <li># Header 1</li>
                        <li>## Header 2</li>
                        <li>++Underline++</li>
                        <li>- List item</li>
                        <li>[Link](url)</li>
                        <li>`Code`</li>
                        <li>```block```</li>
                    </ul>
                </div>
            </div>
        </div>
    </form>
{:else}
    <div class="annotazione">
        <span class="pin">📍 </span>
        <h2>{titolo}</h2>
        <div class="testo">{@html html}</div>
    </div>
{/if}

<!-- [ Style ] ---------------------------------------------------------------------------------->
<style>
    .pin {
        position: absolute;
        top: -1rem;
        left: 0.5rem;
        font-size: 3rem;
        overflow: visible;
    }
    .annotazione {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 20px;
        font-family: var(--font-main);
        background-color: #fffcf0; /* Ligher paper for the sheet */
        padding: 40px;
        /* Paper effect */
        box-shadow:
            1px 1px 3px rgba(0, 0, 0, 0.1),
            5px 5px 0px rgba(0, 0, 0, 0.05);
        margin: 20px;
        max-width: 1200px;
        min-height: 80vh;
    }

    h2 {
        border-bottom: 2px solid var(--text-ink);
        padding-bottom: 10px;
        margin-top: 0;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .editor-container {
        display: flex;
        gap: 30px;
        height: 100%;
        flex: 1;
    }

    .sidebar-tools {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 220px;
    }

    .markdown-legend {
        width: 100%;
        padding: 15px;
        background: #fff8dc; /* Sticky note yellow */
        background-image: linear-gradient(#fcf4d4 1px, transparent 1px);
        background-size: 100% 1.5rem;
        border-radius: 2px;
        font-size: 0.85rem;
        border: 1px solid #e0d0a0;
        height: fit-content;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
        transform: rotate(1deg); /* Slight handcrafted rotation */
    }

    .markdown-legend h4 {
        margin: -5px 0 15px 0;
        font-family: sans-serif; /* Contrast font for 'printed' instructions */
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #888;
        letter-spacing: 1px;
        border-bottom: none;
    }

    .markdown-legend ul {
        list-style: none;
        padding: 0;
        margin: 0;
        line-height: 1.5rem; /* Match grid lines */
    }

    .markdown-legend li {
        margin-bottom: 0;
        font-family: var(--font-main);
        color: #555;
    }

    label {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 1px;
        color: #666;
    }

    input[type="text"],
    textarea,
    .testo {
        width: 100%;
        padding: 15px;
        border: 2px solid transparent; /* Reset borders */
        font-family: var(--font-main);
        font-size: 1.1rem;
        line-height: 1.6;
        color: var(--text-ink);
        outline: none;
    }

    input[type="text"] {
        border-bottom: 1px dashed #ccc;
        background-color: #ffffff;
        font-size: 1.5rem;
        font-weight: bold;
    }

    input[type="text"]:focus {
        border-bottom-color: var(--highlight);
        background-color: #ffffff;
    }

    .testo {
        border: none;
        width: 100%;
    }

    .testo :global(img) {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1rem 0;
        box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
        border: 1px solid #ddd;
    }

    /* Stile corsivo "a mano" per il testo enfatizzato */
    .testo :global(em),
    .testo :global(i) {
        font-family: "Brush Script MT", "Brush Script Std", "Lucida Calligraphy",
            "Lucida Handwriting", "Apple Chancery", cursive;
        font-size: 1.7rem; /* Leggermente più grande perché questi font sono spesso piccoli */
        color: #4e73ab;
        font-style: normal; /* Il font è già "storto", non serve inclinare */
    }

    textarea {
        background-color: #ffffff; /* Explicit white background */
        border: 1px solid #ccc;
        box-shadow: inset 1px 1px 5px rgba(0, 0, 0, 0.05); /* Slight inset for depth */
        resize: vertical;
        height: 60vh;
        flex-grow: 1;
        width: auto;
        color: #000; /* Deep black ink */
        font-size: 1rem;
        font-family: var(--font-main);
    }

    textarea:focus {
        border-color: var(--highlight);
        box-shadow:
            inset 1px 1px 5px rgba(0, 0, 0, 0.05),
            0 0 0 2px rgba(212, 93, 93, 0.1);
    }

    .save {
        align-self: flex-start;
        background-color: #aa4b4b;
        color: white;
        border: none;
        padding: 1rem 1.5rem;
        text-align: center;
        text-decoration: none;
        display: block;
        width: 100%;
        font-size: 1.1rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        cursor: pointer;
        border-radius: 2px;
        box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.3); /* Stronger shadow/button press feel */
        transition: all 0.1s;
        border: 1px solid #b74141; /* Slightly darker border */
    }

    .save:hover {
        background-color: #e56b6b;
        transform: translateY(-1px);
        box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.3);
    }

    .save:active {
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.3);
    }
</style>
