<script lang="ts">
    import { message, type Nota } from "../stores/notesStore";
    import Diagramma from "./Diagramma.svelte";
    import DiagramBuilder from "./DiagramBuilder.svelte";
    import ConfigDiagramma from "./ConfigDiagramma.svelte";
    import { actions } from "astro:actions";

    let { note } = $props<{ note: Nota }>();

    let localTitolo = $state(note.title);
    let localTesto = $state(note.content);
    let localTipo = $state(note.type as "note" | "quiz" | "slide" | "diagram");
    let visualMode = $state(true);
    let isConfigModalOpen = $state(false);

    const QUIZ_TEMPLATE = `:::quiz Esame di Storia Digitale
::time 2min
::ok 1
::error -0.5
::null 0

? Qual è il componente principale di questa applicazione?
- [ ] React
- [x] Astro + Svelte
- [ ] Vue.js

? Come si chiama lo stile grafico utilizzato?
- [ ] Material Design
- [ ] Glassmorphism
- [x] Retro Typewriter
:::`;

    const SLIDE_TEMPLATE = `:::slide Presentazione di Esempio
![Immagine 1](/WebApp/image1.png)
---
\`\`\`javascript
const hello = "Hello World";
console.log(hello);
\`\`\`
---
![Immagine 2](/WebApp/image2.png)
:::`;

    function handleTypeChange(e: Event) {
        const newType = (e.target as HTMLSelectElement).value as any;
        const defaultContentRegex = /^Contenuto della nota \d+ \.\.\.$/;
        const isDefaultContent =
            !localTesto ||
            localTesto.trim() === "" ||
            defaultContentRegex.test(localTesto.trim());

        if (isDefaultContent) {
            if (newType === "quiz") localTesto = QUIZ_TEMPLATE;
            else if (newType === "slide") localTesto = SLIDE_TEMPLATE;
            else if (newType === "diagram") isConfigModalOpen = true;
            localTipo = newType;
        } else {
            if (["quiz", "slide", "diagram"].includes(newType)) {
                message.set({
                    text: "Cambiare tipo sovrascriverà il contenuto attuale con il template. Vuoi procedere?",
                    type: "confirmation",
                    confirm: async () => {
                        if (newType === "quiz") localTesto = QUIZ_TEMPLATE;
                        else if (newType === "slide")
                            localTesto = SLIDE_TEMPLATE;
                        else if (newType === "diagram")
                            isConfigModalOpen = true;
                        localTipo = newType;
                    },
                });
                (e.target as HTMLSelectElement).value = localTipo;
            } else {
                localTipo = newType;
            }
        }
    }

    async function handleSave() {
        try {
            const { error } = await actions.updateNote({
                id: note.id,
                title: localTitolo,
                content: localTesto,
                type: localTipo as any,
            });

            if (error) throw new Error("Errore nel salvataggio");

            message.set({
                text: "Nota salvata con successo!",
                type: "success",
            });

            // Redirect back to view mode
            const url = new URL(window.location.href);
            url.searchParams.delete("edit");
            window.location.href = url.toString();
        } catch (e) {
            message.set({
                text: "Errore nel salvataggio della nota",
                type: "error",
            });
        }
    }

    function handleDiagramConfig(detail: {
        diagramType: "activity" | "class" | "usecase";
        orientation: "TB" | "LR";
    }) {
        const { diagramType, orientation } = detail;

        if (diagramType === "class") {
            localTesto = `digraph G {\n  // @type: class\n  rankdir=${orientation};\n\n  U [label="Umano", shape=box];\n  G [label="Guidatore", shape=box];\n  G -> U [arrowhead=onormal, dir=forward];\n}`;
        } else if (diagramType === "usecase") {
            localTesto = `digraph G {\n  // @type: usecase\n  rankdir=${orientation};\n\n  Utente [shape=none, image="/uml-actor.svg", label="", labelloc=b, imagescale=true, fixedsize=true, width=0.4, height=0.8];\n  A [label="A", shape=ellipse];\n  Utente -> A [arrowhead=vee, dir=forward];\n}`;
        } else {
            localTesto = `digraph G {\n  // @type: activity\n  rankdir=${orientation};\n\n  inizio [shape=circle, style=filled, fillcolor=black, label="", width=0.15, height=0.15];\n  fine [shape=doublecircle, style=filled, fillcolor=black, label="", width=0.12, height=0.12];\n  inizio -> fine [arrowhead=vee, dir=forward];\n}`;
        }

        localTipo = "diagram";
        isConfigModalOpen = false;
    }
</script>

<form
    class="annotazione"
    onsubmit={(e) => {
        e.preventDefault();
        handleSave();
    }}
