<!-- Da implementare in futuro... -->
<script lang="ts">
    import { onMount } from 'svelte';
    
    let { pinConnections = [] } = $props<{ 
        pinConnections: Array<{ fromPinId: number; toPinId: number }> 
    }>();
    
    let canvas: HTMLCanvasElement;
    
    onMount(() => {
        setTimeout(drawLines, 500);
        setTimeout(drawLines, 1000);
        
        window.addEventListener('resize', drawLines);
        const container = document.querySelector('.content-area');
        if (container) {
            container.addEventListener('scroll', drawLines);
        }
        
        return () => {
            window.removeEventListener('resize', drawLines);
            if (container) {
                container.removeEventListener('scroll', drawLines);
            }
        };
    });
    
    function getPinCoordinates(pinId: number) {
        const pin = document.querySelector(`[data-pin-id="${pinId}"]`) as HTMLElement;
        if (!pin) return null;
        
        const container = document.querySelector('.content-area') as HTMLElement;
        if (!container) return null;
        
        const pinRect = pin.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Coordinate assolute nel canvas (incluso scroll)
        const x = pinRect.left - containerRect.left + container.scrollLeft + pinRect.width / 2;
        const y = pinRect.top - containerRect.top + container.scrollTop + pinRect.height / 2;
        
        return { x, y };
    }
    
    function drawLines() {
        if (!canvas) return;
        
        const container = document.querySelector('.content-area') as HTMLElement;
        if (!container) return;
        
        // Imposta dimensioni canvas
        canvas.width = container.scrollWidth;
        canvas.height = container.scrollHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Pulisci canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Disegna ogni connessione
        pinConnections.forEach(({ fromPinId, toPinId }) => {
            const from = getPinCoordinates(fromPinId);
            const to = getPinCoordinates(toPinId);
            
            if (!from || !to) return;
            
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        });
    }
    
    $effect(() => {
        pinConnections;
        setTimeout(drawLines, 100);
    });
</script>

<canvas bind:this={canvas} class="connection-canvas"></canvas>

<style>
    .connection-canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 100;
    }
</style>