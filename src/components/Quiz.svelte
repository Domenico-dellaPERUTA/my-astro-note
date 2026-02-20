<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { quizActiveState } from "../stores/quizStore";

    let { quiz = {} } = $props<{ quiz: any }>();

    let title = $derived(quiz?.title || "Quiz");
    let questions = $derived(quiz?.questions || []);
    let timeLimit = $derived(quiz?.time || null);

    let secondsLeft = $state(0);
    let timerStarted = $state(false);
    let timerInterval: any;
    let quizFinished = $state(false);
    let selections = $state<Record<number, number>>({});
    let showResults = $state(false);

    onMount(() => {
        if (timeLimit) {
            const match = timeLimit.match(/(\d+)\s*(min|s|h|m)/);
            if (match) {
                const value = parseInt(match[1]);
                const unit = match[2];
                if (unit === "min" || unit === "m") secondsLeft = value * 60;
                else if (unit === "s") secondsLeft = value;
                else if (unit === "h") secondsLeft = value * 3600;
            }
        }
    });

    function startTimer() {
        if (timerStarted || quizFinished) return;
        timerStarted = true;
        quizActiveState.update((s) => ({
            ...s,
            isActive: true,
            totalQuestions: questions.length,
            secondsLeft: secondsLeft,
            title,
        }));
        if (secondsLeft > 0) {
            timerInterval = setInterval(() => {
                if (secondsLeft > 0) {
                    secondsLeft--;
                    quizActiveState.update((s) => ({ ...s, secondsLeft }));
                } else {
                    finishQuiz();
                }
            }, 1000);
        }
    }

    function finishQuiz() {
        quizFinished = true;
        showResults = true;
        clearInterval(timerInterval);
        quizActiveState.update((s) => ({ ...s, isActive: false }));
    }

    function handleSelect(qIdx: number, oIdx: number) {
        if (quizFinished) return;
        if (!timerStarted) startTimer();
        selections[qIdx] = oIdx;
        const answeredCount = Object.keys(selections).length;
        quizActiveState.update((s) => ({ ...s, answeredCount }));
    }

    onDestroy(() => {
        clearInterval(timerInterval);
        quizActiveState.set({
            isActive: false,
            secondsLeft: 0,
            answeredCount: 0,
            totalQuestions: 0,
            title: "",
        });
    });

    let scoring = $derived(quiz?.scoring || { ok: 1, error: 0, null: 0 });

    let score = $derived(
        questions.reduce((acc: number, q: any, i: number) => {
            const selection = selections[i];
            if (selection === undefined) return acc + scoring.null;
            if (q.options[selection]?.correct) return acc + scoring.ok;
            return acc + scoring.error;
        }, 0),
    );

    // Format score for display (removes trailing zeros if integer)
    let displayScore = $derived(Number(score.toFixed(2)));
    let maxScore = $derived(questions.length * scoring.ok);

    function formatTime(s: number) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    }
</script>

<div class="quiz-box {quizFinished ? 'finished' : ''}">
    <div class="quiz-header">
        <span class="quiz-tag">PUNTEGGIO: {score}/{questions.length}</span>
        <h3>{title}</h3>
        {#if secondsLeft > 0 || timerStarted}
            <div class="timer {secondsLeft < 10 ? 'urgent' : ''}">
                ⏱️ {formatTime(secondsLeft)}
            </div>
        {/if}
    </div>

    <div class="questions-list">
        {#each questions as q, qIdx}
            <div class="question-item">
                <p class="question-text">{q.question}</p>
                <div class="options-grid">
                    {#each q.options as opt, oIdx}
                        <button
                            class="option-btn"
                            class:selected={selections[qIdx] === oIdx}
                            class:correct={showResults && opt.correct}
                            class:wrong={showResults &&
                                selections[qIdx] === oIdx &&
                                !opt.correct}
                            disabled={quizFinished}
                            on:click={() => handleSelect(qIdx, oIdx)}
                        >
                            <span class="checkbox">
                                {selections[qIdx] === oIdx ? "☒" : "☐"}
                            </span>
                            {opt.text}
                        </button>
                    {/each}
                </div>
            </div>
        {/each}
    </div>

    {#if !quizFinished && Object.keys(selections).length > 0}
        <button class="submit-btn" on:click={finishQuiz}>
            CONSEGNA COMPITO 📄
        </button>
    {/if}

    {#if showResults}
        <div class="results-overlay">
            <div class="stamp {displayScore === maxScore ? 'gold' : 'ink'}">
                {displayScore}/{maxScore}
            </div>
            <p>Esame completato.</p>
        </div>
    {/if}
</div>

<style>
    .quiz-box {
        background: #fff;
        border: 2px solid #333;
        padding: 30px;
        margin: 20px 0;
        position: relative;
        font-family: var(--font-main);
        box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.1);
    }

    .quiz-header {
        border-bottom: 2px double #333;
        margin-bottom: 25px;
        padding-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .quiz-tag {
        font-size: 0.8rem;
        background: #333;
        color: #fff;
        padding: 2px 8px;
        text-transform: uppercase;
    }

    h3 {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 2px;
    }

    .timer {
        font-weight: bold;
        font-variant-numeric: tabular-nums;
        padding: 5px 10px;
        border: 1px solid #333;
    }

    .timer.urgent {
        color: #d45d5d;
        animation: blink 1s infinite;
    }

    @keyframes blink {
        50% {
            opacity: 0.5;
        }
    }

    .question-item {
        margin-bottom: 30px;
    }

    .question-text {
        font-weight: bold;
        font-size: 1.1rem;
        margin-bottom: 15px;
    }

    .options-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .option-btn {
        text-align: left;
        background: none;
        border: 1px solid #ccc;
        padding: 10px 15px;
        font-family: inherit;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .option-btn:hover:not(:disabled) {
        background: #f0f0f0;
        border-color: #333;
    }

    .option-btn.selected {
        background: #fdf6e3;
        border-color: #333;
        font-weight: bold;
    }

    .option-btn.correct {
        background: #e1f5fe !important;
        border-color: #03a9f4 !important;
        color: #01579b;
    }

    .option-btn.wrong {
        background: #ffebee !important;
        border-color: #ef5350 !important;
        color: #b71c1c;
        text-decoration: line-through;
    }

    .checkbox {
        font-size: 1.4rem;
    }

    .submit-btn {
        width: 100%;
        background: #333;
        color: #fff;
        border: none;
        padding: 15px;
        font-family: inherit;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        margin-top: 20px;
        letter-spacing: 2px;
    }

    .results-overlay {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 2px dashed #333;
        text-align: center;
        position: relative;
    }

    .stamp {
        position: absolute;
        top: -40px;
        right: 0;
        font-size: 3rem;
        font-weight: 900;
        border: 5px double;
        padding: 10px 20px;
        transform: rotate(15deg);
        opacity: 0.8;
        pointer-events: none;
    }

    .stamp.ink {
        color: #4e73ab;
        border-color: #4e73ab;
    }

    .stamp.gold {
        color: #bfa100;
        border-color: #bfa100;
    }
</style>
