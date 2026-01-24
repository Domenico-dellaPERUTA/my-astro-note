<script lang="ts">
  import { message } from "../stores/notesStore";

  const confirmDialog = async () => {
    if ($message.confirm) {
      await $message.confirm();
    }
    closeDialog();
  };

  function closeDialog() {
    const dialog = document.getElementById("mioDialog") as HTMLDialogElement;
    message.set({ text: "", type: "info", confirm: undefined });
    dialog.close();
  }
</script>

{#if $message.text !== ""}
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
      <button on:click={confirmDialog}>Conferma</button>
    {/if}

    <button on:click={closeDialog}>Chiudi</button>
  </dialog>
{/if}

<style>
  dialog {
    position: absolute;
    top: 25%;
    left: 50%;
    transform: translateX(-50%);
    margin: 20px;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 80%;
    font-family: "Courier New", Courier, monospace;
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
</style>
