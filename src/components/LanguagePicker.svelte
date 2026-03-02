<!-- src/components/LanguagePicker.svelte -->
<script lang="ts">
    /**
     * Componente per la selezione della lingua (Italiano/Inglese).
     * Design: Dropdown verticale tipo "select" con icone.
     */
    let { currentLang = "en" } = $props<{ currentLang?: string }>();

    let isOpen = $state(false);

    const languages = [
        { code: "en", icon: "🇬🇧", label: "English" },
        { code: "it", icon: "🇮🇹", label: "Italiano" },
        { code: "es", icon: "🇪🇸", label: "Español" },
        { code: "fr", icon: "🇫🇷", label: "Français" },
        { code: "de", icon: "🇩🇪", label: "Deutsch" },
        { code: "zh", icon: "🇨🇳", label: "中文" },
        { code: "ja", icon: "🇯🇵", label: "日本語" },
        { code: "ar", icon: "🇸🇦", label: "العربية"},
        { code: "ru", icon: "🇷🇺", label: "Русский"},
    ];

    function switchLanguage(targetLang: string) {
        if (targetLang === currentLang) {
            isOpen = false;
            return;
        }

        const pathname = window.location.pathname;
        const search = window.location.search;
        let segments = pathname.split("/").filter(Boolean);

        // Se il primo segmento è una delle lingue conosciute, lo sostituiamo
        if (
            segments.length > 0 &&
            (segments[0] === "en" || segments[0] === "it" || segments[0] === "es" || segments[0] === "fr" 
            || segments[0] === "de" || segments[0] === "zh" || segments[0] === "ja" || segments[0] === "ar" 
            || segments[0] === "ru")
        ) {
            segments[0] = targetLang;
        } else {
            // Se non c'è prefisso (es. siamo in /), aggiungiamo quello target
            segments.unshift(targetLang);
        }

        const newPath =
            "/" +
            segments.join("/") +
            (pathname.endsWith("/") && !segments.length ? "/" : "") +
            search;
        window.location.href = newPath;
    }

    // Chiudi il menù se si clicca fuori (semplice approccio con onblur o state)
    function toggleMenu() {
        isOpen = !isOpen;
    }

    function closeMenu() {
        setTimeout(() => (isOpen = false), 200); // Piccolo delay per permettere il click sugli item
    }
</script>

<div class="lang-selector-container">
    <button
        class="main-btn"
        onclick={toggleMenu}
        onblur={closeMenu}
        title="Cambia lingua"
    >
        <span class="flag"
            >{languages.find((l) => l.code === currentLang)?.icon || "🌐"}</span
        >
        <span class="arrow">{isOpen ? "▲" : "▼"}</span>
    </button>

    {#if isOpen}
        <div class="dropdown-menu">
            {#each languages as lang}
                <button
                    class="menu-item"
                    class:active={lang.code === currentLang}
                    onclick={() => switchLanguage(lang.code)}
                >
                    <span class="flag">{lang.icon}</span>
                    <span class="label">{lang.label}</span>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .lang-selector-container {
        position: relative;
        display: inline-block;
        font-family: inherit;
    }

    .main-btn {
        background: #444;
        border: 1px solid #666;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 60px;
        height: 38px;
        transition: all 0.2s;
        font-size: 1.2rem;
    }

    .main-btn:hover {
        background: #555;
        border-color: #888;
    }

    .arrow {
        font-size: 0.7rem;
        opacity: 0.7;
    }

    .dropdown-menu {
        position: absolute;
        top: 110%;
        right: 0;
        background: #333;
        border: 1px solid #666;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        z-index: 1000;
        min-width: 130px;
        overflow: hidden;
        animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .menu-item {
        background: none;
        border: none;
        color: white;
        padding: 10px 15px;
        text-align: left;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background 0.2s;
        width: 100%;
        font-size: 1rem;
    }

    .menu-item:hover {
        background: #444;
    }

    .menu-item.active {
        background: rgba(255, 255, 255, 0.1);
        font-weight: bold;
    }

    .label {
        font-size: 0.9rem;
    }

    .flag {
        font-size: 1.2rem;
    }
</style>
