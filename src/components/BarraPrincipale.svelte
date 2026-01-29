<!--
---------------------------------------------------------------------------------------------------
 src/components/BarraPrincipale.svelte 
---------------------------------------------------------------------------------------------------
-->

<!-- [ Controller ] ------------------------------------------------------------------------------>
<script lang="ts">
  import { isEdit, userRole } from "../stores/notesStore";
  export let titolo = "Home";

  function apriLogin() {
    window.location.href = "/login";
  }
</script>

<!-- [ View ] ------------------------------------------------------------------------------------>
<nav class="barra-principale">
  <h1>{$isEdit === true ? "✏️" : "📎"} {titolo}</h1>

  <div class="nav-actions">
    {#if $userRole === "admin"}
      <a href="/admin/files" class="admin-link" title="Gestione File e Media">
        📁 File
      </a>
    {/if}

    <button
      class="user-btn"
      class:guest={$userRole === "guest"}
      class:admin={$userRole === "admin"}
      on:click={apriLogin}
      title="Profilo Utente"
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
    font-size: 1.5rem;
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
</style>
