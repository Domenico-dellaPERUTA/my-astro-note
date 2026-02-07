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
    import Quiz from "./Quiz.svelte";
    import Slide from "./Slide.svelte";
    import { mount, onMount } from "svelte";
    import { renderMarkdown } from "../lib/markdown";

    $: titolo = $notes.at($selectedNoteIndex)?.title ?? "";
    $: testo = $notes.at($selectedNoteIndex)?.content ?? "";
    $: tipo = $notes.at($selectedNoteIndex)?.type ?? "note";

    let html = "";
    $: renderMarkdown(testo).then((res) => (html = res));

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
        const newType = (e.target as HTMLSelectElement).value as
            | "note"
            | "quiz"
            | "slide";

        // Regex per identificare il contenuto di default generato dal sistema
        // Es: "Contenuto della nota 5 ..."
        const defaultContentRegex = /^Contenuto della nota \d+ \.\.\.$/;

        const isDefaultContent =
            !testo ||
            testo.trim() === "" ||
            defaultContentRegex.test(testo.trim());

        if (isDefaultContent) {
            // Se è vuoto o default, applica subito il template
            if (newType === "quiz") {
                testo = QUIZ_TEMPLATE;
            } else if (newType === "slide") {
                testo = SLIDE_TEMPLATE;
            }
        } else {
            // Se c'è contenuto personalizzato, chiedi conferma solo se si passa a Quiz o Slide
            if (newType === "quiz" || newType === "slide") {
                const confirmChange = confirm(
                    "Cambiare tipo sovrascriverà il contenuto attuale con il template. Vuoi procedere?",
                );
                if (confirmChange) {
                    if (newType === "quiz") testo = QUIZ_TEMPLATE;
                    if (newType === "slide") testo = SLIDE_TEMPLATE;
                } else {
                    // Annulla il cambio tipo nel select
                    (e.target as HTMLSelectElement).value = tipo;
                    return; // Esci senza cambiare tipo
                }
            }
        }

        tipo = newType;
    }

    function mountQuizzes(node: HTMLElement, content: string) {
        const update = () => {
            const placeholders = node.querySelectorAll(".quiz-placeholder");
            // console.log("MountQuizzes: trovati", placeholders.length, "placeholder");

            placeholders.forEach((element) => {
                const ph = element as HTMLElement;
                if (ph.getAttribute("data-mounted")) return;
                const dataStr = ph.getAttribute("data-quiz");
                console.log("Placeholder quiz trovato!");
                if (dataStr) {
                    try {
                        const decoded = decodeURIComponent(atob(dataStr));
                        const quizData = JSON.parse(decoded);
                        console.log(
                            "Tentativo mounting quiz (Svelte 5):",
                            quizData.title,
                        );

                        mount(Quiz, {
                            target: ph,
                            props: { quiz: quizData },
                        });
                        ph.setAttribute("data-mounted", "true");
                        // Rimuovi lo stile di debug una volta montato
                        ph.style.minHeight = "0";
                        ph.style.border = "none";
                        ph.style.backgroundColor = "transparent";
                    } catch (e) {
                        console.error("Errore mounting quiz component:", e);
                    }
                }
            });
        };

        // Esegui subito e al cambio contenuto
        setTimeout(update, 50);

        return {
            update() {
                setTimeout(update, 50);
            },
        };
    }

    function mountSlides(node: HTMLElement, content: string) {
        const update = async () => {
            const placeholders = node.querySelectorAll(".slide-placeholder");

            // Import shiki highlighter per renderizzare i blocchi di codice
            const { createHighlighter } = await import("shiki");
            const hl = await createHighlighter({
                themes: ["github-light"],
                langs: [
                    "javascript",
                    "typescript",
                    "html",
                    "css",
                    "xml",
                    "json",
                    "bash",
                    "python",
                ],
            });

            placeholders.forEach((element) => {
                const ph = element as HTMLElement;
                if (ph.getAttribute("data-mounted")) return;
                const dataStr = ph.getAttribute("data-slide");
                if (dataStr) {
                    try {
                        const decoded = decodeURIComponent(atob(dataStr));
                        const slideData = JSON.parse(decoded);

                        // Processa le slide per renderizzare i blocchi di codice
                        const processedSlides = slideData.slides.map(
                            (slide: any) => {
                                if (slide.type === "code") {
                                    // Renderizza il codice con shiki
                                    const renderedCode = hl.codeToHtml(
                                        slide.content,
                                        {
                                            lang: slide.lang || "text",
                                            theme: "github-light",
                                        },
                                    );
                                    return { ...slide, content: renderedCode };
                                }
                                return slide;
                            },
                        );

                        mount(Slide, {
                            target: ph,
                            props: { slides: processedSlides },
                        });
                        ph.setAttribute("data-mounted", "true");
                        ph.style.minHeight = "0";
                        ph.style.border = "none";
                        ph.style.backgroundColor = "transparent";
                    } catch (e) {
                        console.error("Errore mounting slide component:", e);
                    }
                }
            });
        };

        setTimeout(update, 50);

        return {
            update() {
                setTimeout(update, 50);
            },
        };
    }

    function mountComponents(node: HTMLElement, content: string) {
        mountQuizzes(node, content);
        mountSlides(node, content);
        return {
            update(newContent: string) {
                mountQuizzes(node, newContent);
                mountSlides(node, newContent);
            },
        };
    }

    async function saveNote(params: {
        title: string;
        content: string;
        type: "note" | "quiz" | "slide";
    }) {
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
                    text: `${params.type === "quiz" ? "Quiz" : "Nota"} "${params.title}" salvata con successo!`,
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
                    type: params.type,
                };
                return updatedNotes;
            });
        } catch (error) {
            const errorMessage = "Errore nel salvataggio della nota";
            message.set({ text: errorMessage, type: "error" });
            console.error(errorMessage + ":", error);
        }
    }
    let speaking = false;
    let audio: HTMLAudioElement | null = null;
    let speechUtterance: SpeechSynthesisUtterance | null = null;
    let voices: SpeechSynthesisVoice[] = [];

    onMount(() => {
        // Pre-caricamento voci per evitare intoppi al primo click
        const loadVoices = () => {
            voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                console.log("[TTS] Voci caricate all'avvio:", voices.length);
            }
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    });

    function stopSpeech() {
        if (audio) {
            audio.pause();
            audio = null;
        }
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        speaking = false;
    }

    // Funzione per aspettare il caricamento delle voci (problema comune del browser)
    function getVoicesAsync() {
        // Già gestito in onMount
        return voices;
    }

    function toggleSpeech() {
        if (speaking) {
            stopSpeech();
            return;
        }

        // Crea un testo "pulito" da leggere
        // Crea un testo "pulito" da leggere:
        // 1. Rimuove i blocchi di codice (```...```)
        // 2. Rimuove le immagini (![...] (...))
        // 3. Rimuove i blocchi custom (:::...:::)
        // 4. Pulisce simboli markdown residui
        const cleanText = testo
            .replace(/```[\s\S]*?```/g, "") // Rimuove blocchi di codice
            .replace(/`[\s\S]*?`/g, "") // Rimuove codice inline
            .replace(/!\[.*?\]\(.*?\)/g, "") // Rimuove immagini
            .replace(/:::[\s\S]*?:::/gs, "") // Rimuove blocchi speciali (quiz, slide)
            .replace(/[#*`_~+]/g, "") // Rimuove simboli markdown (incluso + per sottolineatura)
            .trim();

        const textToRead = `${titolo}. ${cleanText}`;

        speaking = true;

        // Annulla eventuali letture precedenti per sicurezza
        window.speechSynthesis.cancel();

        // Sintesi Nativa del Browser (macOS)
        speechUtterance = new SpeechSynthesisUtterance(textToRead);
        speechUtterance.lang = "it-IT";

        // Ottimizzazione per macOS: cerchiamo una voce di qualità
        if (voices.length === 0) {
            voices = window.speechSynthesis.getVoices();
        }

        const preferredVoice =
            (voices as SpeechSynthesisVoice[]).find(
                (v: SpeechSynthesisVoice) =>
                    v.lang.startsWith("it") && v.name.includes("Emma"),
            ) ||
            (voices as SpeechSynthesisVoice[]).find(
                (v: SpeechSynthesisVoice) =>
                    v.lang.startsWith("it") && v.name.includes("Federica"),
            ) ||
            (voices as SpeechSynthesisVoice[]).find(
                (v: SpeechSynthesisVoice) =>
                    v.lang.startsWith("it") &&
                    (v.name.includes("Alice") || v.name.includes("Elsa")),
            ) ||
            (voices as SpeechSynthesisVoice[]).find(
                (v: SpeechSynthesisVoice) =>
                    v.lang.startsWith("it") &&
                    (v.name.includes("Luca") || v.name.includes("Cosimo")),
            ) ||
            (voices as SpeechSynthesisVoice[]).find(
                (v: SpeechSynthesisVoice) =>
                    v.lang.startsWith("it") && !v.name.includes("Google"),
            );

        if (preferredVoice) {
            console.log(
                "[TTS] Voce selezionata:",
                preferredVoice.name,
                "|",
                preferredVoice.lang,
                "| localService:",
                preferredVoice.localService,
            );
            speechUtterance.voice = preferredVoice;
            speechUtterance.lang = preferredVoice.lang;
            // Parametri per forzare qualità alta
            speechUtterance.rate = 1.0;
            speechUtterance.pitch = 1.0;
            speechUtterance.volume = 1.0;
        } else {
            console.warn(
                "[TTS] Nessuna voce italiana premium trovata, uso quella di sistema.",
            );
        }

        speechUtterance.onend = () => {
            speaking = false;
        };

        speechUtterance.onerror = () => {
            speaking = false;
        };

        window.speechSynthesis.speak(speechUtterance);
    }
</script>

<!-- [ View ] ------------------------------------------------------------------------------------>
{#if $isEdit}
    <form
        class="annotazione"
        on:submit|preventDefault={() =>
            saveNote({ title: titolo, content: testo, type: tipo })}
    >
        <div class="header-edit">
            <div class="field">
                <label for="titolo">Titolo:</label>
                <input type="text" id="titolo" bind:value={titolo} />
            </div>
            <div class="field type-selector">
                <label for="tipo">Tipo:</label>
                <select id="tipo" value={tipo} on:change={handleTypeChange}>
                    <option value="note">📝 Nota</option>
                    <option value="quiz">❓ Quiz</option>
                    <option value="slide">🎞️ Slide</option>
                </select>
            </div>
        </div>

        <label for="testo">Testo (Markdown):</label>
        <div class="editor-container">
            <textarea id="testo" bind:value={testo}></textarea>
            <div class="sidebar-tools">
                <button class="save" type="submit"
                    >💾 SALVA {tipo === "quiz"
                        ? "QUIZ"
                        : tipo === "slide"
                          ? "SLIDE"
                          : "NOTA"}</button
                >
                <div class="markdown-legend">
                    <h4>
                        {tipo === "quiz"
                            ? "Quiz Help"
                            : tipo === "slide"
                              ? "Slide Help"
                              : "Markdown Help"}
                    </h4>
                    <ul>
                        {#if tipo === "quiz"}
                            <li>:::quiz [Tititlo]</li>
                            <li>::time [60s|5min]</li>
                            <li>::ok [punti]</li>
                            <li>::error [punti]</li>
                            <li>::null [punti]</li>
                            <li>? Domanda</li>
                            <li>- [ ] Sbagliata</li>
                            <li>- [x] Corretta</li>
                            <li>::: (chiusura)</li>
                        {:else if tipo === "slide"}
                            <li>:::slide [Titolo]</li>
                            <li>![Alt](url)</li>
                            <li>--- (separatore)</li>
                            <li>```lang</li>
                            <li>codice</li>
                            <li>```</li>
                            <li>::: (chiusura)</li>
                        {:else}
                            <li><b>**Bold**</b></li>
                            <li><i>*Italic*</i></li>
                            <li># Header 1</li>
                            <li>## Header 2</li>
                            <li>++Underline++</li>
                            <li>- List item</li>
                            <li>[Link](url)</li>
                            <li>`Code`</li>
                            <li>```block```</li>
                        {/if}
                    </ul>
                </div>
            </div>
        </div>
    </form>
{:else}
    <div class="annotazione">
        <span class="pin">📍 </span>
        <div class="header-view">
            <h2>{titolo}</h2>
            <button
                class="btn-speech"
                on:click={toggleSpeech}
                title={speaking ? "Ferma lettura" : "Ascolta nota"}
            >
                {speaking ? "⏹️" : "🔊"}
            </button>
        </div>
        <div class="testo" use:mountComponents={html}>{@html html}</div>
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
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 1px;
        flex: 1;
    }

    .header-view {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        border-bottom: 2px solid var(--text-ink);
        padding-bottom: 10px;
    }

    .header-view h2 {
        border-bottom: none;
        padding-bottom: 0;
    }

    .btn-speech {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: transform 0.2s;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn-speech:hover {
        transform: scale(1.2);
        background-color: rgba(0, 0, 0, 0.05);
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

    .type-selector select {
        padding: 10px;
        font-family: var(--font-main);
        font-size: 1rem;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        border-radius: 2px;
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

    .testo :global(.quiz-placeholder) {
        min-height: 200px;
        background-color: rgba(0, 0, 0, 0.02);
        border: 1px dashed #ccc;
        margin: 20px 0;
        display: block;
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
