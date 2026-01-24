<!--
---------------------------------------------------------------------------------------------------
 src/components/BarraPrincipale.svelte 
---------------------------------------------------------------------------------------------------
-->

<!-- [ Controller ] ------------------------------------------------------------------------------>
<script>
  export let titolo = "Home";
</script>

<!-- [ View ] ------------------------------------------------------------------------------------>
<nav class="barra-principale">
  <h1>{titolo}</h1>
</nav>

<!-- [ Style ] ---------------------------------------------------------------------------------->
<style>
  .barra-principale {
    background-color: #000000a4;
    color: rgb(176, 180, 190);
    padding: 15px 30px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  h1 {
    margin: 0;
    font-size: 3rem;
    font-weight: normal;
    font-family: "Courier New", Courier, monospace;
    text-align: center;
  }
</style>
