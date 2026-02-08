<script lang="ts">
    import { userRole } from "../stores/notesStore";

    export let content: string;
    export let onUpdate: (newContent: string) => void;

    // Config
    // Config (Deducible from content)
    $: diagramType = (content
        .match(/\/\/ @type:\s*(activity|class|usecase)/i)?.[1]
        ?.toLowerCase() || "activity") as "activity" | "class" | "usecase";

    // Node State
    let newNodeId = "";
    let newNodeLabel = "";
    let nodeType = "state"; // Default per activity

    // Class specific
    let classFields = "";
    let classMethods = "";

    // Link State
    let node1Id = "";
    let node2Id = "";
    let linkLabel = "";
    let linkType = "association";
    let isBidirectional = false;

    // Subgraph State
    let groupLabel = "Gruppo";
    let groupNodeIds = [""]; // Dynamic list of IDs

    function sanitizeId(val: string) {
        return val.replace(/[^a-zA-Z0-9]/g, "");
    }

    function addNode() {
        const id =
            sanitizeId(newNodeId) || `node${Math.floor(Math.random() * 100)}`;
        let nodeDef = "";

        if (diagramType === "activity") {
            switch (nodeType) {
                case "start":
                    nodeDef = `\n  ${id} [shape=circle, style=filled, fillcolor=black, label="", width=0.15, height=0.15]; // Inizio`;
                    break;
                case "end":
                    nodeDef = `\n  ${id} [shape=doublecircle, style=filled, fillcolor=black, label="", width=0.12, height=0.12]; // Fine`;
                    break;
                case "state":
                    nodeDef = `\n  ${id} [label="${newNodeLabel}", shape=box, style=rounded];`;
                    break;
                case "diamond":
                    nodeDef = `\n  ${id} [shape=diamond, label="", xlabel="${newNodeLabel}", width=0.5, height=0.5, fixedsize=true];`;
                    break;
                case "fork":
                    if (currentRankdir === "LR" || currentRankdir === "RL") {
                        // Barra Verticale per layout Orizzontali
                        nodeDef = `\n  ${id} [shape=none, label=<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD PORT="n" COLSPAN="2" WIDTH="6" HEIGHT="15" BGCOLOR="black"></TD></TR>
      <TR><TD PORT="nw" WIDTH="3" HEIGHT="10" BGCOLOR="black"></TD><TD PORT="ne" WIDTH="3" HEIGHT="10" BGCOLOR="black"></TD></TR>
      <TR><TD PORT="w" WIDTH="3" HEIGHT="10" BGCOLOR="black"></TD><TD PORT="e" WIDTH="3" HEIGHT="10" BGCOLOR="black"></TD></TR>
      <TR><TD PORT="sw" WIDTH="3" HEIGHT="10" BGCOLOR="black"></TD><TD PORT="se" WIDTH="3" HEIGHT="10" BGCOLOR="black"></TD></TR>
      <TR><TD PORT="s" COLSPAN="2" WIDTH="6" HEIGHT="15" BGCOLOR="black"></TD></TR>
    </TABLE>>]; // Fork/Join Verticale`;
                    } else {
                        // Barra Orizzontale per layout Verticali (Default)
                        nodeDef = `\n  ${id} [shape=none, label=<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">
      <TR><TD PORT="w" ROWSPAN="2" WIDTH="15" HEIGHT="6" BGCOLOR="black"></TD><TD PORT="nw" WIDTH="10" HEIGHT="3" BGCOLOR="black"></TD><TD PORT="n" WIDTH="10" HEIGHT="3" BGCOLOR="black"></TD><TD PORT="ne" WIDTH="10" HEIGHT="3" BGCOLOR="black"></TD><TD PORT="e" ROWSPAN="2" WIDTH="15" HEIGHT="6" BGCOLOR="black"></TD></TR>
      <TR><TD PORT="sw" WIDTH="10" HEIGHT="3" BGCOLOR="black"></TD><TD PORT="s" WIDTH="10" HEIGHT="3" BGCOLOR="black"></TD><TD PORT="se" WIDTH="10" HEIGHT="3" BGCOLOR="black"></TD></TR>
    </TABLE>>]; // Fork/Join Orizzontale`;
                    }
                    break;
                default:
                    nodeDef = `\n  ${id} [label="${newNodeLabel}", shape=box];`;
            }
        } else if (diagramType === "class") {
            switch (nodeType) {
                case "class_simple":
                    nodeDef = `\n  ${id} [label="${newNodeLabel}", shape=box];`;
                    break;
                case "class_detailed":
                    const fields = classFields
                        ? `<TR><TD ALIGN="LEFT">${classFields.replace(/\n/g, "<BR/>")}</TD></TR>`
                        : "";
                    const methods = classMethods
                        ? `<TR><TD ALIGN="LEFT">${classMethods.replace(/\n/g, "<BR/>")}</TD></TR>`
                        : "";
                    nodeDef = `\n  ${id} [shape=none, label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">
      <TR><TD><B>${newNodeLabel}</B></TD></TR>
      ${fields}
      ${methods}
    </TABLE>>];`;
                    break;
                case "interface":
                    nodeDef = `\n  ${id} [label="<<interface>>\\n${newNodeLabel}", shape=box];`;
                    break;
                case "enum":
                    nodeDef = `\n  ${id} [label="<<enumeration>>\\n${newNodeLabel}", shape=box];`;
                    break;
                default:
                    nodeDef = `\n  ${id} [label="${newNodeLabel}", shape=box];`;
            }
        } else {
            // Use Case Diagram
            switch (nodeType) {
                case "actor":
                    nodeDef = `\n  ${id} [shape=none, image="/uml-actor.svg", label="${newNodeLabel}", labelloc=b, imagescale=true, fixedsize=true, width=0.4, height=0.8];`;
                    break;
                case "usecase":
                    nodeDef = `\n  ${id} [label="${newNodeLabel}", shape=ellipse];`;
                    break;
                default:
                    nodeDef = `\n  ${id} [label="${newNodeLabel}", shape=box];`;
            }
        }

        updateContent(nodeDef);
        newNodeId = "";
        newNodeLabel = "";
        classFields = "";
        classMethods = "";
    }

    // Port selection for links
    let node1Port = "";
    let node2Port = "";

    const ports = [
        { label: "Auto", value: "" },
        { label: "Sopra", value: "n" },
        { label: "Sotto", value: "s" },
        { label: "Sinistra", value: "w" },
        { label: "Destra", value: "e" },
        { label: "Alto a Sinistra", value: "nw" },
        { label: "Alto a Destra", value: "ne" },
        { label: "Basso a Sinistra", value: "sw" },
        { label: "Basso a Destra", value: "se" },
    ];

    function addLink() {
        if (!node1Id || !node2Id) return;

        const attrs: string[] = [];
        let finalLabel = linkLabel;

        // Custom Use Case Labels
        if (diagramType === "usecase") {
            if (linkType === "include") finalLabel = "<<include>>";
            else if (linkType === "extend") finalLabel = "<<extend>>";
        }

        if (finalLabel) attrs.push(`label="${finalLabel}"`);
        if (node1Port) attrs.push(`tailport=${node1Port}`);
        if (node2Port) attrs.push(`headport=${node2Port}`);

        let head = "vee";
        let tail = "none";
        let style = "solid";
        let dir = isBidirectional ? "both" : "forward";

        switch (linkType) {
            case "inheritance":
                head = "onormal";
                if (isBidirectional) tail = "onormal";
                break;
            case "realization":
                head = "onormal";
                style = "dashed";
                if (isBidirectional) tail = "onormal";
                break;
            case "composition":
                head = isBidirectional ? "vee" : "none";
                tail = "diamond";
                dir = isBidirectional ? "both" : "back";
                break;
            case "aggregation":
                head = isBidirectional ? "vee" : "none";
                tail = "odiamond";
                dir = isBidirectional ? "both" : "back";
                break;
            case "dependency":
            case "include":
            case "extend":
                head = "vee";
                style = "dashed";
                if (isBidirectional) tail = "vee";
                break;
            case "association":
                if (diagramType === "usecase" || diagramType === "class") {
                    head = "none";
                    tail = "none";
                    dir = "none";
                } else {
                    head = "vee";
                    if (isBidirectional) tail = "vee";
                }
                break;
            case "association_directed":
                head = "vee";
                tail = "none";
                dir = "forward";
                if (isBidirectional) {
                    tail = "vee";
                    dir = "both";
                }
                break;
        }

        attrs.push(`arrowhead=${head}`);
        if (tail !== "none") attrs.push(`arrowtail=${tail}`);
        if (style !== "solid") attrs.push(`style=${style}`);
        attrs.push(`dir=${dir}`);

        const attrStr = attrs.length > 0 ? ` [${attrs.join(", ")}]` : "";
        const newLine = `\n  ${node1Id} -> ${node2Id}${attrStr};`;

        updateContent(newLine);
        node1Id = "";
        node2Id = "";
        node1Port = "";
        node2Port = "";
        linkLabel = "";
    }

    function addGroupIdField() {
        groupNodeIds = [...groupNodeIds, ""];
    }

    function removeGroupIdField(index: number) {
        groupNodeIds = groupNodeIds.filter((_, i) => i !== index);
        if (groupNodeIds.length === 0) groupNodeIds = [""];
    }

    function addSubgraph() {
        const validIds = groupNodeIds.filter((id) => id.trim() !== "");
        if (validIds.length === 0) return;

        const members = validIds.join("; ");
        const newLine = `\n  subgraph cluster_${Math.floor(Math.random() * 100)} {\n    label="${groupLabel}";\n    ${members};\n  }`;

        updateContent(newLine);
        groupLabel = "Gruppo";
        groupNodeIds = [""];
    }

    function updateContent(newLine: string) {
        if (content.trim().endsWith("}")) {
            const lastBraceIndex = content.lastIndexOf("}");
            onUpdate(content.substring(0, lastBraceIndex) + newLine + "\n}");
        } else {
            onUpdate(content + newLine);
        }
    }

    // Quando cambia diagramType, resetto nodeType e linkType
    $: {
        if (diagramType === "activity") {
            nodeType = "state";
            linkType = "association";
        } else if (diagramType === "class") {
            nodeType = "class_simple";
            linkType = "association";
        } else {
            nodeType = "actor";
            linkType = "association";
        }
    }

    function toggleOrientation(dir: "TB" | "BT" | "LR" | "RL") {
        let newContent = content;
        const rankdirRegex = /rankdir\s*=\s*(TB|BT|LR|RL)\s*;?/i;

        if (rankdirRegex.test(newContent)) {
            newContent = newContent.replace(rankdirRegex, `rankdir=${dir};`);
        } else {
            // Inserisco dopo la prima parentesi graffa
            const firstBrace = newContent.indexOf("{");
            if (firstBrace !== -1) {
                newContent =
                    newContent.slice(0, firstBrace + 1) +
                    `\n  rankdir=${dir};` +
                    newContent.slice(firstBrace + 1);
            }
        }
        onUpdate(newContent);
    }

    // Estraggo l'orientamento corrente per il selettore
    $: currentRankdir = (content
        .match(/rankdir\s*=\s*(TB|BT|LR|RL)/i)?.[1]
        ?.toUpperCase() || "TB") as "TB" | "BT" | "LR" | "RL";
