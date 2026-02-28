<script>
    import OtpInput from "./OtpInput.svelte";
    import { userRole } from "../stores/notesStore";
    import { actions, isActionError } from "astro:actions";

    export let passwordLabel;
    export let tokenLabel;
    export let userLabel;
    export let backLink;
    export let startMassage;
    export let successMessage;
    export let errorMessage;
    export let errorConnectionMessage;
    export let currentLang = "en";

    let username = "";
    let password = "";
    let token = "";
    let message = "";
    let isError = false;

    async function handleSubmit() {
        message = startMassage || "Accesso in corso...";
        isError = false;

        try {
            const { data, error } = await actions.login({
                username,
                password,
                token,
            });

            if (!error && data?.success) {
                message =
                    successMessage || "Login effettuato! Reindirizzamento...";
                userRole.set("admin"); // Update store
                setTimeout(() => {
                    window.location.href = `/${currentLang}/`;
                }, 1000);
            } else {
                isError = true;
                if (isActionError(error)) {
                    message =
                        error.message ||
                        errorConnectionMessage ||
                        "Errore di connessione";
                } else if (data && !data.success) {
                    message =
                        data.message ||
                        errorMessage ||
                        "Credenziali non valide";
                } else {
                    message = errorMessage || "Credenziali non valide";
                }
            }
        } catch (e) {
            isError = true;
            message = errorConnectionMessage || "Errore di connessione";
            console.error(e);
        }
    }

    function resettaUser() {
        userRole.set("guest");
    }
</script>

<form onsubmit={handleSubmit}>
    <div class="form-group">
        <label for="username">{userLabel}</label>
        <input
            type="text"
            id="username"
            bind:value={username}
            placeholder=""
            required
        />
    </div>

    <div class="form-group">
        <label for="password">{passwordLabel}</label>
        <input
            type="password"
            id="password"
            bind:value={password}
            placeholder=""
            required
        />
    </div>

    <div class="form-group">
        <label for="token">{tokenLabel}</label>
        <!-- OtpInput component updates the local token variable -->
        <OtpInput onInput={(val) => (token = val)} onComplete={handleSubmit} />
    </div>

    {#if message}
        <p class="message {isError ? 'error' : 'success'}">{message}</p>
    {/if}

    <div class="actions">
        <!--
        <button class="login-btn" type="submit">Accedi</button>
        -->
        <a href={`/${currentLang}/`} class="back-btn" onclick={resettaUser}
            >{backLink}</a
        >
    </div>
</form>

<style>
    .form-group {
        margin-bottom: 20px;
    }

    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 0.8rem;
    }

    input {
        width: 100%;
        padding: 10px;
        font-family: monospace;
        font-size: 1.1rem;
        border: none;
        border-bottom: 2px dashed #999;
        background: transparent;
        outline: none;
        transition: border-color 0.3s;
    }

    input:focus {
        border-bottom-color: #d45d5d;
        background-color: rgba(0, 0, 0, 0.02);
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 30px;
        text-align: center;
    }

    button {
        padding: 12px;
        font-family: inherit;
        font-size: 1rem;
        font-weight: bold;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid #999;
        background: transparent;
        transition: all 0.2s;
    }

    .login-btn {
        background-color: #333;
        color: #fff;
        border: none;
    }

    .login-btn:hover {
        background-color: #000;
    }

    .back-btn {
        color: #666;
        font-size: 0.9rem;
        text-decoration: none;
    }

    .back-btn:hover {
        text-decoration: underline;
        color: #333;
    }

    .message {
        text-align: center;
        font-weight: bold;
        margin-bottom: 15px;
    }

    .error {
        color: #d32f2f;
    }

    .success {
        color: #388e3c;
    }
</style>
