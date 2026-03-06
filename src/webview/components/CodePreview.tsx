import { h } from 'preact';
import { useShiki } from '../hooks/useShiki';

interface CodePreviewProps {
    code: string;
    language: string;
}

export function CodePreview({ code, language }: CodePreviewProps) {
    const { ready, highlight } = useShiki();

    if (!ready) {
        return (
            <div class="kodo-code-block">
                <pre><code style={{ opacity: 0.7 }}>{code}</code></pre>
            </div>
        );
    }

    const html = highlight(code, language);

    return (
        <div
            class="kodo-code-block"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
