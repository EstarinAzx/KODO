import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

let highlighterPromise: Promise<any> | null = null;

export function useShiki() {
    const [ready, setReady] = useState(false);
    const highlighterRef = useRef<any>(null);

    useEffect(() => {
        if (!highlighterPromise) {
            highlighterPromise = import('shiki').then(async (shiki) => {
                const hl = await shiki.createHighlighter({
                    themes: ['css-variables'],
                    langs: ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', 'bash', 'plaintext'],
                });
                return hl;
            }).catch(() => null);
        }

        highlighterPromise.then((hl) => {
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
