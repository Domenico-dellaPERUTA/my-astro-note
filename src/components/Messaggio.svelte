<!--
---------------------------------------------------------------------------------------------------
 src/components/Messaggio.svelte 
---------------------------------------------------------------------------------------------------
-->

<!-- [ Controller ] ------------------------------------------------------------------------------>
<script lang="ts">
  import { message } from "../stores/notesStore";
  import AvatarParlante from "./AvatarParlante.svelte";
  import { onMount, onDestroy } from "svelte";

  let speaking = $state(false);
  let isSpeaking = $state(false);
  let avatarControlsOpen = $state(false);
  let voices: SpeechSynthesisVoice[] = [];

  // Carica le voci
  function loadVoices() {
    if (typeof window === "undefined") return;
    voices = window.speechSynthesis.getVoices();
  }

  $effect(() => {
    loadVoices();
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis.onvoiceschanged !== undefined
    ) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  });

  onDestroy(() => {
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis &&
      window.speechSynthesis.speaking
    ) {
      window.speechSynthesis.cancel();
    }
  });

  const confirmDialog = async () => {
    if ($message.confirm) {
      await $message.confirm();
    }
    closeDialog();
  };

  function closeDialog() {
    if (typeof window === "undefined") return;

    const dialog = document.getElementById("mioDialog") as HTMLDialogElement;
    // Ferma il parlato e l'animazione
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    speaking = false;
    isSpeaking = false;

    // Chiudi dialog e resetta messaggio
    message.set({ text: "", type: "info", confirm: undefined });
    if (dialog) dialog.close();
  }

  // Monitora i messaggi per avviare la lettura
  $effect(() => {
    if ($message.text) {
      speakMessage($message.text);
    }
  });

  function speakMessage(text: string) {
    if (!text || typeof window === "undefined") return;

    // Annulla eventuali letture precedenti
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";

    // Selezione voce (logica semplificata da Annotazione.svelte)
    if (voices.length === 0) voices = window.speechSynthesis.getVoices();

    const preferredVoice =
      voices.find((v) => v.lang.startsWith("it") && v.name.includes("Emma")) ||
      voices.find(
        (v) => v.lang.startsWith("it") && v.name.includes("Federica"),
      ) ||
      voices.find((v) => v.lang.startsWith("it") && !v.name.includes("Google")); // Fallback

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    speaking = true;
    isSpeaking = true;

    let speakingTimeout: any;
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        isSpeaking = true;
        clearTimeout(speakingTimeout);
        speakingTimeout = setTimeout(() => {
          isSpeaking = false;
        }, 150);
      }
    };

    utterance.onend = () => {
      // Quando finisce di parlare, l'avatar smette di muovere la bocca
      // MA rimane visibile finché il dialog è aperto (gestito dal template)
      isSpeaking = false;
      speaking = false;
      clearTimeout(speakingTimeout);
    };

    utterance.onerror = () => {
      isSpeaking = false;
      speaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }
</script>

<!-- [ View ] ------------------------------------------------------------------------------------>
{#if $message.text !== ""}
  <div class="avatar-dialog">
    <div class="avatar-container">
      <h3>🎙️ Messaggio di Sistema</h3>
      <AvatarParlante
        {speaking}
        {isSpeaking}
        bind:controlsOpen={avatarControlsOpen}
      />
      <button class="btn-close-avatar" onclick={closeDialog}>❌ Chiudi</button>
    </div>
  </div>

  <dialog
    id="mioDialog"
    class={$message.type === "error"
      ? "error"
      : $message.type === "success"
        ? "success"
        : $message.type === "confirmation"
          ? "confirmation"
          : "info"}
    open
  >
    <span
      >{$message.type === "error"
        ? "🚨"
        : $message.type === "success"
          ? "🎉"
          : $message.type === "confirmation"
            ? "📝"
            : "💬"}
    </span>

    <p>{$message.text}</p>

    {#if $message.type === "confirmation"}
      <button onclick={confirmDialog}>Conferma</button>
    {/if}

    <button onclick={closeDialog}>Chiudi</button>
  </dialog>
{/if}

<!-- [ Style ] ---------------------------------------------------------------------------------->
<style>
  dialog {
    position: absolute;
    top: 25%;
    left: 25%;
    transform: translateX(-25%) translateY(-25%);
    margin: 20px;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 80%;
    font-family: "Courier New", Courier, monospace;
    z-index: 1000;
  }

  span {
    font-size: 2rem;
  }
  dialog.info {
    border: 2px solid #444;
    border-radius: 8px;
    background-color: #f0f0f0;
  }
  dialog.error {
    border: 2px solid #ff4c4c;
    border-radius: 8px;
    background-color: #ffe5e5;
  }
  dialog.success {
    border: 2px solid #4caf50;
    border-radius: 8px;
    background-color: #e6ffe6;
  }
  dialog.confirmation {
    border: 2px solid #2196f3;
    border-radius: 8px;
    background-color: #e6f0ff;
  }

  button {
    margin-top: 15px;
    padding: 8px 16px;
    font-size: 1rem;
    cursor: pointer;
    border: none;
    border-radius: 4px;
  }

  .info button {
    background-color: #444;
    color: white;
  }

  .info button:hover {
    background-color: #666;
  }

  .error button {
    background-color: #ff4c4c;
    color: white;
  }
  .error button:hover {
    background-color: #ff1a1a;
  }

  .success button {
    background-color: #4caf50;
    color: white;
  }
  .success button:hover {
    background-color: #45a049;
  }
  .confirmation button {
    background-color: #2196f3;
    color: white;
  }
  .confirmation button:hover {
    background-color: #0b7dda;
  }

  .confirmation button:hover {
    background-color: #0b7dda;
  }

  /* Avatar Dialog (Matching Annotazione.svelte) */
  .avatar-dialog {
    position: fixed;
    top: 80px;
    left: 20px;
    z-index: 2000;
    animation: slideIn 0.5s ease-out;
  }

  .avatar-container {
    background: #222;
    border: 3px solid #ffcc00;
    padding: 20px;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .avatar-container h3 {
    color: #ffcc00;
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
