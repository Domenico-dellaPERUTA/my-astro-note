/* src/lib/markdown.ts */
import { marked } from 'marked';
import createDOMPurify from 'dompurify';
import { createHighlighter } from 'shiki';

let highlighter: any = null;

/**
 * Inizializza l'highlighter di Shiki (Singleton).
 * Include una vasta gamma di linguaggi comuni.
 */
async function getHighlighter() {
    if (!highlighter) {
        highlighter = await createHighlighter({
            themes: ['github-light'],
            langs: [
                'javascript', 'typescript', 'html', 'css', 'xml',
                'json', 'bash', 'markdown', 'sql', 'python',
                'php', 'rust', 'csharp', 'cpp', 'java', 'yaml'
            ]
        });
    }
    return highlighter;
}

// Configure marked with custom extensions (initialize only once)
marked.use({
    extensions: [
        {
            name: 'underline',
            level: 'inline',
            start(src: any) { return src.match(/\+\+/)?.index; },
            tokenizer(src: any, tokens: any) {
                const rule = /^\+\+(.*?)\+\+/;
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: 'underline',
                        raw: match[0],
                        text: match[1].trim(),
                        tokens: (this as any).lexer.inlineTokens(match[1].trim())
                    };
                }
            },
            renderer(token: any) {
                return `<u>${(this as any).parser.parseInline(token.tokens)}</u>`;
            }
        },
        {
            name: 'quiz',
            level: 'block',
            start(src: any) { return src.match(/:::quiz/)?.index; },
            tokenizer(src: any, tokens: any) {
                const rule = /^:::quiz[ \t]*(.*)[\r\n]+([\s\S]*?)[\r\n]+:::/;
                const match = rule.exec(src);
                if (match) {
                    const title = match[1].trim() || 'Quiz';
                    const body = match[2];

                    const timeMatch = body.match(/::time\s+(.*)/);
                    const timeStr = timeMatch ? timeMatch[1].trim() : null;

                    const okMatch = body.match(/::ok\s+([\d.-]+)/);
                    const errorMatch = body.match(/::error\s+([\d.-]+)/);
                    const nullMatch = body.match(/::null\s+([\d.-]+)/);

                    const scoring = {
                        ok: okMatch ? parseFloat(okMatch[1]) : 1,
                        error: errorMatch ? parseFloat(errorMatch[1]) : 0,
                        null: nullMatch ? parseFloat(nullMatch[1]) : 0
                    };

                    const questions: any[] = [];
                    let currentQuestion: any = null;

                    body.split(/\r?\n/).forEach(line => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('? ')) {
                            currentQuestion = { question: trimmedLine.substring(2).trim(), options: [] };
                            questions.push(currentQuestion);
                        } else if (trimmedLine.startsWith('- [ ] ') || trimmedLine.startsWith('- [x] ')) {
                            if (currentQuestion) {
                                currentQuestion.options.push({
                                    text: trimmedLine.substring(6).trim(),
                                    correct: trimmedLine.startsWith('- [x]')
                                });
                            }
                        }
                    });

                    return {
                        type: 'quiz',
                        raw: match[0],
                        title,
                        time: timeStr,
                        scoring,
                        questions
                    };
                }
            },
            renderer(token: any) {
                const quizData = JSON.stringify({
                    title: token.title,
                    time: token.time,
                    scoring: token.scoring,
                    questions: token.questions
                });
                try {
                    const base64Data = btoa(encodeURIComponent(quizData));
                    return `<div class="quiz-placeholder" data-quiz="${base64Data}"></div>`;
                } catch (e) {
                    console.error("Encoding error:", e);
                    return `<div class="error">Errore codifica quiz: ${String(e)}</div>`;
                }
            }
        },
        {
            name: 'slide',
            level: 'block',
            start(src: any) { return src.match(/:::slide/)?.index; },
            tokenizer(src: any, tokens: any) {
                const rule = /^:::slide[ \t]*(.*)[\r\n]+([\s\S]*?)[\r\n]+:::/;
                const match = rule.exec(src);
                if (match) {
                    const title = match[1].trim() || 'Presentazione';
                    const body = match[2];

                    // Split slides by --- delimiter
                    const rawSlides = body.split(/^---$/m).map(s => s.trim()).filter(s => s);

                    const slides: any[] = [];

                    rawSlides.forEach(slideContent => {
                        // Check if it's an image
                        const imageMatch = slideContent.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
                        if (imageMatch) {
                            slides.push({
                                type: 'image',
                                content: imageMatch[2] // URL
                            });
                        }
                        // Check if it's a code block
                        else if (slideContent.match(/^```/)) {
                            const codeMatch = slideContent.match(/^```(\w+)?\n([\s\S]*?)```/);
                            if (codeMatch) {
                                const lang = codeMatch[1] || 'text';
                                const code = codeMatch[2];

                                // We'll render the code using shiki later
                                slides.push({
                                    type: 'code',
                                    content: code,
                                    lang: lang
                                });
                            }
                        }
                    });

                    return {
                        type: 'slide',
                        raw: match[0],
                        title,
                        slides
                    };
                }
            },
            renderer(token: any) {
                const slideData = JSON.stringify({
                    title: token.title,
                    slides: token.slides
                });
                try {
                    const base64Data = btoa(encodeURIComponent(slideData));
                    return `<div class="slide-placeholder" data-slide="${base64Data}"></div>`;
                } catch (e) {
                    console.error("Encoding error:", e);
                    return `<div class="error">Errore codifica slide: ${String(e)}</div>`;
                }
            }
        }
    ]
} as any);

// Configure shiki highlighting in marked
async function setupHighlighter() {
    const hl = await getHighlighter();
    marked.use({
        renderer: {
            code({ text, lang }: { text: string; lang?: string }) {
                try {
                    return hl.codeToHtml(text, {
                        lang: lang || 'text',
                        theme: 'github-light'
                    });
                } catch (e) {
                    console.error("Shiki highlighting error:", e);
                    return `<pre><code class="language-${lang}">${text}</code></pre>`;
                }
            }
        } as any
    });
}

// Inizializza l'highlighter
setupHighlighter();

export async function renderMarkdown(content: string): Promise<string> {
    if (!content) return '';

    let purify;

    if (import.meta.env.SSR) {
        const { JSDOM } = await import('jsdom');
        const window = new JSDOM('').window;
        purify = createDOMPurify(window as any);
    } else {
        purify = createDOMPurify(window);
    }

    // Assicuriamoci che l'highlighter sia pronto (anche se setupHighlighter è async e gira in background)
    await getHighlighter();

    const rawHtml = await marked.parse(content, {
        breaks: true
    });

    // Configure DOMPurify to allow the quiz/slide placeholder and shiki-generated styles
    // NOTA: ADD_TAGS e ADD_ATTR aggiungono alla whitelist esistente
    return purify.sanitize(rawHtml as string, {
        ADD_ATTR: ['data-quiz', 'data-slide', 'style', 'class'],
        ADD_TAGS: ['div', 'span', 'pre', 'code']
    });
}
