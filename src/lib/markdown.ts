/* src/utils/markdown.ts */
import { marked } from 'marked';
import createDOMPurify from 'dompurify';

export async function renderMarkdown(content: string): Promise<string> {
    if (!content) return '';

    let purify;

    if (import.meta.env.SSR) {
        // Server-side: use jsdom to create a window for DOMPurify
        const { JSDOM } = await import('jsdom');
        const window = new JSDOM('').window;
        purify = createDOMPurify(window as any);
    } else {
        // Client-side: use the browser's window
        purify = createDOMPurify(window);
    }

    // Replace tabs with 4 non-breaking spaces and double spaces with 2 non-breaking spaces
    const contentWithTabs = content;

    // Configure marked with custom underline extension
    marked.use({
        extensions: [{
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
        }]
    } as any);

    const rawHtml = await marked.parse(contentWithTabs, { breaks: true });
    return purify.sanitize(rawHtml as string);
}
