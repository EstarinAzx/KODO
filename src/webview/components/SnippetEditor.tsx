import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Snippet, Folder, Tag, KodoData } from '../hooks/useKodoState';
import { vscode } from '../lib/vscodeApi';
import { CodeEditor } from './CodeEditor';

interface SnippetEditorProps {
    snippet: Snippet | null; // null = new snippet
    data: KodoData;
    onClose: () => void;
}

export function SnippetEditor({ snippet, data, onClose }: SnippetEditorProps) {
    const [name, setName] = useState(snippet?.name ?? '');
    const [language, setLanguage] = useState(snippet?.language ?? 'plaintext');
    const [description, setDescription] = useState(snippet?.description ?? '');
    const [folderId, setFolderId] = useState(snippet?.folderId ?? 'default');
    const [tagsStr, setTagsStr] = useState(
        snippet
            ? snippet.tags.map(id => data.tags.find(t => t.id === id)?.name ?? '').filter(Boolean).join(', ')
            : ''
    );
    const [code, setCode] = useState(snippet?.code ?? '');
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const handleSave = () => {
        if (!name.trim() || !code) return;

        const tagNames = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
        const tagIds: string[] = [];
        for (const tName of tagNames) {
            const existing = data.tags.find(t => t.name.toLowerCase() === tName.toLowerCase());
            if (existing) {
                tagIds.push(existing.id);
            } else {
                // Generate ID client-side so we can reference it in the snippet
                const newTagId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
                tagIds.push(newTagId);
                vscode.postMessage({
                    type: 'createTag',
                    tag: { id: newTagId, name: tName, color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)` },
                });
            }
        }

        if (snippet) {
            vscode.postMessage({
                type: 'updateSnippet',
                snippet: {
                    ...snippet,
                    name: name.trim(),
                    code,
                    language: language.trim() || 'plaintext',
                    description: description.trim(),
                    folderId,
                    tags: tagIds,
                },
            });
        } else {
            vscode.postMessage({
                type: 'saveSnippet',
                snippet: {
                    name: name.trim(),
                    code,
                    language: language.trim() || 'plaintext',
                    description: description.trim(),
                    folderId,
                    tags: tagIds,
                },
            });
        }
        onClose();
    };

    return (
        <div class="kodo-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div class="kodo-modal">
                <h3 class="text-sm font-bold mb-4">{snippet ? 'Edit Snippet' : 'New Snippet'}</h3>

                <Field label="Name" value={name} onChange={setName} ref={nameRef} />
                <Field label="Language" value={language} onChange={setLanguage} />
                <Field label="Description" value={description} onChange={setDescription} />

                {/* Folder select */}
                <div class="mb-4">
                    <label class="block text-xs mb-1.5" style={{ color: 'var(--vscode-descriptionForeground)' }}>Folder</label>
                    <select
                        class="kodo-input"
                        value={folderId}
                        onChange={(e) => setFolderId((e.target as HTMLSelectElement).value)}
                    >
                        {data.folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>

                <Field label="Tags (comma-separated)" value={tagsStr} onChange={setTagsStr} />

                {/* Code editor with syntax highlighting */}
                <div class="mb-4">
                    <label class="block text-xs mb-1.5" style={{ color: 'var(--vscode-descriptionForeground)' }}>Code</label>
                    <CodeEditor
                        code={code}
                        language={language}
                        onCodeChange={setCode}
                    />
                </div>

                {/* Template hint */}
                <div
                    class="text-xs mb-4 px-3 py-2 rounded-xl"
                    style={{
                        background: 'color-mix(in srgb, var(--vscode-editor-background) 80%, var(--vscode-focusBorder))',
                        color: 'var(--vscode-descriptionForeground)',
                    }}
                >
                    💡 <strong>Template variables:</strong> Use <code>{'${1:placeholder}'}</code> for tab stops.
                </div>

                {/* Buttons */}
                <div class="flex gap-3 justify-end">
                    <button class="kodo-btn-secondary" onClick={onClose}>Cancel</button>
                    <button class="kodo-btn" onMouseDown={() => { (document.activeElement as HTMLElement)?.blur(); }} onClick={handleSave}>{snippet ? 'Update' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
}

// Reusable field
interface FieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    ref?: any;
}

function Field({ label, value, onChange, ref }: FieldProps) {
    const handleChange = (e: Event) => {
        onChange((e.target as HTMLInputElement).value);
    };

    return (
        <div class="mb-4">
            <label class="block text-xs mb-1.5" style={{ color: 'var(--vscode-descriptionForeground)' }}>{label}</label>
            <input
                ref={ref}
                type="text"
                class="kodo-input"
                value={value}
                onInput={handleChange}
                onChange={handleChange}
            />
        </div>
    );
}
