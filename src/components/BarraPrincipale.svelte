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

  <button
    class="user-btn"
    class:guest={$userRole === "guest"}
    class:admin={$userRole === "admin"}
    on:click={apriLogin}
    title="Profilo Utente"
  >
    👤
  </button>
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

  /* Admin Role - Red */
  .admin {
    color: #d45d5d;
    border-color: #d45d5d;
  }
</style>
