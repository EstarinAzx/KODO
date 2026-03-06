import { useCallback } from 'preact/hooks';

/**
 * Lightweight regex-based syntax highlighter.
 * No dynamic imports, no WASM, no chunks — works reliably in VS Code webviews.
 * Produces HTML with spans using CSS variables for colors.
 */

// Token types mapped to CSS variable colors
const TOKEN_STYLES: Record<string, string> = {
    keyword: 'var(--shiki-token-keyword)',
    string: 'var(--shiki-token-string)',
    comment: 'var(--shiki-token-comment)',
    number: 'var(--shiki-token-constant)',
    function: 'var(--shiki-token-function)',
    type: 'var(--shiki-token-constant)',
    parameter: 'var(--shiki-token-parameter)',
    punctuation: 'var(--shiki-token-punctuation)',
    operator: 'var(--shiki-token-keyword)',
    decorator: 'var(--shiki-token-function)',
    property: 'var(--shiki-token-parameter)',
    builtin: 'var(--shiki-token-constant)',
};

// Language-aware keyword sets
const JS_TS_KEYWORDS = new Set([
    'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
    'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export',
    'extends', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import',
    'in', 'instanceof', 'interface', 'let', 'module', 'namespace', 'new', 'of',
    'package', 'private', 'protected', 'public', 'readonly', 'return', 'static',
    'super', 'switch', 'this', 'throw', 'try', 'type', 'typeof', 'var', 'void',
    'while', 'with', 'yield',
]);

const JS_TS_BUILTINS = new Set([
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
    'console', 'document', 'window', 'global', 'process',
    'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set',
    'Promise', 'Error', 'RegExp', 'Date', 'Math', 'JSON',
    'parseInt', 'parseFloat', 'setTimeout', 'setInterval',
    'require', 'module', 'exports',
]);

const JS_TS_TYPES = new Set([
    'string', 'number', 'boolean', 'void', 'any', 'never', 'unknown',
    'object', 'symbol', 'bigint', 'null', 'undefined',
    'HTMLElement', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement',
    'HTMLSelectElement', 'HTMLDivElement', 'HTMLSpanElement',
    'MouseEvent', 'KeyboardEvent', 'Event', 'DragEvent', 'MessageEvent',
    'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit',
]);

