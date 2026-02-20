<script lang="ts">
    import { onMount } from "svelte";

    let {
        length = 6,
        value = $bindable(""),
        onInput,
        onComplete,
    } = $props<{
        length?: number;
        value?: string;
        onInput?: (val: string) => void;
        onComplete?: (val: string) => void;
    }>();

    let inputs: HTMLInputElement[] = [];
    let values = $state(Array(length).fill(""));

    function handleInput(index: number, event: Event) {
        const input = event.target as HTMLInputElement;
        const val = input.value;

        if (!/^\d*$/.test(val)) {
            input.value = "";
            return;
        }

        if (val.length === 1) {
            values[index] = val;
            if (index < length - 1) {
                inputs[index + 1].focus();
            }
        } else if (val.length > 1) {
            // Handle paste or multi-char input if needed, but for now take first char
            values[index] = val[0];
            input.value = val[0];
            if (index < length - 1) {
                inputs[index + 1].focus();
            }
        }

        updateValue();
    }

    function handleKeyDown(index: number, event: KeyboardEvent) {
        if (event.key === "Backspace") {
            if (!values[index] && index > 0) {
                inputs[index - 1].focus();
                values[index - 1] = ""; // Clear previous on backspace if current is empty
                inputs[index - 1].value = "";
                updateValue();
            } else {
                values[index] = "";
                updateValue();
            }
        }
    }

    function handlePaste(event: ClipboardEvent) {
        event.preventDefault();
        if (!event.clipboardData) return;
        const pastedData = event.clipboardData.getData("text").slice(0, length);
        if (/^\d+$/.test(pastedData)) {
            pastedData.split("").forEach((char: string, i: number) => {
                values[i] = char;
                if (inputs[i]) inputs[i].value = char;
            });
            updateValue();
            // Focus last filled
            const lastIdx = Math.min(pastedData.length, length) - 1;
            if (inputs[lastIdx]) inputs[lastIdx].focus();
        }
    }

    function updateValue() {
        value = values.join("");
        onInput?.(value);
        if (value.length === length) {
            onComplete?.(value);
        }
    }

    onMount(() => {
        // Helper to allow parent to bind value
    });
</script>

<div class="otp-container">
    {#each Array(length) as _, i}
        <input
            bind:this={inputs[i]}
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="otp-input"
            oninput={(e) => handleInput(i, e)}
            onkeydown={(e) => handleKeyDown(i, e)}
            onpaste={i === 0 ? handlePaste : null}
            placeholder="•"
        />
    {/each}
</div>

<style>
    .otp-container {
        display: flex;
        gap: 10px;
        justify-content: center;
    }

    .otp-input {
        width: 40px;
        height: 50px;
        font-size: 1.5rem;
        text-align: center;
        border: 2px solid #ccc;
        border-radius: 4px;
        background: white;
        font-family: monospace;
    }

    .otp-input:focus {
        border-color: #333;
        outline: none;
        background-color: #f9f9f9;
    }
</style>
