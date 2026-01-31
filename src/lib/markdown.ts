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

    // Custom syntax: ++underline++ -> <u>underline</u>
    const contentWithUnderline = contentWithTabs.replace(/\+\+(.*?)\+\+/g, '<u>$1</u>');

    const rawHtml = await marked.parse(contentWithUnderline, { breaks: true });
    return purify.sanitize(rawHtml as string);
}
