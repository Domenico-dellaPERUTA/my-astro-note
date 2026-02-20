<script lang="ts">
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
    import { actions } from "astro:actions";

    let {
        nota,
        indiceSelezionato,
        livello = 0,
        onSelect,
        onEdit,
        onDelete,
        onAddChild,
    } = $props<{
        nota: Nota;
        indiceSelezionato: number;
        livello?: number;
        onSelect?: (nota: Nota) => void;
        onEdit?: (nota: Nota) => void;
        onDelete?: (nota: Nota) => void;
        onAddChild?: (nota: Nota) => void;
    }>();

    let expanded = $state(false);

    function seleziona() {
        onSelect?.(nota);
    }

    function edita() {
        onEdit?.(nota);
    }

    function cancella() {
        onDelete?.(nota);
    }

    function aggiungiFiglio() {
        onAddChild?.(nota);
    }

    function toggleExpand() {
        expanded = !expanded;
    }

    let showMenu = $state(false);

    function toggleMenu() {
        showMenu = !showMenu;
    }

    function closeMenu() {
        showMenu = false;
    }

    // Chiudi il menu se si clicca altrove nella pagina (gestione globale opzionale,
    // ma qui usiamo un backdrop locale o event listener su window per sicurezza)
    function handleGlobalClick() {
        if (showMenu) closeMenu();
    }

    /**
     * Fallback per la copia negli appunti.
     * Usato quando navigator.clipboard non è disponibile (es. contesti non HTTPS).
     */
    function fallbackCopy(text: string) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // Impedisce lo scrolling durante l'operazione
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            // execCommand è deprecato ma è l'unico modo in contesti non sicuri
            const successful = document.execCommand("copy");
            if (successful) {
                message.set({ text: "Link copiato: " + text, type: "success" });
            } else {
                throw new Error("execCommand copy failed");
            }
        } catch (err) {
            console.error("Errore fallback copy:", err);
            message.set({ text: "Impossibile copiare il link", type: "error" });
        }
        document.body.removeChild(textArea);
    }

    /**
     * Copia il link markdown della nota.
     * Tenta di usare la Clipboard API moderna, altrimenti ricorre al fallback.
     */
    async function copiaLink(notaTarget: Nota) {
        const link = `[${notaTarget.title}](/?id=${notaTarget.id})`;

        // La Clipboard API richiede un contesto sicuro (HTTPS o localhost)
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(link);
                message.set({ text: "Link copiato: " + link, type: "success" });
            } catch (err) {
                console.warn("Clipboard API failed, trying fallback:", err);
                fallbackCopy(link);
            }
        } else {
            // Se non siamo in HTTPS o se l'API manca, usiamo il fallback
            fallbackCopy(link);
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
            const { error } = await actions.updateNote({
                id: notaDaSpostare.id,
                title: notaDaSpostare.title,
                content: notaDaSpostare.content,
                parentId: nuovoGenitore.id,
            });

            if (error) throw new Error("Errore nello spostamento");

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

    async function reorder(direction: "up" | "down") {
        try {
            const { error } = await actions.reorderNote({
                noteId: nota.id,
                direction,
            });

            if (error) throw new Error("Errore nel riordinamento");

            await loadNotesFromDb();
            message.set({
                text: "Nota spostata con successo",
                type: "success",
            });
        } catch (error) {
            console.error(error);
            message.set({
                text: "Impossibile spostare la nota",
                type: "error",
            });
        }
    }

    // Calcoliamo se il bottone Incolla è abilitato per questa voce
    let canPaste = $derived(
        $clipboardNote &&
            $clipboardNote.id !== nota.id &&
            !isDescendant($clipboardNote, nota.id),
    );

    // Espandi automaticamente se un discendente è selezionato
    $effect(() => {
        if (
            indiceSelezionato !== undefined &&
            isDescendant(nota, indiceSelezionato)
        ) {
            expanded = true;
        }
    });

    // Calculate indentation based on level
    let indentStyle = $derived(`padding-left: ${livello * 15 + 10}px`);
</script>

<svelte:window onclick={handleGlobalClick} />

<li class="menu-voce-container">
    <div class="menu-voce">
        <!-- Icona per espandere/collassare -->
        {#if nota.children && nota.children.length > 0}
            <button
                class="toggle-btn"
                onclick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
                }}
            >
                {expanded ? "▼" : "▶"}
            </button>
        {:else}
            <span class="spacer"></span>
        {/if}

        <button
            type="button"
            class="title-btn {indiceSelezionato === nota.id ? 'selected' : ''}"
            style={indentStyle}
            onclick={seleziona}
        >
            {#if nota.type === "quiz"}
                <span class="type-icon">❓</span>
            {:else if nota.type === "slide"}
                <span class="type-icon">🎞️</span>
            {/if}
            {nota.title}
        </button>

        {#if $userRole === "admin"}
            <div class="menu-container">
                <button
                    type="button"
                    class="menu-trigger {showMenu ? 'active' : ''}"
                    onclick={(e) => {
                        e.stopPropagation();
                        toggleMenu();
                    }}
                    title="Menu azioni"
                >
                    🛠️
                </button>

                {#if showMenu}
                    <!-- Backdrop invisibile per chiudere cliccando fuori -->
                    <div
                        class="menu-backdrop"
                        onclick={(e) => {
                            e.stopPropagation();
                            closeMenu();
                        }}
                        role="presentation"
                    ></div>

                    <div
                        class="dropdown-menu"
                        transition:slide={{ duration: 100 }}
                    >
                        <button
                            type="button"
                            class="menu-item"
                            onclick={(e) => {
                                e.stopPropagation();
                                aggiungiFiglio();
                                closeMenu();
                            }}
                        >
                            <span class="menu-icon">➕</span> Aggiungi sotto-nota
                        </button>

                        {#if !$clipboardNote}
                            <button
                                type="button"
                                class="menu-item"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    tagliaNota(nota);
                                    closeMenu();
                                }}
                            >
                                <span class="menu-icon">✂️</span> Taglia
                            </button>
                        {/if}

                        {#if canPaste}
                            <button
                                type="button"
                                class="menu-item"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    incollaNota(nota);
                                    closeMenu();
                                }}
                            >
                                <span class="menu-icon">📋</span> Incolla qui
                            </button>
                        {/if}

                        <div
                            style="border-top: 1px solid #444; margin: 4px 0;"
                        ></div>

                        <button
                            type="button"
                            class="menu-item"
                            onclick={(e) => {
                                e.stopPropagation();
                                reorder("up");
                                closeMenu();
                            }}
                        >
                            <span class="menu-icon">⬆️</span> Sposta Su
                        </button>

                        <button
                            type="button"
                            class="menu-item"
                            onclick={(e) => {
                                e.stopPropagation();
                                reorder("down");
                                closeMenu();
                            }}
                        >
                            <span class="menu-icon">⬇️</span> Sposta Giù
                        </button>

                        <div
                            style="border-top: 1px solid #444; margin: 4px 0;"
                        ></div>

                        <button
                            type="button"
                            class="menu-item"
                            onclick={(e) => {
                                e.stopPropagation();
                                copiaLink(nota);
                                closeMenu();
                            }}
                        >
                            <span class="menu-icon">🔗</span> Copia Link
                        </button>

                        <button
                            type="button"
                            class="menu-item"
                            onclick={(e) => {
                                e.stopPropagation();
                                if ($isEdit && indiceSelezionato === nota.id) {
                                    isEdit.set(false);
                                } else {
                                    seleziona();
                                    edita();
                                }
                                closeMenu();
                            }}
                        >
                            <span class="menu-icon">✏️</span>
                            {$isEdit && indiceSelezionato === nota.id
                                ? "Fine Modifica"
                                : "Modifica"}
                        </button>

                        <div
                            style="border-top: 1px solid #444; margin: 4px 0;"
                        ></div>

                        <button
                            type="button"
                            class="menu-item delete"
                            onclick={(e) => {
                                e.stopPropagation();
                                cancella();
                                closeMenu();
                            }}
                        >
                            <span class="menu-icon">🗑️</span> Elimina
                        </button>
                    </div>
                {/if}
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
                    {onSelect}
                    {onEdit}
                    {onDelete}
                    {onAddChild}
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

    .menu-voce:hover .menu-trigger {
        opacity: 1;
    }

    .menu-container {
        position: relative;
    }

    .menu-trigger {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0 5px;
        opacity: 0.7;
        transition: opacity 0.2s;
        border-radius: 4px;
    }

    .menu-trigger:hover,
    .menu-trigger.active {
        background-color: rgba(255, 255, 255, 0.1);
        color: #fff;
        opacity: 1;
    }

    .dropdown-menu {
        position: absolute;
        right: 0;
        top: 100%;
        background-color: #2d2d2d;
        border: 1px solid #444;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        min-width: 180px;
        overflow: hidden;
        padding: 4px 0;
    }

    .menu-item {
        display: flex;
        align-items: center; /* Allinea verticalmente icona e testo */
        gap: 8px; /* Spazio tra icona e testo */
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 8px 12px;
        color: #ccc;
        cursor: pointer;
        font-family: var(--font-main);
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .menu-item:hover {
        background-color: #3d3d3d;
        color: #fff;
    }

    .menu-item.delete:hover {
        background-color: #4a1a1a;
        color: #ff6b6b;
    }

    /* Icone nel menu */
    .menu-icon {
        width: 20px;
        text-align: center;
        display: inline-block;
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
</style>