const PYTHON_KEYWORDS = new Set([
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
    'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
    'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]);

const PYTHON_BUILTINS = new Set([
    'True', 'False', 'None', 'self', 'cls',
    'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter',
    'int', 'str', 'float', 'list', 'dict', 'tuple', 'set', 'bool',
    'type', 'isinstance', 'issubclass', 'super', 'property',
    'staticmethod', 'classmethod', 'input', 'open',
]);

function getKeywordsForLang(lang: string): Set<string> {
    const l = lang.toLowerCase();
    if (['python', 'py'].includes(l)) return PYTHON_KEYWORDS;
    return JS_TS_KEYWORDS;
}

function getBuiltinsForLang(lang: string): Set<string> {
    const l = lang.toLowerCase();
    if (['python', 'py'].includes(l)) return PYTHON_BUILTINS;
    return JS_TS_BUILTINS;
}

function getTypesForLang(lang: string): Set<string> {
    const l = lang.toLowerCase();
    if (['typescript', 'ts', 'tsx', 'jsx'].includes(l)) return JS_TS_TYPES;
    return new Set();
}

interface Token {
    type: string;
    value: string;
}

function tokenize(code: string, lang: string): Token[] {
    const keywords = getKeywordsForLang(lang);
    const builtins = getBuiltinsForLang(lang);
    const types = getTypesForLang(lang);
    const tokens: Token[] = [];
    let i = 0;

    while (i < code.length) {
        // Multi-line comment
        if (code[i] === '/' && code[i + 1] === '*') {
            const end = code.indexOf('*/', i + 2);
            const commentEnd = end === -1 ? code.length : end + 2;
            tokens.push({ type: 'comment', value: code.slice(i, commentEnd) });
            i = commentEnd;
            continue;
        }

        // Single-line comment (// or #)
        if ((code[i] === '/' && code[i + 1] === '/') ||
            (code[i] === '#' && ['python', 'py', 'bash', 'sh', 'ruby', 'yaml'].includes(lang.toLowerCase()))) {
            const end = code.indexOf('\n', i);
            const commentEnd = end === -1 ? code.length : end;
            tokens.push({ type: 'comment', value: code.slice(i, commentEnd) });
            i = commentEnd;
            continue;
        }

        // Template literal
        if (code[i] === '`') {
            let j = i + 1;
            while (j < code.length && code[j] !== '`') {
                if (code[j] === '\\') j++; // skip escaped chars
                j++;
            }
            tokens.push({ type: 'string', value: code.slice(i, j + 1) });
            i = j + 1;
            continue;
        }

        // Strings (single or double quotes)
        if (code[i] === '"' || code[i] === "'") {
            const quote = code[i];
            let j = i + 1;
            while (j < code.length && code[j] !== quote && code[j] !== '\n') {
                if (code[j] === '\\') j++; // skip escaped chars
                j++;
            }
            tokens.push({ type: 'string', value: code.slice(i, j + 1) });
            i = j + 1;
            continue;
        }

        // Numbers
        if (/[0-9]/.test(code[i]) && (i === 0 || !/[a-zA-Z_$]/.test(code[i - 1]))) {
            let j = i;
            // hex
            if (code[j] === '0' && (code[j + 1] === 'x' || code[j + 1] === 'X')) {
                j += 2;
                while (j < code.length && /[0-9a-fA-F_]/.test(code[j])) j++;
            } else {
                while (j < code.length && /[0-9._eE]/.test(code[j])) j++;
            }
            tokens.push({ type: 'number', value: code.slice(i, j) });
            i = j;
            continue;
        }

        // Decorators (@)
        if (code[i] === '@' && /[a-zA-Z_]/.test(code[i + 1] || '')) {
            let j = i + 1;
            while (j < code.length && /[a-zA-Z0-9_.]/.test(code[j])) j++;
            tokens.push({ type: 'decorator', value: code.slice(i, j) });
            i = j;
            continue;
        }

        // Words (identifiers, keywords, types)
        if (/[a-zA-Z_$]/.test(code[i])) {
            let j = i;
            while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
            const word = code.slice(i, j);

            // Check if followed by ( => function call
            let afterWord = j;
            while (afterWord < code.length && code[afterWord] === ' ') afterWord++;
            const isCall = code[afterWord] === '(';

            if (keywords.has(word)) {
                tokens.push({ type: 'keyword', value: word });
            } else if (types.has(word)) {
                tokens.push({ type: 'type', value: word });
            } else if (builtins.has(word)) {
                tokens.push({ type: 'builtin', value: word });
            } else if (isCall) {
                tokens.push({ type: 'function', value: word });
            } else if (code[i - 1] === '.') {
                tokens.push({ type: 'property', value: word });
            } else {
                tokens.push({ type: 'plain', value: word });
            }
            i = j;
            continue;
        }

        // Operators
        if (/[+\-*/%=<>!&|^~?]/.test(code[i])) {
            let j = i;
            while (j < code.length && /[+\-*/%=<>!&|^~?]/.test(code[j])) j++;
            tokens.push({ type: 'operator', value: code.slice(i, j) });
            i = j;
            continue;
        }

        // Punctuation
        if (/[{}()\[\];:,.]/.test(code[i])) {
            tokens.push({ type: 'punctuation', value: code[i] });
            i++;
            continue;
        }

        // Whitespace / other
        tokens.push({ type: 'plain', value: code[i] });
        i++;
    }

    return tokens;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function tokensToHtml(tokens: Token[]): string {
    let html = '';
    for (const token of tokens) {
        const escaped = escapeHtml(token.value);
        const color = TOKEN_STYLES[token.type];
        if (color) {
            html += `<span style="color:${color}">${escaped}</span>`;
        } else {
            html += escaped;
        }
    }
    return html;
}

export function useShiki() {
    const highlight = useCallback((code: string, lang: string): string => {
        if (!code) return '';
        const tokens = tokenize(code, lang);
        return tokensToHtml(tokens);
    }, []);

    return { ready: true, highlight };
}
