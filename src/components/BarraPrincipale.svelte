<!--
---------------------------------------------------------------------------------------------------
 src/components/BarraPrincipale.svelte 
---------------------------------------------------------------------------------------------------
-->

<!-- [ Controller ] ------------------------------------------------------------------------------>
<script lang="ts">
  import {
    isEdit,
    userRole as userRoleStore,
    type UserRole,
  } from "../stores/notesStore";
  import { quizActiveState } from "../stores/quizStore";
  import { onMount } from "svelte";

  export let titolo = "Home";
  export let userRole: UserRole | undefined = undefined;

  onMount(() => {
    if (userRole) {
      userRoleStore.set(userRole);
    }
  });

  async function handleUserClick() {
    if ($userRoleStore === "admin") {
      try {
        await fetch("/api/logout", { method: "POST" });
        userRoleStore.set("guest");
        window.location.href = "/";
      } catch (e) {
        console.error("Errore logout:", e);
      }
    } else {
      window.location.href = "/login";
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }
</script>

<!-- [ View ] ------------------------------------------------------------------------------------>
<nav class="barra-principale">
  <div class="header-left">
    <h1>{$isEdit === true ? "✏️" : "📎"} {titolo}</h1>
  </div>

  {#if $quizActiveState.isActive}
    <div class="quiz-status-header">
      <div
        class="quiz-timer {$quizActiveState.secondsLeft < 10 ? 'urgent' : ''}"
      >
        ⏱️ {formatTime($quizActiveState.secondsLeft)}
      </div>
      <div class="quiz-progress">
        📝 {$quizActiveState.answeredCount}/{$quizActiveState.totalQuestions}
      </div>
    </div>
  {/if}

  <div class="nav-actions">
    {#if $userRoleStore === "admin"}
      <a href="/admin/files" class="admin-link" title="Gestione File e Media">
        📁 File
      </a>
    {/if}

    <button
      class="user-btn"
      class:guest={$userRoleStore === "guest"}
      class:admin={$userRoleStore === "admin"}
      on:click={handleUserClick}
      title={$userRoleStore === "admin" ? "Logout Amministratore" : "Accedi"}
    >
      👤
    </button>
  </div>
</nav>

<!-- [ Style ] ---------------------------------------------------------------------------------->
<style>
  .barra-principale {
    background-color: #333;
    color: white;
    padding: 10px;
    text-align: center;
    border-bottom: 2px solid #ddd;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-family: "Courier New", Courier, monospace;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem !important;
    flex-grow: 1;
    text-align: center;
  }

  .user-btn {
    background: none;
    border: 2px solid transparent;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 5px;
    transition: all 0.3s;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  /* Guest Role - Green */
  .guest {
    color: #4caf50;
    border-color: #4caf50;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .admin-link {
    color: #fff;
    text-decoration: none;
    font-weight: bold;
    font-size: 0.9rem;
    padding: 5px 12px;
    background: #444;
    border: 1px solid #666;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .admin-link:hover {
    background: var(--highlight);
    border-color: #fff;
    transform: translateY(-2px);
  }

  /* Admin Role - Red */
  .admin {
    color: #d45d5d;
    border-color: #d45d5d;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 90%;
  }

  .quiz-status-header {
    display: flex;
    gap: 20px;
    background: #ab2727;
    padding: 5px 15px;
    border: 1px solid #444;
    border-radius: 20px;
    font-size: 0.9rem;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
    position: fixed;
  }

  .quiz-timer {
    font-weight: bold;
    color: #fff;
  }

  .quiz-timer.urgent {
    color: #ff5252;
    animation: pulse 1s infinite alternate;
  }

  @keyframes pulse {
    from {
      opacity: 1;
    }
    to {
      opacity: 0.5;
    }
  }

  .quiz-progress {
    color: #ffc107;
    font-weight: bold;
  }
</style>
