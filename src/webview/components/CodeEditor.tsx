import { h } from 'preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShiki } from '../hooks/useShiki';

interface CodeEditorProps {
    code: string;
    language: string;
    onCodeChange: (code: string) => void;
}

/**
 * Code editor with syntax highlighting overlay.
 * The textarea is transparent text on top of a highlighted <pre> layer,
 * so you see syntax colors while typing.
 */
export function CodeEditor({ code, language, onCodeChange }: CodeEditorProps) {
    const { ready, highlight } = useShiki();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleInput = useCallback((e: Event) => {
        const textarea = e.target as HTMLTextAreaElement;
        onCodeChange(textarea.value);
    }, [onCodeChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Tab key inserts spaces instead of switching focus
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target as HTMLTextAreaElement;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            onCodeChange(newValue);
            // Restore cursor position after Preact re-render
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 2;
            });
        }
    }, [onCodeChange]);

    // Sync scroll between textarea and highlight layer
    const handleScroll = useCallback(() => {
        const textarea = textareaRef.current;
        const highlight = textarea?.parentElement?.querySelector('.kodo-code-highlight') as HTMLElement;
        if (textarea && highlight) {
            highlight.scrollTop = textarea.scrollTop;
            highlight.scrollLeft = textarea.scrollLeft;
        }
    }, []);

    const highlightedHtml = ready ? highlight(code, language) : null;

    return (
        <div class="kodo-code-editor">
            {/* Highlighted layer (behind) */}
            <div
                class="kodo-code-highlight"
                dangerouslySetInnerHTML={{
                    __html: highlightedHtml || `<pre><code>${escapeHtml(code || ' ')}</code></pre>`
                }}
            />
            {/* Editable textarea (on top, transparent text) */}
            <textarea
                ref={textareaRef}
                class="kodo-code-textarea"
                value={code}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                spellcheck={false}
                autocomplete="off"
                autocapitalize="off"
            />
        </div>
    );
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
