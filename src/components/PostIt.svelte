<script lang="ts">
    let { id, title, message, parent } = $props<{ 
        id: number;
        title?: string; 
        message?: string;
        parent?: number | null;
    }>();
    
    const randomRotation = Math.random() * 10 - 5;
</script>
 
<div class="post-it" >
    <div class="post-it-card" style="--rotation: {randomRotation}deg;">
        <span class="pin" data-pin-id={id}>📍</span>
        <h1>{title}</h1>
        <p>{message}</p>
    </div>
</div>

<style>
  .post-it {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 1; /* Mantieni questo */
  }
  
  .post-it-card {
    background: #fffcf0;
    width: 200px;
    height: 200px;
    padding: 20px;
    border-radius: 4px;
    box-shadow:
      1px 1px 3px rgba(0, 0, 0, 0.1),
      10px 10px 0px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0d0a0;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    
    transform-origin: 0.5rem -1rem;
    transform: rotate(var(--rotation));
    animation: cardAppear 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 2; /* Aggiungi questo per mettere il card sopra */
  }
  
  .pin {
    position: absolute;
    top: -1rem;
    left: 0.5rem;
    font-size: 2rem;
    overflow: visible;
    z-index: 10; /* Mantieni il pin ancora più in alto */
  }
  

  
  .post-it-card h1 {
    font-family: var(--font-main);
    color: var(--text-ink);
    font-size: 0.7rem;
    font-weight: bold;
    margin: 0 0 10px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: center;
    width: 100%;
  }
  
  .post-it-card p {
    font-family: 'Indie Flower', 'Comic Sans MS', cursive;
    color: #333;
    font-size: 1.4rem;
    line-height: 1.3;
    text-align: center;
    margin: auto;
    font-weight: 500;
    transform: rotate(-1deg);
  }

  @keyframes cardAppear {
    from {
      opacity: 0;
      transform: rotate(var(--rotation)) translateY(30px);
    }
    to {
      opacity: 1;
      transform: rotate(var(--rotation)) translateY(0);
    }
  }
</style>