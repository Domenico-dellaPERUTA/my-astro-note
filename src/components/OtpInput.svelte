<script>
    import { createEventDispatcher, onMount } from "svelte";

    export let length = 6;
    export let value = "";

    const dispatch = createEventDispatcher();
    let inputs = [];
    let values = Array(length).fill("");

    function handleInput(index, event) {
        const input = event.target;
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

    function handleKeyDown(index, event) {
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

    function handlePaste(event) {
        event.preventDefault();
        const pastedData = event.clipboardData.getData("text").slice(0, length);
        if (/^\d+$/.test(pastedData)) {
            pastedData.split("").forEach((char, i) => {
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
        dispatch("input", value);
        if (value.length === length) {
            dispatch("complete", value);
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
            on:input={(e) => handleInput(i, e)}
            on:keydown={(e) => handleKeyDown(i, e)}
            on:paste={i === 0 ? handlePaste : null}
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
