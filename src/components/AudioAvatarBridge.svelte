<script lang="ts">
    import AvatarParlante from "./AvatarParlante.svelte";
    import { onMount } from "svelte";

    let { title, content } = $props<{ title: string; content: string }>();

    let speaking = $state(false);
    let isSpeaking = $state(false);
    let showAvatar = $state(false);
    let avatarControlsOpen = $state(false);

    let voices: SpeechSynthesisVoice[] = [];
    let speechUtterance: SpeechSynthesisUtterance | null = null;

    onMount(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                voices = availableVoices;
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    });

    // Handle automatic avatar closing
    $effect(() => {
        if (!avatarControlsOpen && !speaking && showAvatar) {
            showAvatar = false;
        }
    });

    function stopSpeech() {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        speaking = false;
        isSpeaking = false;
        showAvatar = false;
    }

    function toggleSpeech() {
        if (speaking) {
            stopSpeech();
            return;
        }

        const cleanText = content
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`[\s\S]*?`/g, "")
            .replace(/!\[.*?\]\(.*?\)/g, "")
            .replace(/:::[\s\S]*?:::/gs, "")
            .replace(/^\s*#.*$/gm, "")
            .replace(/^\s*\|.*\|.*$/gm, "")
            .replace(/[-*`_~+]/g, "")
            .trim();

        const textToRead = `${title}. ${cleanText}`;

        window.speechSynthesis.cancel();

        // Reset immediato
        speaking = false;
        isSpeaking = false;

        setTimeout(() => {
            speaking = true;
            showAvatar = true;

            let utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = "it-IT";
            speechUtterance = utterance;

            const currentVoices = window.speechSynthesis.getVoices();
            const voicesToUse =
                currentVoices.length > 0 ? currentVoices : voices;

            const preferredVoice =
                voicesToUse.find(
                    (v) => v.lang.startsWith("it") && v.name.includes("Emma"),
                ) ||
                voicesToUse.find(
                    (v) =>
                        v.lang.startsWith("it") && v.name.includes("Federica"),
                ) ||
                voicesToUse.find(
                    (v) =>
                        v.lang.startsWith("it") &&
                        (v.name.includes("Alice") || v.name.includes("Elsa")),
                ) ||
                voicesToUse.find(
                    (v) =>
                        v.lang.startsWith("it") &&
                        (v.name.includes("Luca") || v.name.includes("Cosimo")),
                ) ||
                voicesToUse.find(
                    (v) =>
                        v.lang.startsWith("it") && !v.name.includes("Google"),
                );

            if (preferredVoice) {
                speechUtterance.voice = preferredVoice;
                speechUtterance.lang = preferredVoice.lang;
                speechUtterance.rate = 1.0;
                speechUtterance.pitch = 1.0;
                speechUtterance.volume = 1.0;
            }

            let speakingTimeout: any;
            speechUtterance.onboundary = (event) => {
                if (event.name === "word") {
                    isSpeaking = true;
                    clearTimeout(speakingTimeout);
                    speakingTimeout = setTimeout(() => {
                        isSpeaking = false;
                    }, 180);
                }
            };

            speechUtterance.onstart = () => {
                isSpeaking = true;
            };

            speechUtterance.onend = () => {
                speaking = false;
                isSpeaking = false;
                clearTimeout(speakingTimeout);
                if (!avatarControlsOpen) {
                    showAvatar = false;
                }
            };

            speechUtterance.onerror = () => {
                speaking = false;
                isSpeaking = false;
                clearTimeout(speakingTimeout);
                speechUtterance = null;
                if (!avatarControlsOpen) {
                    showAvatar = false;
                }
            };

            window.speechSynthesis.speak(speechUtterance);
        }, 50);
    }
</script>

<div class="audio-controls">
    <button
        class="btn-speech"
        onclick={toggleSpeech}
        title={speaking ? "Ferma lettura" : "Ascolta nota"}
    >
        {speaking ? "⏹️" : "🔊"}
    </button>
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
            <button class="btn-close-avatar" onclick={stopSpeech}
                >❌ Chiudi</button
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

    .btn-speech:hover {
        transform: scale(1.2);
        background-color: rgba(0, 0, 0, 0.05);
    }

    /* Avatar Dialog */
    .avatar-dialog {
        position: fixed;
        top: 80px;
        left: 20px;
        z-index: 2000;
        animation: slideIn 0.5s ease-out;
    }

    .avatar-container {
        background: #222;
        border: 3px solid #d45d5d; /* match --highlight */
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
