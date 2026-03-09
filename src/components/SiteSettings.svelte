<script lang="ts">
    import { actions } from "astro:actions";
    import { onMount } from "svelte";

    let languages = [
        { code: "it", icon: "🇮🇹", label: "Italiano" },
        { code: "en", icon: "🇬🇧", label: "English" },
        { code: "es", icon: "🇪🇸", label: "Español" },
        { code: "fr", icon: "🇫🇷", label: "Français" },
        { code: "de", icon: "🇩🇪", label: "Deutsch" },
        { code: "zh", icon: "🇨🇳", label: "中文" },
        { code: "ja", icon: "🇯🇵", label: "日本語" },
        { code: "ar", icon: "🇸🇦", label: "العربية" },
        { code: "ru", icon: "🇷🇺", label: "Русский" },
    ];

    let defaultLang = $state("it");
    let loading = $state(true);
    let saving = $state(false);
    let message = $state("");
    let messageType = $state("info"); // info, success, error

    onMount(async () => {
        try {
            const config = await actions.config.getSiteConfig();
            if (config.data) {
                defaultLang = config.data.defaultLang || "it";
            }
        } catch (e) {
            console.error("Errore nel caricamento della configurazione:", e);
        } finally {
            loading = false;
        }
    });

    async function saveSettings() {
        saving = true;
        message = "Salvataggio in corso...";
        messageType = "info";
        try {
            const result = await actions.config.updateSiteConfig({
                defaultLang,
            });
            if (result.data?.success) {
                message = "Configurazione salvata con successo!";
                messageType = "success";
            } else {
                message = `Errore: ${result.error?.message || "Errore durante il salvataggio."}`;
                messageType = "error";
            }
        } catch (e) {
            message = "Errore di connessione.";
            messageType = "error";
            console.error(e);
        } finally {
            saving = false;
        }
    }
</script>

<div class="settings-card">
    <h3>Configurazione Sito</h3>

    {#if loading}
        <div class="loader">Caricamento in corso...</div>
    {:else}
        <div class="setting-item">
            <span class="group-label"
                >Lingua Predefinita (Redirect iniziale):</span
            >
            <div class="radio-group">
                {#each languages as lang}
                    <label class="radio-label">
                        <input
                            type="radio"
                            name="defaultLang"
                            value={lang.code}
                            bind:group={defaultLang}
                        />
                        <span class="flag">{lang.icon}</span>
                        <span class="text">{lang.label}</span>
                    </label>
                {/each}
            </div>
        </div>

        <div class="actions">
            <button class="save-btn" onclick={saveSettings} disabled={saving}>
                {saving ? "Salvataggio..." : "Salva Configurazione"}
            </button>
        </div>

        {#if message}
            <div class="message {messageType}">
                {message}
            </div>
        {/if}
    {/if}
</div>

<style>
    .settings-card {
        background: #fffcf0;
        padding: 2rem;
        border-radius: 4px;
        box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.1);
        border: 1px solid #e0d0a0;
    }

    h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid #e0d0a0;
        padding-bottom: 0.5rem;
    }

    .setting-item {
        margin-bottom: 2rem;
    }

    .setting-item span.group-label {
        display: block;
        font-weight: bold;
        margin-bottom: 1rem;
        color: #444;
    }

    .radio-group {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
    }

    .radio-label {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .radio-label:hover {
        border-color: #aaa;
        background: #f9f9f9;
    }

    .radio-label input {
        margin: 0;
    }

    .flag {
        font-size: 1.2rem;
    }

    .text {
        font-size: 0.9rem;
    }

    .actions {
        margin-top: 2rem;
    }

    .save-btn {
        background: #333;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.2s;
    }

    .save-btn:hover:not(:disabled) {
        background: #000;
    }

    .save-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .message {
        margin-top: 1rem;
        padding: 10px;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .message.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .message.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .message.info {
        background: #e2e3e5;
        color: #383d41;
        border: 1px solid #d6d8d9;
    }
</style>
