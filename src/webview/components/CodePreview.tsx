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

    // Wrap in <pre> for the preview cards so newlines are preserved
    const html = `<pre style="margin:0;padding:0;background:transparent;white-space:pre;"><code>${highlight(code, language)}</code></pre>`;

    return (
        <div
            class="kodo-code-block"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
