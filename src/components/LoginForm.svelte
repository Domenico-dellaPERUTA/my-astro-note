<script>
    import OtpInput from "./OtpInput.svelte";
    import { userRole } from "../stores/notesStore";

    let username = "";
    let password = "";
    let token = "";
    let message = "";
    let isError = false;

    async function handleSubmit() {
        message = "Accesso in corso...";
        isError = false;

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, token }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                message = "Login effettuato! Reindirizzamento...";
                userRole.set("admin"); // Update store
                setTimeout(() => {
                    window.location.href = "/";
                }, 1000);
            } else {
                isError = true;
                message = data.message || "Credenziali non valide";
            }
        } catch (e) {
            isError = true;
            message = "Errore di connessione";
            console.error(e);
        }
    }

    function resettaUser() {
        userRole.set("guest");
    }
</script>

<form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
        <label for="username">Utente:</label>
        <input
            type="text"
            id="username"
            bind:value={username}
            placeholder="Nome utente"
            required
        />
    </div>

    <div class="form-group">
        <label for="password">Password:</label>
        <input
            type="password"
            id="password"
            bind:value={password}
            placeholder="Password"
            required
        />
    </div>

    <div class="form-group">
        <label for="token">Token (OTP):</label>
        <!-- OtpInput component updates the local token variable -->
        <OtpInput on:input={(e) => (token = e.detail)} />
    </div>

    {#if message}
        <p class="message {isError ? 'error' : 'success'}">{message}</p>
    {/if}

    <div class="actions">
        <button class="login-btn" type="submit">Accedi</button>
        <a href="/" class="back-btn" on:click={resettaUser}>← Torna alle Note</a
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
