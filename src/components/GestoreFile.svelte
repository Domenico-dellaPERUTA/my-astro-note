<script lang="ts">
    import { onMount } from "svelte";
    import { message } from "../stores/notesStore";

    let files: { name: string; isDir: boolean; path: string }[] = [];
    let currentPath = "";
    let loading = false;
    let newFolderName = "";
    let fileInput: HTMLInputElement;

    // Per la ridenominazione
    let renamingPath: string | null = null;
    let newNameValue = "";

    async function loadFiles(path: string = "") {
        loading = true;
        try {
            const response = await fetch(
                `/api/admin/files?path=${encodeURIComponent(path)}`,
            );
            if (!response.ok) throw new Error("Errore nel caricamento file");
            files = await response.json();
            currentPath = path;
        } catch (err) {
            console.error(err);
            message.set({ text: "Impossibile caricare i file", type: "error" });
        } finally {
            loading = false;
        }
    }

    async function createFolder() {
        if (!newFolderName) return;
        try {
            const formData = new FormData();
            formData.append("type", "folder");
            formData.append("name", newFolderName);
            formData.append("path", currentPath);

            const response = await fetch("/api/admin/files", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Errore creazione cartella");

            newFolderName = "";
            loadFiles(currentPath);
            message.set({ text: "Cartella creata!", type: "success" });
        } catch (err) {
            message.set({ text: "Errore durante la creazione", type: "error" });
        }
    }

    async function uploadFile() {
        const file = fileInput.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("type", "file");
            formData.append("file", file);
            formData.append("path", currentPath);

            const response = await fetch("/api/admin/files", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Errore upload");

            fileInput.value = "";
            loadFiles(currentPath);
            message.set({
                text: "File caricato con successo!",
                type: "success",
            });
        } catch (err) {
            message.set({ text: "Errore durante l'upload", type: "error" });
        }
    }

    async function deleteEntry(file: {
        name: string;
        path: string;
        isDir: boolean;
    }) {
        if (
            !confirm(
                `Sei sicuro di voler eliminare ${file.isDir ? "la CARTELLA e tutto il suo contenuto" : "il file"} "${file.name}"?`,
            )
        )
            return;

        try {
            const response = await fetch(
                `/api/admin/files?path=${encodeURIComponent(file.path)}`,
                {
                    method: "DELETE",
                },
            );

            if (!response.ok) throw new Error("Errore eliminazione");

            loadFiles(currentPath);
            message.set({ text: "Eliminato con successo", type: "success" });
        } catch (err) {
            message.set({
                text: "Errore durante l'eliminazione",
                type: "error",
            });
        }
    }

    async function startRename(file: { name: string; path: string }) {
        renamingPath = file.path;
        newNameValue = file.name;
    }

    async function submitRename() {
        if (!renamingPath || !newNameValue) return;

        try {
            const parts = renamingPath.split("/");
            const oldName = parts.pop()!;
            const parentDir = parts.join("/");

            const formData = new FormData();
            formData.append("type", "rename");
            formData.append("oldName", oldName);
            formData.append("newName", newNameValue);
            formData.append("path", parentDir);

            const response = await fetch("/api/admin/files", {
                method: "POST", // Usiamo POST come definito nell'API
                body: formData,
            });

            if (!response.ok) throw new Error("Errore ridenominazione");

            renamingPath = null;
            loadFiles(currentPath);
            message.set({ text: "Rinominato con successo", type: "success" });
        } catch (err) {
            message.set({
                text: "Errore durante la ridenominazione",
                type: "error",
            });
        }
    }

    function goBack() {
        const parts = currentPath.split("/").filter(Boolean);
        parts.pop();
        loadFiles(parts.join("/"));
    }

    onMount(() => {
        loadFiles();
    });
</script>

<div class="file-manager">
    <header class="fm-header">
        <div class="nav-and-breadcrumb">
            {#if currentPath}
                <button
                    class="back-btn"
                    on:click={goBack}
                    title="Torna alla cartella superiore"
                >
                    ⬅️
                </button>
            {/if}
            <div class="breadcrumb">
                <button on:click={() => loadFiles("")}>WebApp</button>
                {#each currentPath.split("/").filter(Boolean) as part, i}
                    <span>/</span>
                    <button
                        on:click={() =>
                            loadFiles(
                                currentPath
                                    .split("/")
                                    .slice(0, i + 1)
                                    .join("/"),
                            )}
                    >
                        {part}
                    </button>
                {/each}
            </div>
        </div>

        <div class="actions">
            <div class="new-folder">
                <input
                    type="text"
                    bind:value={newFolderName}
                    placeholder="Nuova cartella..."
                    on:keydown={(e) => e.key === "Enter" && createFolder()}
                />
                <button on:click={createFolder}>➕</button>
            </div>

            <div class="upload">
                <input
                    type="file"
                    bind:this={fileInput}
                    on:change={uploadFile}
                    style="display: none;"
                />
                <button class="upload-btn" on:click={() => fileInput.click()}
                    >📤 Carica</button
                >
            </div>
        </div>
    </header>

    <main class="fm-list">
        {#if loading}
            <p class="loading">Caricamento in corso...</p>
        {:else}
            <div class="grid">
                {#each files as file}
                    <div
                        class="item"
                        class:is-dir={file.isDir}
                        on:click={() =>
                            !renamingPath && file.isDir && loadFiles(file.path)}
                    >
                        <span class="icon">{file.isDir ? "📁" : "📄"}</span>

                        {#if renamingPath === file.path}
                            <div class="rename-box" on:click|stopPropagation>
                                <input
                                    type="text"
                                    bind:value={newNameValue}
                                    on:keydown={(e) =>
                                        e.key === "Enter" && submitRename()}
                                    autofocus
                                />
                                <button on:click={submitRename}>OK</button>
                                <button on:click={() => (renamingPath = null)}
                                    >X</button
                                >
                            </div>
                        {:else}
                            <span class="name">{file.name}</span>
                        {/if}

                        <div class="item-tools" on:click|stopPropagation>
                            <button
                                class="tool-btn"
                                title="Rinomina"
                                on:click={() => startRename(file)}>✏️</button
                            >
                            <button
                                class="tool-btn delete"
                                title="Elimina"
                                on:click={() => deleteEntry(file)}>🗑️</button
                            >
                            {#if !file.isDir}
                                <button
                                    class="tool-btn link"
                                    title="Copia link Markdown"
                                    on:click={() => {
                                        const url = `/WebApp/${file.path}`;
                                        const textToCopy = `![${file.name}](${url})`;

                                        if (
                                            navigator.clipboard &&
                                            window.isSecureContext
                                        ) {
                                            navigator.clipboard
                                                .writeText(textToCopy)
                                                .then(() =>
                                                    message.set({
                                                        text: "Link Markdown copiato!",
                                                        type: "success",
                                                    }),
                                                )
                                                .catch((err) => {
                                                    console.error(
                                                        "Clipboard non disponibile",
                                                        err,
                                                    ); // Fallback
                                                    fallbackCopy(textToCopy);
                                                });
                                        } else {
                                            fallbackCopy(textToCopy);
                                        }

                                        function fallbackCopy(text: string) {
                                            const textArea =
                                                document.createElement(
                                                    "textarea",
                                                );
                                            textArea.value = text;
                                            textArea.style.position = "fixed";
                                            document.body.appendChild(textArea);
                                            textArea.focus();
                                            textArea.select();
                                            try {
                                                document.execCommand("copy");
                                                message.set({
                                                    text: "Link Markdown copiato!",
                                                    type: "success",
                                                });
                                            } catch (err) {
                                                message.set({
                                                    text: "Impossibile copiare il link",
                                                    type: "error",
                                                });
                                            }
                                            document.body.removeChild(textArea);
                                        }
                                    }}>🔗</button
                                >
                            {/if}
                        </div>
                    </div>
                {/each}

                {#if files.length === 0}
                    <p class="empty">
                        Nessun file presente in questa cartella.
                    </p>
                {/if}
            </div>
        {/if}
    </main>
</div>

<style>
    .file-manager {
        background: #fff;
        border: 2px solid #333;
        box-shadow: 8px 8px 0px #333;
        padding: 20px;
        font-family: var(--font-main);
    }

    .fm-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px dashed #ccc;
        padding-bottom: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 15px;
    }

    .nav-and-breadcrumb {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .back-btn {
        background: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 1.2rem;
    }
    .back-btn:hover {
        background: #e0e0e0;
    }

    .breadcrumb {
        font-weight: bold;
        color: #666;
    }

    .breadcrumb button {
        background: none;
        border: none;
        color: var(--highlight);
        cursor: pointer;
        font-weight: bold;
        font-family: inherit;
        font-size: 1rem;
    }

    .breadcrumb button:hover {
        text-decoration: underline;
    }

    .actions {
        display: flex;
        gap: 15px;
    }

    .new-folder {
        display: flex;
        border: 1px solid #ccc;
        background: #f9f9f9;
    }

    .new-folder input {
        border: none;
        padding: 5px 10px;
        background: transparent;
        outline: none;
        width: 130px;
    }

    .new-folder button {
        background: #444;
        color: white;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
    }

    .upload-btn {
        background: #28a745;
        color: white;
        border: none;
        padding: 8px 15px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 2px 2px 0px #333;
    }
    .upload-btn:hover {
        background: #218838;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 15px;
    }

    .item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 15px;
        background: #fdfdfd;
        border: 1px solid #eee;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        text-align: center;
        min-height: 140px;
    }

    .item:hover {
        background: #f8f9fa;
        border-color: var(--highlight);
        box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.1);
    }

    .icon {
        font-size: 2.2rem;
        margin-bottom: 8px;
    }

    .name {
        font-size: 0.85rem;
        word-break: break-all;
        font-weight: bold;
        color: #444;
    }

    .rename-box {
        display: flex;
        gap: 2px;
    }
    .rename-box input {
        width: 80px;
        font-size: 0.8rem;
        padding: 2px;
    }
    .rename-box button {
        font-size: 0.7rem;
        padding: 2px 4px;
        cursor: pointer;
    }

    .item-tools {
        display: flex;
        gap: 5px;
        margin-top: 10px;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .item:hover .item-tools {
        opacity: 1;
    }

    .tool-btn {
        background: #eee;
        border: 1px solid #ccc;
        border-radius: 3px;
        padding: 3px 6px;
        font-size: 0.8rem;
        cursor: pointer;
    }
    .tool-btn:hover {
        background: #ddd;
    }
    .tool-btn.delete:hover {
        background: #f8d7da;
        border-color: #f5c6cb;
    }
    .tool-btn.link:hover {
        background: #d1ecf1;
        border-color: #bee5eb;
    }

    .loading,
    .empty {
        text-align: center;
        padding: 40px;
        color: #666;
        font-style: italic;
    }
</style>
