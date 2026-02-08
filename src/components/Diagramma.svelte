<script lang="ts">
    import { onMount } from "svelte";
    import { graphviz } from "d3-graphviz";
    import * as d3 from "d3";

    export let content: string;

    let graphvizContainer: HTMLElement;
    let error: string | null = null;

    async function renderChart() {
        if (!graphvizContainer || !content) return;
        error = null;

        try {
            // @ts-ignore
            // @ts-ignore
            graphviz(graphvizContainer)
                .options({
                    fit: false,
                    zoom: true,
                })
                .renderDot(content)
                .on("end", () => {
                    // console.log("Rendered");
                });
        } catch (e: any) {
            console.error("Graphviz Render Error:", e);
            error = e.toString();
        }
    }

    $: if (content) {
        // Debouncing can be added if needed
        renderChart();
    }

    onMount(() => {
        renderChart();
    });
</script>

<div class="diagram-container">
    {#if error}
        <div class="error-msg">{error}</div>
    {/if}

    <div class="chart" bind:this={graphvizContainer}></div>
</div>

<style>
    .diagram-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
        height: 100%;
        min-height: 300px; /* Ensure space */
    }

    .chart {
        width: 100%;
        flex: 1;
        overflow: hidden;
        background: white;
        border-radius: 4px;
        border: 1px solid #eee;
    }

    .error-msg {
        color: red;
        font-weight: bold;
        padding: 10px;
        border: 1px solid red;
        background: #ffeeee;
        width: 100%;
    }
</style>
