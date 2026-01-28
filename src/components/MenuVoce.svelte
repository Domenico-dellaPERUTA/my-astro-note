<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { slide } from "svelte/transition";
    import { userRole, type Nota } from "../stores/notesStore";

    export let nota: Nota;
    export let indiceSelezionato: number;
    export let livello = 0;

    const dispatch = createEventDispatcher();
    let expanded = true;

    function toggleExpand() {
        expanded = !expanded;
    }

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

        <!-- Titolo Nota Button -->
        <button
            type="button"
            class="title-btn {indiceSelezionato === nota.id ? 'selected' : ''}"
            style={indentStyle}
            on:click={() => dispatch("select", nota)}
        >
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

                <!-- Pulsante Modifica -->
                <button
                    type="button"
                    class="action-btn edit"
                    title="Modifica"
                    on:click|stopPropagation={() => dispatch("edit", nota)}
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
                    level={livello + 1}
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
        color: #fff !important;
        text-decoration: underline;
        text-decoration-color: #d45d5d;
        text-decoration-thickness: 3px;
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
</style>
