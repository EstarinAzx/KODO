import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { createHighlighter } from 'shiki';

let highlighterPromise: Promise<any> | null = null;

function getHighlighter() {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: ['css-variables'],
            langs: [
                'javascript', 'typescript', 'python', 'html', 'css',
                'json', 'markdown', 'bash', 'plaintext', 'jsx', 'tsx',
                'c', 'cpp', 'csharp', 'java', 'go', 'rust', 'ruby',
                'php', 'swift', 'kotlin', 'yaml', 'xml', 'sql', 'lua',
            ],
        }).catch((err) => {
            console.error('Shiki failed to load:', err);
            return null;
        });
    }
    return highlighterPromise;
}

// Start loading immediately on import
getHighlighter();

export function useShiki() {
    const [ready, setReady] = useState(false);
    const highlighterRef = useRef<any>(null);

    useEffect(() => {
        getHighlighter().then((hl) => {
            if (hl) {
                highlighterRef.current = hl;
                setReady(true);
            }
        });
    }, []);

    const highlight = useCallback((code: string, lang: string): string => {
        if (!highlighterRef.current) { return escapeHtml(code); }
        try {
            const loadedLangs = highlighterRef.current.getLoadedLanguages();
            const actualLang = loadedLangs.includes(lang) ? lang : 'plaintext';
            return highlighterRef.current.codeToHtml(code, {
                lang: actualLang,
                theme: 'css-variables',
            });
        } catch {
            return `<pre><code>${escapeHtml(code)}</code></pre>`;
        }
    }, [ready]);

    return { ready, highlight };
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