>
    <div class="header-edit">
        <div class="field">
            <label for="titolo">Titolo:</label>
            <input type="text" id="titolo" bind:value={localTitolo} />
        </div>
        <div class="field type-selector">
            <label for="tipo">Tipo:</label>
            <select id="tipo" value={localTipo} onchange={handleTypeChange}>
                <option value="note">📝 Nota</option>
                <option value="quiz">❓ Quiz</option>
                <option value="slide">🎞️ Slide</option>
                <option value="diagram">📊 Diagramma</option>
            </select>
        </div>
    </div>

    <label for="testo"
        >Testo ({localTipo === "diagram" ? "DOT" : "Markdown"}):</label
    >
    <div class="editor-container">
        {#if localTipo === "diagram" && visualMode}
            <div class="diagram-workspace">
                <div class="diagram-info-bar">
                    <button
                        class="btn-reconfig"
                        type="button"
                        onclick={() => (isConfigModalOpen = true)}
                        >⚙️ Configura</button
                    >
                    <span
                        >📊 TIPO: {localTesto
                            .match(/\/\/ @type:\s*(\w+)/i)?.[1]
                            ?.toUpperCase() || "DIAGRAMMA"}</span
                    >
                </div>
                <Diagramma content={localTesto} />
            </div>
        {:else}
            <textarea id="testo" bind:value={localTesto}></textarea>
        {/if}

        <div class="sidebar-tools">
            <button class="save" type="submit">💾 SALVA</button>
            {#if localTipo === "diagram"}
                <button
                    class="toggle-mode"
                    type="button"
                    onclick={() => (visualMode = !visualMode)}
                >
                    {visualMode ? "📝 Modifica Testo" : "📊 Modifica Visuale"}
                </button>
            {/if}
            <a href={`?id=${note.id}`} class="btn-cancel">❌ Annulla</a>

            {#if localTipo === "diagram" && visualMode}
                <DiagramBuilder
                    content={localTesto}
                    onUpdate={(newContent: string) => (localTesto = newContent)}
                />
            {:else}
                <div class="markdown-legend">
                    <h4>
                        {localTipo === "quiz"
                            ? "Quiz Help"
                            : localTipo === "slide"
                              ? "Slide Help"
                              : localTipo === "diagram"
                                ? "Graphviz Help"
                                : "Markdown Help"}
                    </h4>
                    <ul>
                        {#if localTipo === "quiz"}
                            <li>:::quiz [Titolo]</li>
                            <li>? Domanda</li>
                            <li>- [x] Corretta</li>
                        {:else if localTipo === "slide"}
                            <li>:::slide [Titolo]</li>
                            <li>--- (slide edge)</li>
                        {:else if localTipo === "diagram"}
                            <li>digraph G &#123; ... &#125;</li>
                            <li>A -&gt; B;</li>
                        {:else}
                            <li><b>**Bold**</b></li>
                            <li><i>*Italic*</i></li>
                            <li># Header</li>
                        {/if}
                    </ul>
                </div>
            {/if}
        </div>
    </div>
</form>

<ConfigDiagramma
    bind:isOpen={isConfigModalOpen}
    onConfirm={handleDiagramConfig}
/>

<style>
    .annotazione {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 20px;
        font-family: var(--font-main);
        background-color: #fffcf0;
        padding: 40px;
        box-shadow:
            1px 1px 3px rgba(0, 0, 0, 0.1),
            5px 5px 0px rgba(0, 0, 0, 0.05);
        margin: 20px;
        max-width: 1200px;
        width: calc(100% - 40px);
        min-height: 80vh;
        height: auto;
        flex-shrink: 0;
    }
    .header-edit {
        display: flex;
        gap: 20px;
        align-items: flex-end;
    }
    .header-edit .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .header-edit .field:first-child {
        flex: 1;
    }
    label {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 1px;
        color: #666;
    }
    input[type="text"] {
        width: 100%;
        padding: 10px;
        border: none;
        border-bottom: 2px solid #ccc;
        font-family: var(--font-main);
        font-size: 1.5rem;
        background: transparent;
        outline: none;
    }
    input[type="text"]:focus {
        border-bottom-color: var(--highlight);
    }
    textarea {
        flex: 1;
        min-height: 500px;
        padding: 15px;
        border: 1px solid #ccc;
        font-family: var(--font-main);
        font-size: 1rem;
        background: white;
        resize: vertical;
    }
    .editor-container {
        display: flex;
        gap: 30px;
        align-items: flex-start;
    }
    .sidebar-tools {
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 250px;
    }
    .save {
        background: #aa4b4b;
        color: white;
        border: none;
        padding: 15px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.2);
    }
    .save:hover {
        background: #c65e5e;
    }
    .btn-cancel {
        display: block;
        text-align: center;
        padding: 10px;
        background: #f0f0f0;
        color: #666;
        text-decoration: none;
        border: 1px solid #ccc;
    }
    .toggle-mode {
        padding: 10px;
        background: #4e73ab;
        color: white;
        border: none;
        cursor: pointer;
        font-weight: bold;
    }
    .markdown-legend {
        padding: 15px;
        background: #fff8dc;
        border: 1px solid #e0d0a0;
        font-size: 0.85rem;
        transform: rotate(1deg);
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    }
    .markdown-legend h4 {
        margin: 0 0 10px 0;
        font-size: 0.75rem;
        color: #888;
        text-transform: uppercase;
    }
    .markdown-legend ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .diagram-workspace {
        flex: 1;
        background: white;
        border: 1px solid #ccc;
        padding: 10px;
    }
    .diagram-info-bar {
        background: #b71c1c;
        color: white;
        padding: 5px 10px;
        font-family: monospace;
        font-size: 0.8rem;
        margin-bottom: 5px;
        display: flex;
        justify-content: space-between;
    }
    .btn-reconfig {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid white;
        color: white;
        padding: 2px 5px;
        cursor: pointer;
        font-size: 0.7rem;
    }
</style>