</script>

{#if $userRole === "admin"}
    <div class="visual-builder">
        <h4>Costruttore Visuale</h4>

        <div class="toolbar">
            <!-- 1. AGGIUNTA NODO -->
            <div class="tool-group">
                <label class="group-title"
                    >Nuovo Nodo ({diagramType === "activity"
                        ? "Attività"
                        : diagramType === "class"
                          ? "UML Class"
                          : "UML Use Case"})</label
                >
                <div class="form-row">
                    <input
                        type="text"
                        placeholder="ID (No spazi)"
                        bind:value={newNodeId}
                        on:input={(e) =>
                            (newNodeId = sanitizeId(e.currentTarget.value))}
                    />
                    <input
                        type="text"
                        placeholder={diagramType === "usecase"
                            ? "Etichetta / Attore"
                            : "Etichetta / Nome Classe"}
                        bind:value={newNodeLabel}
                    />
                </div>

                {#if diagramType === "class" && nodeType === "class_detailed"}
                    <div class="form-row vertical">
                        <textarea
                            placeholder="Attributi (uno per riga)"
                            bind:value={classFields}
                        ></textarea>
                        <textarea
                            placeholder="Metodi (uno per riga)"
                            bind:value={classMethods}
                        ></textarea>
                    </div>
                {/if}

                <div class="form-row select-row">
                    <select bind:value={nodeType}>
                        {#if diagramType === "activity"}
                            <option value="start">Inizio (Pallino Nero)</option>
                            <option value="end">Fine (Bersaglio)</option>
                            <option value="state"
                                >Stato / Attività (Arrotondato)</option
                            >
                            <option value="box"
                                >Oggetto / Altro (Rettangolo)</option
                            >
                            <option value="diamond">Rombo (Decisione)</option>
                            <option value="fork">Fork / Join (Barra)</option>
                        {:else if diagramType === "class"}
                            <option value="class_simple">Classe Semplice</option
                            >
                            <option value="class_detailed"
                                >Classe Dettagliata</option
                            >
                            <option value="interface">Interfaccia</option>
                            <option value="enum">Enumerazione</option>
                            <option value="box">Box Generico</option>
                        {:else}
                            <option value="actor">Attore (👤)</option>
                            <option value="usecase">Caso d'Uso (Ellisse)</option
                            >
                            <option value="box">Sistema (Box)</option>
                        {/if}
                    </select>
                    <button type="button" on:click={addNode}>➕ Nodo</button>
                </div>
            </div>

            <!-- 2. COLLEGAMENTO -->
            <div class="tool-group">
                <label class="group-title">Collegamento</label>
                <div class="form-row align-center">
                    <div class="input-with-port">
                        <input
                            type="text"
                            placeholder="ID A"
                            bind:value={node1Id}
                        />
                        <select bind:value={node1Port} class="mini-select">
                            {#each ports as p}<option value={p.value}
                                    >{p.label}</option
                                >{/each}
                        </select>
                    </div>
                    <span class="arrow">➔</span>
                    <div class="input-with-port">
                        <input
                            type="text"
                            placeholder="ID B"
                            bind:value={node2Id}
                        />
                        <select bind:value={node2Port} class="mini-select">
                            {#each ports as p}<option value={p.value}
                                    >{p.label}</option
                                >{/each}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <input
                        type="text"
                        placeholder="Etichetta (opz)"
                        bind:value={linkLabel}
                    />
                    <select bind:value={linkType} class="narrow-select">
                        {#if diagramType === "activity"}
                            <option value="association">Transizione (➔)</option>
                            <option value="dependency">Tratteggiata (⇢)</option>
                        {:else if diagramType === "class"}
                            <option value="association">Associazione (—)</option
                            >
                            <option value="association_directed"
                                >Associazione Diretta (➔)</option
                            >
                            <option value="inheritance">Ereditarietà (▷)</option
                            >
                            <option value="composition"
                                >Composizione (♦)</option
                            >
                            <option value="aggregation">Aggregazione (♢)</option
                            >
                            <option value="realization"
                                >Realizzazione (⤍)</option
                            >
                            <option value="dependency">Dipendenza (⇢)</option>
                        {:else}
                            <option value="association"
                                >Comunicazione / Associazione (—)</option
                            >
                            <option value="include"
                                >Inclusione (⇠ include ⇠)</option
                            >
                            <option value="extend"
                                >Estensione (⇠ extend ⇠)</option
                            >
                            <option value="inheritance"
                                >Generalizzazione (▷)</option
                            >
                        {/if}
                    </select>
                </div>
                <div class="form-row align-center">
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={isBidirectional} />
                        Bidirezionale
                    </label>
                    <button type="button" on:click={addLink}>🔗 Collega</button>
                </div>
            </div>

            <!-- 3. GRUPPO -->
            <div class="tool-group">
                <label class="group-title">Gruppo (Package / Cluster)</label>
                <input
                    type="text"
                    placeholder="Etichetta Gruppo"
                    bind:value={groupLabel}
                    class="margin-bottom"
                />
                <div class="dynamic-fields">
                    {#each groupNodeIds as id, i}
                        <div class="form-row mini">
                            <input
                                type="text"
                                placeholder="ID elemento"
                                bind:value={groupNodeIds[i]}
                            />
                            <button
                                type="button"
                                class="btn-remove"
                                on:click={() => removeGroupIdField(i)}>✕</button
                            >
                        </div>
                    {/each}
                </div>
                <div class="form-row">
                    <button
                        type="button"
                        class="btn-alt"
                        on:click={addGroupIdField}>+ Elemento</button
                    >
                    <button type="button" on:click={addSubgraph}
                        >📦 Crea Gruppo</button
                    >
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .visual-builder {
        width: 100%;
        background: #fdfdfd;
        padding: 15px;
        border-radius: 8px;
        font-family: var(--font-main);
        display: flex;
        flex-direction: column;
        gap: 15px;
        border: 1px solid #ddd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .visual-builder h4 {
        margin: 0 0 5px 0;
        text-transform: uppercase;
        font-size: 0.8rem;
        color: #999;
        letter-spacing: 1px;
    }

    .toolbar {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .tool-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #f9f9f9;
        padding: 12px;
        border: 1px solid #eee;
        border-radius: 6px;
    }

    .type-selector {
        background: #ebf3ff;
        border-color: #4a90e2;
    }

    .group-title {
        font-size: 0.75rem;
        font-weight: bold;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 2px;
    }

    .form-row {
        display: flex;
        gap: 8px;
        width: 100%;
    }

    .form-row.vertical {
        flex-direction: column;
    }

    .form-row.align-center {
        align-items: center;
        justify-content: center;
    }

    .form-row.mini input {
        flex: 1;
    }

    .margin-bottom {
        margin-bottom: 4px;
    }

    input,
    select,
    textarea {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.9rem;
        background: white;
        flex: 1;
        min-width: 0;
    }

    textarea {
        min-height: 60px;
        resize: vertical;
        font-family: monospace;
        font-size: 0.8rem;
    }

    .mini-select {
        padding: 2px 4px;
        font-size: 0.7rem;
        height: auto;
        border-color: #eee;
    }

    .input-with-port {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
    }

    .narrow-select {
        flex: 1;
        min-width: 120px;
    }

    .arrow {
        font-size: 1.2rem;
        color: #4a90e2;
    }

    button {
        cursor: pointer;
        background: #4a90e2;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 0.9rem;
        transition: background 0.2s;
        white-space: nowrap;
    }

    button:hover {
        background: #357abd;
    }

    .btn-alt {
        background: #f0f0f0;
        color: #444;
        border: 1px solid #ccc;
    }

    .btn-alt:hover {
        background: #e5e5e5;
    }

    .btn-remove {
        background: #fee;
        color: #c33;
        border: 1px solid #fcc;
        padding: 4px 8px;
    }

    .checkbox-label {
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        color: #555;
    }

    .dynamic-fields {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 150px;
        overflow-y: auto;
    }
</style>
