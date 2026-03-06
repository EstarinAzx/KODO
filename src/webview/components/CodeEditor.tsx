import { h } from 'preact';
import { useRef, useCallback } from 'preact/hooks';
import { useShiki } from '../hooks/useShiki';

interface CodeEditorProps {
    code: string;
    language: string;
    onCodeChange: (code: string) => void;
}

/**
 * Code editor with syntax highlighting overlay and IDE-like behavior:
 * - Auto-indent on Enter (matches previous line + extra after { [ ( )
 * - Tab inserts 2 spaces
 * - Shift+Tab dedents
 * - Auto-close brackets/quotes
 * - Backspace removes paired brackets
 */
export function CodeEditor({ code, language, onCodeChange }: CodeEditorProps) {
    const { highlight } = useShiki();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Helper: replace a range and set cursor
    const replaceRange = useCallback((
        textarea: HTMLTextAreaElement,
        start: number,
        end: number,
        replacement: string,
        cursorOffset?: number,
    ) => {
        const value = textarea.value;
        const newValue = value.substring(0, start) + replacement + value.substring(end);
        onCodeChange(newValue);
        const pos = start + (cursorOffset ?? replacement.length);
        requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = pos;
        });
    }, [onCodeChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const textarea = e.target as HTMLTextAreaElement;
        const { value, selectionStart: start, selectionEnd: end } = textarea;

        // ─── Tab / Shift+Tab ───
        if (e.key === 'Tab') {
            e.preventDefault();

            if (e.shiftKey) {
                // Dedent: remove up to 2 leading spaces from the current line
                const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                const lineText = value.substring(lineStart, end);
                if (lineText.startsWith('  ')) {
                    replaceRange(textarea, lineStart, lineStart + 2, '', -2 + (start - lineStart));
                }
            } else {
                // Indent: insert 2 spaces
                replaceRange(textarea, start, end, '  ');
            }
            return;
        }

        // ─── Enter: auto-indent ───
        if (e.key === 'Enter') {
            e.preventDefault();

            // Get the current line's indentation
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineText = value.substring(lineStart, start);
            const indent = lineText.match(/^(\s*)/)?.[1] || '';

            // Check the character before cursor
            const charBefore = value[start - 1];
            const charAfter = value[start];

            // If between brackets: { | } or [ | ] or ( | )
            const bracketPairs: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
            if (charBefore && bracketPairs[charBefore] && charAfter === bracketPairs[charBefore]) {
                // Insert newline + indent + extra indent, then another newline + original indent
                const insertion = '\n' + indent + '  \n' + indent;
                replaceRange(textarea, start, end, insertion, indent.length + 3); // cursor on the indented middle line
                return;
            }

            // If line ends with an opening bracket, add extra indent
            if (charBefore && '{[('.includes(charBefore)) {
                replaceRange(textarea, start, end, '\n' + indent + '  ');
                return;
            }

            // Normal: match current indent
            replaceRange(textarea, start, end, '\n' + indent);
            return;
        }

        // ─── Auto-close brackets and quotes ───
        const autoClose: Record<string, string> = {
            '{': '}',
            '[': ']',
            '(': ')',
            "'": "'",
            '"': '"',
            '`': '`',
        };

        if (autoClose[e.key] && start === end) {
            // For quotes, don't auto-close if the character before is a letter (likely mid-word)
            const isQuote = "'\"`".includes(e.key);
            if (isQuote) {
                const charBefore = value[start - 1];
                if (charBefore && /[a-zA-Z0-9_$]/.test(charBefore)) return; // let it type naturally
                // If the next char is the same quote, just skip over it
                if (value[start] === e.key) {
                    e.preventDefault();
                    requestAnimationFrame(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + 1;
                    });
                    return;
                }
            }

            // If next char is the closing bracket and we're typing the same, skip
            if (!isQuote && value[start] === autoClose[e.key]) {
                // Don't auto-close, let user type the closing bracket to skip
            } else {
                e.preventDefault();
                replaceRange(textarea, start, end, e.key + autoClose[e.key], 1);
                return;
            }
        }

        // ─── Skip over closing brackets/quotes ───
        if ('}])'.includes(e.key) && value[start] === e.key && start === end) {
            e.preventDefault();
            requestAnimationFrame(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            });
            return;
        }

        // ─── Backspace: remove paired brackets ───
        if (e.key === 'Backspace' && start === end && start > 0) {
            const charBefore = value[start - 1];
            const charAfter = value[start];
            const pairs: Record<string, string> = { '{': '}', '[': ']', '(': ')', "'": "'", '"': '"', '`': '`' };
            if (pairs[charBefore] === charAfter) {
                e.preventDefault();
                replaceRange(textarea, start - 1, start + 1, '', -1);
                return;
            }
        }
    }, [onCodeChange, replaceRange]);

    // Sync scroll between textarea, highlight layer, and gutter
    const handleScroll = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const editorBody = textarea.parentElement;
        const highlightEl = editorBody?.querySelector('.kodo-code-highlight') as HTMLElement;
        const gutterEl = textarea.closest('.kodo-code-editor')?.querySelector('.kodo-code-gutter') as HTMLElement;
        if (highlightEl) {
            highlightEl.scrollTop = textarea.scrollTop;
            highlightEl.scrollLeft = textarea.scrollLeft;
        }
        if (gutterEl) {
            gutterEl.scrollTop = textarea.scrollTop;
        }
    }, []);

    const handleInput = useCallback((e: Event) => {
        const textarea = e.target as HTMLTextAreaElement;
        onCodeChange(textarea.value);
    }, [onCodeChange]);

    const highlightedHtml = highlight(code, language);

    // Line numbers and auto-sizing
    const lineCount = (code || '').split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    // Calculate height: each line is line-height * font-size, plus padding
    // Use at least 6 lines min, cap so it scrolls for large files
    const visibleLines = Math.max(6, lineCount + 2); // +2 for breathing room below last line
    // line-height is 1.5, font-size ~13px = ~19.5px per line, + 16px padding
    const contentHeight = visibleLines * 19.5 + 16;
    const editorHeight = Math.min(contentHeight, 400); // max 400px, then scroll
    const needsScroll = contentHeight > 400;

    return (
        <div class="kodo-code-editor" style={{ height: `${editorHeight}px` }}>
            {/* Line numbers gutter */}
            <div class="kodo-code-gutter" style={{ height: needsScroll ? undefined : `${editorHeight}px` }}>
                {lineNumbers.map(n => (
                    <div key={n} class="kodo-line-number">{n}</div>
                ))}
            </div>

            {/* Editor area */}
            <div class="kodo-code-editor-body">
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
                    style={{ height: `${editorHeight}px` }}
                />
            </div>
        </div>
    );
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
