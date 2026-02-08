<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let diagramType: "activity" | "class" | "usecase" = "activity";
    let orientation: "TB" | "LR" = "TB";

    // Forza orientamento orizzontale per i casi d'uso
    $: if (diagramType === "usecase") {
        orientation = "LR";
    }

    function confirm() {
        dispatch("confirm", { diagramType, orientation });
        isOpen = false;
    }

    function close() {
        isOpen = false;
        dispatch("close");
    }
</script>

{#if isOpen}
    <div class="modal-overlay">
        <dialog open class="config-dialog">
            <h3>✨ Configurazione Nuovo Diagramma</h3>
            <p>Seleziona il tipo di diagramma e l'orientamento iniziale.</p>

            <div class="config-form">
                <div class="field">
                    <label>Tipo di Diagramma</label>
                    <select bind:value={diagramType}>
                        <option value="activity"
                            >Diagramma delle Attività</option
                        >
                        <option value="class">Diagramma delle Classi</option>
                        <option value="usecase">Diagramma dei Casi d'Uso</option
                        >
                    </select>
                </div>

                <div class="field" class:disabled={diagramType === "usecase"}>
                    <label>Orientamento Layout</label>
                    <select
                        bind:value={orientation}
                        disabled={diagramType === "usecase"}
                    >
                        <option value="TB">Verticale (Dall'alto)</option>
                        <option value="LR">Orizzontale (Da sinistra)</option>
                    </select>
                    {#if diagramType === "usecase"}
                        <small
                            >Per i Casi d'Uso è consigliato l'orientamento
                            orizzontale.</small
                        >
                    {/if}
                </div>
            </div>

            <div class="actions">
                <button class="btn-cancel" on:click={close}>Annulla</button>
                <button class="btn-confirm" on:click={confirm}
                    >Inizia a Disegnare 🎨</button
                >
            </div>
        </dialog>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        backdrop-filter: blur(2px);
    }

    .config-dialog {
        background: white;
        border: none;
        border-radius: 12px;
        padding: 30px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 20px;
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    h3 {
        margin: 0;
        color: #333;
        font-size: 1.4rem;
    }

    p {
        margin: 0;
        color: #666;
        font-size: 0.95rem;
    }

    .config-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .field label {
        font-weight: bold;
        font-size: 0.85rem;
        color: #444;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .field.disabled {
        opacity: 0.7;
    }

    .field small {
        font-size: 0.75rem;
        color: #d32f2f;
        font-style: italic;
        margin-top: 4px;
    }

    select {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        background: #fdfdfd;
        cursor: pointer;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 10px;
    }

    button {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 0.95rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }

    .btn-cancel {
        background: #f0f0f0;
        color: #666;
    }

    .btn-cancel:hover {
        background: #e5e5e5;
    }

    .btn-confirm {
        background: #4a90e2;
        color: white;
        box-shadow: 0 4px 10px rgba(74, 144, 226, 0.3);
    }

    .btn-confirm:hover {
        background: #357abd;
        transform: translateY(-1px);
    }
</style>
