<script lang="ts">
    import AvatarParlante from "./AvatarParlante.svelte";
    import { onMount } from "svelte";
    import { actions } from "astro:actions";

    let {
        title,
        content,
        lang = "it",
    } = $props<{
        title: string;
        content: string;
        lang?: string;
    }>();

    // --- Stato reattivo ---
    let speaking = $state(false);
    let isSpeaking = $state(false);
    let showAvatar = $state(false);
    let avatarControlsOpen = $state(false);
    let currentLang = $state("it");
    let translating = $state(false);

    // --- Risorse audio ---
    let voices: SpeechSynthesisVoice[] = [];
    let speechUtterance: SpeechSynthesisUtterance | null = null;
    let googleAudio: HTMLAudioElement | null = null;
    let activeTimers: ReturnType<typeof setTimeout>[] = [];
    let googleChunkQueue: string[] = [];
    let isPlayingChunks = $state(false);

    // --- Derivato ---
    let isItalian = $derived(
        currentLang === "it" || currentLang === "original" || !currentLang,
    );

    // --- Caricamento voci e osservazione lingua ---
    onMount(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                voices = availableVoices;
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        // Sincronizza il valore iniziale dalla prop o dal DOM
        const container = document.getElementById("testo-renderizzato");
        if (container) {
            const domLang = container.getAttribute("data-target-lang");
            if (domLang) {
                currentLang = domLang;
            } else {
                currentLang = lang;
            }

            // MutationObserver per sincronizzare la lingua dal DOM
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (
                        mutation.type === "attributes" &&
                        mutation.attributeName === "data-target-lang"
                    ) {
                        const newLang =
                            container.getAttribute("data-target-lang");
                        if (newLang && newLang !== currentLang) {
                            // Se c'è audio in corso, fermalo prima del cambio lingua
                            if (speaking) {
                                stopAll();
                            }
                            currentLang = newLang;
                        }
                    }
                }
            });

            observer.observe(container, {
                attributes: true,
                attributeFilter: ["data-target-lang"],
            });

            // Osserva la presenza del loader di traduzione in tutto il documento per disabilitare il pulsante
            const checkLoader = () => {
                translating = !!document.querySelector(".translation-loader");
            };

            // Controllo iniziale
            checkLoader();

            const loaderObserver = new MutationObserver(checkLoader);
            loaderObserver.observe(document.body, {
                childList: true,
                subtree: true,
            });

            return () => {
                observer.disconnect();
                loaderObserver.disconnect();
            };
        } else {
            currentLang = lang;
        }
    });

    // === FUNZIONE PRINCIPALE DI CLEANUP ===
    function stopAll() {
        // 1. Ferma speechSynthesis
        window.speechSynthesis.cancel();

        // 2. Ferma Google Audio
        if (googleAudio) {
            googleAudio.pause();
            googleAudio.removeAttribute("src");
            googleAudio.load(); // Rilascia risorse
            googleAudio = null;
        }

        // 3. Svuota la coda dei chunk
        googleChunkQueue = [];
        isPlayingChunks = false;

        // 4. Pulisci tutti i timer
        activeTimers.forEach((t) => clearTimeout(t));
        activeTimers = [];

        // 5. Reset stato
        speaking = false;
        isSpeaking = false;
        showAvatar = false;
        speechUtterance = null;
    }

    // === UTILITÀ: Helper per timer tracciati ===
    function trackedTimeout(
        fn: () => void,
        ms: number,
    ): ReturnType<typeof setTimeout> {
        const id = setTimeout(() => {
            activeTimers = activeTimers.filter((t) => t !== id);
            fn();
        }, ms);
        activeTimers.push(id);
        return id;
    }

    // === PULIZIA TESTO MARKDOWN ===
    function cleanMarkdown(text: string): string {
        return text
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`[\s\S]*?`/g, "")
            .replace(/!\[.*?\]\(.*?\)/g, "")
            .replace(/:::[\s\S]*?:::/gs, "")
            .replace(/^\s*#.*$/gm, "")
            .replace(/^\s*\|.*\|.*$/gm, "")
            .replace(/[-*`_~+]/g, "")
            .trim();
    }

    // === ESTRAZIONE TESTO DA LEGGERE ===
    function getTextToRead(): string {
        if (isItalian) {
            // Modalità italiana: usa il contenuto originale
            const cleanText = cleanMarkdown(content);
            return `${title}. ${cleanText}`;
        } else {
            // Modalità traduzione: leggi dal DOM (testo tradotto visibile)
            const container = document.getElementById("testo-renderizzato");
            if (container) {
                const domText = container.innerText?.trim();
                if (domText) {
                    return domText;
                }
            }
            // Fallback al contenuto originale se il DOM non è pronto
            const cleanText = cleanMarkdown(content);
            return `${title}. ${cleanText}`;
        }
    }

    // === SPLIT TESTO PER GOOGLE TTS (max ~200 char per chunk) ===
    function splitTextForGoogleTTS(text: string, maxLen = 200): string[] {
        const chunks: string[] = [];
        // Dividi per frasi (punto, virgola, punto e virgola, punto esclamativo, interrogativo)
        const sentences = text.match(/[^.!?;,]+[.!?;,]?/g) || [text];
        let current = "";

        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (!trimmed) continue;

            if ((current + " " + trimmed).trim().length <= maxLen) {
                current = (current + " " + trimmed).trim();
            } else {
                if (current) chunks.push(current);
                // Se la singola frase è più lunga del max, spezzala per parole
                if (trimmed.length > maxLen) {
                    const words = trimmed.split(/\s+/);
                    let wordChunk = "";
                    for (const word of words) {
                        if ((wordChunk + " " + word).trim().length <= maxLen) {
                            wordChunk = (wordChunk + " " + word).trim();
                        } else {
                            if (wordChunk) chunks.push(wordChunk);
                            wordChunk = word;
                        }
                    }
                    if (wordChunk) current = wordChunk;
                    else current = "";
                } else {
                    current = trimmed;
                }
            }
        }
        if (current) chunks.push(current);
        return chunks;
    }

    // === GOOGLE TTS: Riproduzione sequenziale dei chunk ===
    async function playGoogleTTSChunks(chunks: string[], targetLang: string) {
        googleChunkQueue = [...chunks];
        isPlayingChunks = true;

        async function playNext() {
            if (!speaking || googleChunkQueue.length === 0) {
                // Fine riproduzione
                if (speaking) {
                    speaking = false;
                    isSpeaking = false;
                    if (!avatarControlsOpen) {
                        showAvatar = false;
                    }
                }
                isPlayingChunks = false;
                return;
            }

            const chunk = googleChunkQueue.shift()!;

            try {
                // Usa l'azione server-side per bypassare il blocco ORB del browser
                const result = await actions.proxyTTS({
                    text: chunk,
                    lang: targetLang,
                });

                if (!result.data || !result.data.success) {
                    throw new Error(result.data?.error || "Proxy TTS failed");
                }

                googleAudio = new Audio(result.data.audio);
                googleAudio.volume = 1.0;

                await new Promise<void>((resolve, reject) => {
                    if (!googleAudio) {
                        reject(new Error("Audio destroyed"));
                        return;
                    }

                    googleAudio.onended = () => resolve();
                    googleAudio.onerror = () =>
                        reject(new Error("Google TTS playback failed"));

                    googleAudio.play().catch(reject);
                });

                // Prosegui col chunk successivo
                if (speaking) {
                    await playNext();
                }
            } catch (err) {
                console.warn(
                    "[AudioBridge] Google TTS error, fallback to speechSynthesis:",
                    err,
                );
                // Fallback: usa speechSynthesis per il testo rimanente
                const remainingText = [chunk, ...googleChunkQueue].join(" ");
                googleChunkQueue = [];
                isPlayingChunks = false;
                speakWithSynthesis(remainingText, targetLang, false); // showAvatar = false
            }
        }

        await playNext();
    }

    // === SPEECH SYNTHESIS (riutilizzabile) ===
    function speakWithSynthesis(
        text: string,
        langCode: string,
        withAvatar: boolean,
    ) {
        window.speechSynthesis.cancel();

        trackedTimeout(() => {
            if (!speaking) return;

            showAvatar = withAvatar;
            const utterance = new SpeechSynthesisUtterance(text);
            speechUtterance = utterance;

            // Mappa lingua
            const langMap: Record<string, string> = {
                it: "it-IT",
                en: "en-US",
                es: "es-ES",
                fr: "fr-FR",
                de: "de-DE",
                pt: "pt-BR",
                ja: "ja-JP",
                zh: "zh-CN",
                ko: "ko-KR",
                ru: "ru-RU",
                ar: "ar-SA",
                hi: "hi-IN",
                original: "it-IT",
            };
            utterance.lang =
                langMap[langCode] || `${langCode}-${langCode.toUpperCase()}`;

            // Seleziona voce
            const currentVoices = window.speechSynthesis.getVoices();
            const voicesToUse =
                currentVoices.length > 0 ? currentVoices : voices;

            if (withAvatar) {
                // Voce italiana preferita (come prima)
                const preferredVoice =
                    voicesToUse.find(
                        (v) =>
                            v.lang.startsWith("it") && v.name.includes("Emma"),
                    ) ||
                    voicesToUse.find(
                        (v) =>
                            v.lang.startsWith("it") &&
                            v.name.includes("Federica"),
                    ) ||
                    voicesToUse.find(
                        (v) =>
                            v.lang.startsWith("it") &&
                            (v.name.includes("Alice") ||
                                v.name.includes("Elsa")),
                    ) ||
                    voicesToUse.find(
                        (v) =>
                            v.lang.startsWith("it") &&
                            (v.name.includes("Luca") ||
                                v.name.includes("Cosimo")),
                    ) ||
                    voicesToUse.find(
                        (v) =>
                            v.lang.startsWith("it") &&
                            !v.name.includes("Google"),
                    );

                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                    utterance.lang = preferredVoice.lang;
                }
            } else {
                // Voce per la lingua target (fallback)
                const langPrefix = langCode === "original" ? "it" : langCode;
                const voice =
                    voicesToUse.find(
                        (v) =>
                            v.lang.startsWith(langPrefix) &&
                            !v.name.includes("Google"),
                    ) || voicesToUse.find((v) => v.lang.startsWith(langPrefix));
                if (voice) {
                    utterance.voice = voice;
                    utterance.lang = voice.lang;
                }
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Lip sync solo se avatar è visibile
            let speakingTimeout: ReturnType<typeof setTimeout>;

            if (withAvatar) {
                utterance.onboundary = (event) => {
                    if (event.name === "word") {
                        isSpeaking = true;
                        clearTimeout(speakingTimeout);
                        speakingTimeout = setTimeout(() => {
                            isSpeaking = false;
                        }, 180);
                    }
                };
            }

            utterance.onstart = () => {
                if (withAvatar) isSpeaking = true;
            };

            utterance.onend = () => {
                speaking = false;
                isSpeaking = false;
                clearTimeout(speakingTimeout);
                if (!avatarControlsOpen) {
                    showAvatar = false;
                }
            };

            utterance.onerror = () => {
                speaking = false;
                isSpeaking = false;
                clearTimeout(speakingTimeout);
                speechUtterance = null;
                if (!avatarControlsOpen) {
                    showAvatar = false;
                }
            };

            window.speechSynthesis.speak(utterance);
        }, 50);
    }

    // === TOGGLE PRINCIPALE ===
    function toggleSpeech() {
        if (speaking) {
            stopAll();
            return;
        }

        const textToRead = getTextToRead();
        if (!textToRead.trim()) return;

        // Reset prima di iniziare
        stopAll();

        // Imposta stato "in riproduzione"
        speaking = true;

        if (isItalian) {
            // === MODALITÀ ITALIANA: speechSynthesis + Avatar ===
            showAvatar = true;
            speakWithSynthesis(textToRead, "it", true);
        } else {
            // === MODALITÀ TRADUZIONE: Google TTS, senza avatar ===
            showAvatar = false;
            const chunks = splitTextForGoogleTTS(textToRead);
            playGoogleTTSChunks(chunks, currentLang);
        }
    }
</script>

<div class="audio-controls">
    {#if translating}
        <span class="btn-loader-waiting" title="Traduzione in corso...">⏳</span
        >
    {:else}
        <button
            class="btn-speech"
            onclick={toggleSpeech}
            title={speaking
                ? "Ferma lettura"
                : isItalian
                  ? "Ascolta nota"
                  : "Listen (Google TTS)"}
        >
            {speaking ? "⏹️" : "🔊"}
        </button>
    {/if}
</div>

{#if showAvatar}
    <div class="avatar-dialog">
        <div class="avatar-container">
            <h3>🎙️ Segretaria Virtuale</h3>
            <AvatarParlante
                {speaking}
                {isSpeaking}
                bind:controlsOpen={avatarControlsOpen}
            />
            <button class="btn-close-avatar" onclick={stopAll}>❌ Chiudi</button
            >
        </div>
    </div>
{/if}

<style>
    .audio-controls {
        display: flex;
        align-items: center;
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

    .btn-speech:hover:not(:disabled) {
        transform: scale(1.2);
        background-color: rgba(0, 0, 0, 0.05);
    }

    .btn-loader-waiting {
        font-size: 1.5rem;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0% {
            opacity: 0.5;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0.5;
        }
    }

    /* Avatar Dialog - solo visibile quando showAvatar=true */
    .avatar-dialog {
        position: fixed;
        top: 80px;
        left: 20px;
        z-index: 2000;
        animation: slideIn 0.5s ease-out;
        pointer-events: auto;
    }

    .avatar-container {
        background: #222;
        border: 3px solid #d45d5d;
        padding: 20px;
        border-radius: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .avatar-container h3 {
        color: #d45d5d;
        margin: 0;
        font-family: "Courier New", Courier, monospace;
        font-size: 1rem;
    }

    .btn-close-avatar {
        background: #d45d5d;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    }

    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
</style>
