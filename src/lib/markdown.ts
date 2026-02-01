/* src/lib/markdown.ts */
import { marked } from 'marked';
import createDOMPurify from 'dompurify';

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
                // Permissive regex for quiz blocks: allows optional spaces and handles newlines better
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
        }
    ]
} as any);

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

    const rawHtml = await marked.parse(content, { breaks: true });

    // Configure DOMPurify to allow the quiz placeholder and its data attribute
    return purify.sanitize(rawHtml as string, {
        ADD_ATTR: ['data-quiz'],
        ADD_TAGS: ['div']
    });
}
