<script lang="ts">
    export let slides: {
        type: "image" | "code";
        content: string;
        lang?: string;
    }[] = [];

    let currentSlide = 0;

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    }

    function goToSlide(index: number) {
        currentSlide = index;
    }
</script>

<div class="slide-container">
    <div class="slide-content">
        {#if slides.length > 0}
            {@const slide = slides[currentSlide]}
            {#if slide.type === "image"}
                <img src={slide.content} alt="Slide {currentSlide + 1}" />
            {:else if slide.type === "code"}
                <div class="code-slide">
                    {@html slide.content}
                </div>
            {/if}
        {:else}
            <p class="empty">Nessuna slide disponibile</p>
        {/if}
    </div>

    {#if slides.length > 1}
        <div class="slide-controls">
            <button
                class="nav-btn prev"
                on:click={prevSlide}
                title="Slide precedente"
            >
                ◀
            </button>

            <div class="slide-indicators">
                {#each slides as _, index}
                    <button
                        class="indicator"
                        class:active={index === currentSlide}
                        on:click={() => goToSlide(index)}
                        title="Vai a slide {index + 1}"
                    >
                        {index + 1}
                    </button>
                {/each}
            </div>

            <button
                class="nav-btn next"
                on:click={nextSlide}
                title="Slide successiva"
            >
                ▶
            </button>
        </div>

        <div class="slide-counter">
            {currentSlide + 1} / {slides.length}
        </div>
    {/if}
</div>

<style>
    .slide-container {
        position: relative;
        background: #f4ecd8; /* Colore carta come il resto dell'app */
        border: 2px solid #333;
        box-shadow: 5px 5px 0px #333;
        padding: 30px;
        margin: 20px 0;
        min-height: 400px;
        display: flex;
        flex-direction: column;
        font-family: var(--font-main);
    }

    .slide-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .slide-content img {
        max-width: 100%;
        max-height: 500px;
        height: auto;
        display: block;
        /* Effetto foto da album: bordo bianco molto spesso tipo polaroid */
        border: 16px solid #ffffff;
        border-bottom: 40px solid #ffffff;
        /* Ombra molto pronunciata per effetto foto sollevata */
        box-shadow:
            0 15px 30px rgba(0, 0, 0, 0.35),
            0 8px 15px rgba(0, 0, 0, 0.25),
            0 3px 6px rgba(0, 0, 0, 0.2),
            inset 0 0 0 1px rgba(0, 0, 0, 0.1) !important;
        background: #ffffff;
        transform: rotate(-0.5deg);
    }

    .code-slide {
        width: 100%;
        overflow-x: auto;
        /* Effetto documento stampato: carta leggermente ingiallita */
        padding: 25px;
        background: #f9f7f4;
        border: 2px solid #d4c5a9;
        border-top: 3px solid #c9b99a;
        box-shadow:
            3px 3px 8px rgba(0, 0, 0, 0.12),
            0 1px 3px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        position: relative;
    }

    .code-slide::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.03),
            transparent
        );
    }

    .empty {
        color: #999;
        font-style: italic;
        text-align: center;
    }

    .slide-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 2px dashed #ccc;
    }

    .nav-btn {
        background-color: var(--highlight);
        color: white;
        border: 2px solid #333;
        padding: 10px 20px;
        font-size: 1.2rem;
        cursor: pointer;
        box-shadow: 2px 2px 0px #333;
        transition: all 0.1s;
        font-family: var(--font-main);
    }

    .nav-btn:hover {
        background-color: #e56b6b;
        transform: translateY(-1px);
        box-shadow: 3px 3px 0px #333;
    }

    .nav-btn:active {
        transform: translate(2px, 2px);
        box-shadow: 0px 0px 0px #333;
    }

    .slide-indicators {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
        max-width: 600px;
    }

    .indicator {
        width: 35px;
        height: 35px;
        border: 2px solid #999;
        background: #f0f0f0;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: bold;
        transition: all 0.2s;
        font-family: var(--font-main);
        color: #666;
    }

    .indicator:hover {
        border-color: #333;
        background: #e0e0e0;
    }

    .indicator.active {
        background-color: var(--highlight);
        border-color: #333;
        color: white;
        box-shadow: 1px 1px 0px #333;
    }

    .slide-counter {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 5px 12px;
        border-radius: 3px;
        font-size: 0.85rem;
        font-weight: bold;
    }
</style>
