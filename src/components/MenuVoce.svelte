<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { slide } from "svelte/transition";
    import {
        userRole,
        isEdit,
        message,
        notes,
        clipboardNote,
        loadNotesFromDb,
        type Nota,
    } from "../stores/notesStore";

    export let nota: Nota;
    export let indiceSelezionato: number;
    export let livello = 0;

    const dispatch = createEventDispatcher();
    let expanded = false;

    function toggleExpand() {
        expanded = !expanded;
    }

    async function copiaLink(notaTarget: Nota) {
        const link = `[${notaTarget.title}](/?id=${notaTarget.id})`;
        try {
            await navigator.clipboard.writeText(link);
            message.set({ text: "Link copiato: " + link, type: "success" });
        } catch (err) {
            console.error("Errore copia:", err);
            message.set({ text: "Impossibile copiare il link", type: "error" });
        }
    }

    function tagliaNota(notaTarget: Nota) {
        clipboardNote.set(notaTarget);
        message.set({
            text: `Nota "${notaTarget.title}" tagliata. Seleziona dove incollarla.`,
            type: "info",
        });
    }

    async function incollaNota(nuovoGenitore: Nota) {
        const notaDaSpostare = $clipboardNote;
        if (!notaDaSpostare) return;

        try {
            const response = await fetch(`/api/note/${notaDaSpostare.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: notaDaSpostare.title,
                    content: notaDaSpostare.content,
                    parentId: nuovoGenitore.id,
                }),
            });

            if (!response.ok) throw new Error("Errore nello spostamento");

            await loadNotesFromDb();
            clipboardNote.set(null);
            message.set({
                text: "Nota spostata con successo!",
                type: "success",
            });

            // Espandi il genitore per mostrare il figlio
            if (!expanded) expanded = true;
        } catch (error) {
            console.error(error);
            message.set({
                text: "Errore durante lo spostamento",
                type: "error",
            });
        }
    }

    // Helper per verificare se siamo dentro il sottoalbero della nota tagliata (per evitare cicli)
    function isDescendant(parent: Nota, childId: number): boolean {
        if (!parent.children) return false;
        return parent.children.some(
            (c) => c.id === childId || isDescendant(c, childId),
        );
    }

    // Calcoliamo se il bottone Incolla è abilitato per questa voce
    $: canPaste =
        $clipboardNote &&
        $clipboardNote.id !== nota.id &&
        !isDescendant($clipboardNote, nota.id);

    // Calculate indentation based on level
    $: indentStyle = `padding-left: ${livello * 15 + 10}px`;
</script>

<li class="menu-voce-container">
    <div class="menu-voce">
        <!-- Icona per espandere/collassare -->
        {#if nota.children && nota.children.length > 0}
            <button class="toggle-btn" on:click|stopPropagation={toggleExpand}>
                {expanded ? "▼" : "▶"}
            </button>
        {:else}
            <span class="spacer"></span>
        {/if}

        <button
            type="button"
            class="title-btn {indiceSelezionato === nota.id ? 'selected' : ''}"
            style={indentStyle}
            on:click={() => dispatch("select", nota)}
        >
            {#if nota.type === "quiz"}
                <span class="type-icon">❓</span>
            {/if}
            {nota.title}
        </button>

        {#if $userRole === "admin"}
            <div class="actions">
                <!-- Pulsante Aggiungi Sotto-nota -->
                <button
                    type="button"
                    class="action-btn add-child"
                    title="Aggiungi sotto-nota"
                    on:click|stopPropagation={() => dispatch("add-child", nota)}
                >
                    ➕
                </button>

                <!-- Pulsante Taglia (✂️) - Solo se clipboard vuota -->
                {#if !$clipboardNote}
                    <button
                        type="button"
                        class="action-btn cut"
                        title="Taglia (sposta)"
                        on:click|stopPropagation={() => tagliaNota(nota)}
                    >
                        ✂️
                    </button>
                {/if}

                <!-- Pulsante Incolla (📋) - Solo se clipboard piena e target valido -->
                {#if canPaste}
                    <button
                        type="button"
                        class="action-btn paste"
                        title="Incolla qui dentro"
                        on:click|stopPropagation={() => incollaNota(nota)}
                    >
                        📋
                    </button>
                {/if}

                <!-- Pulsante Copia Link -->
                <button
                    type="button"
                    class="action-btn copy-link"
                    title="Copia Link Markdown"
                    on:click|stopPropagation={() => copiaLink(nota)}
                >
                    🔗
                </button>

                <!-- Pulsante Modifica (Toggle) -->
                <button
                    type="button"
                    class="action-btn edit {$isEdit &&
                    indiceSelezionato === nota.id
                        ? 'active'
                        : ''}"
                    title={$isEdit && indiceSelezionato === nota.id
                        ? "Fine Modifica"
                        : "Modifica"}
                    on:click|stopPropagation={() => {
                        if ($isEdit && indiceSelezionato === nota.id) {
                            isEdit.set(false);
                        } else {
                            dispatch("select", nota); // Seleziona prima
                            dispatch("edit", nota); // Poi attiva edit
                        }
                    }}
                >
                    ✏️
                </button>

                <!-- Pulsante Elimina -->
                <button
                    type="button"
                    class="action-btn delete"
                    title="Elimina"
                    on:click|stopPropagation={() => dispatch("delete", nota)}
                >
                    🗑️
                </button>
            </div>
        {/if}
    </div>

    <!-- Recursive Children -->
    {#if nota.children && nota.children.length > 0 && expanded}
        <ul transition:slide|local={{ duration: 200 }}>
            {#each nota.children as child (child.id)}
                <svelte:self
                    nota={child}
                    {indiceSelezionato}
                    livello={livello + 1}
                    on:select
                    on:edit
                    on:delete
                    on:add-child
                />
            {/each}
        </ul>
    {/if}
</li>

<style>
    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .menu-voce {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #444;
        color: #ccc;
        transition: background-color 0.2s;
        font-family: var(--font-main);
    }

    .menu-voce:hover {
        background-color: #383838;
    }

    .title-btn {
        flex: 1;
        text-align: left;
        background: none;
        border: none;
        color: #ccc;
        cursor: pointer;
        font-family: var(--font-main);
        font-size: 1rem;
        padding: 12px 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .title-btn:hover {
        color: #fff;
    }

    .selected {
        background-color: #d45d5d;
        color: #1a1a1a !important;
        font-family: "Courier New", Courier, monospace; /* Tocco typewriter */
        font-weight: bold;
        text-decoration: none;
        border-radius: 2px;
        border: 1px solid #a34646; /* Bordo leggermente più scuro per profondità */
        box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    }

    .actions {
        display: flex;
        padding-right: 5px;
        opacity: 0.6;
        transition: opacity 0.2s;
    }

    .menu-voce:hover .actions {
        opacity: 1;
    }

    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        margin-left: 5px;
        padding: 2px;
    }

    .toggle-btn {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 0.7rem;
        width: 20px;
        text-align: center;
        padding: 0;
    }

    .spacer {
        width: 20px;
    }

    .delete:hover {
        filter: grayscale(0);
        transform: scale(1.1);
    }

    .action-btn.edit.active {
        background-color: #d45d5d;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(212, 93, 93, 0.6);
        transform: scale(1.1);
    }
</style>
