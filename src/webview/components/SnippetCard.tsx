import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Snippet, Tag } from '../hooks/useKodoState';
import { vscode } from '../lib/vscodeApi';
import { GripDotsIcon, CursorIcon, EditIcon, TrashIcon, TagIcon } from '../lib/icons';
import { CodePreview } from './CodePreview';

interface SnippetCardProps {
    snippet: Snippet;
    tags: Tag[];
    onEdit: (snippet: Snippet) => void;
}

export function SnippetCard({ snippet, tags, onEdit }: SnippetCardProps) {
    const [dragging, setDragging] = useState(false);

    const handleDragStart = (e: DragEvent) => {
        setDragging(true);
        e.dataTransfer?.setData('text/plain', snippet.code);
        e.dataTransfer?.setData('application/kodo-snippet-id', snippet.id);
    };

    const handleDragEnd = () => setDragging(false);

    const handleInsert = (e: MouseEvent) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'insertSnippet', snippetId: snippet.id, asPlainText: false });
    };

    const handleDelete = (e: MouseEvent) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'deleteSnippet', snippetId: snippet.id });
    };

    const snippetTags = snippet.tags
        .map(id => tags.find(t => t.id === id))
        .filter(Boolean) as Tag[];

    return (
        <div
            class={`kodo-card ${dragging ? 'dragging' : ''}`}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {/* Header: drag handle + name + language badge */}
            <div class="flex items-center gap-2 mb-1">
                <span class="kodo-drag-handle flex-shrink-0">
                    <GripDotsIcon size={10} />
                </span>
                <div class="font-medium text-sm truncate flex-1">{snippet.name}</div>
                <span class="kodo-badge">{snippet.language}</span>
            </div>

            {/* Description */}
            {snippet.description && (
                <div class="text-xs mb-2 truncate" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    {snippet.description}
                </div>
            )}

            {/* Tags */}
            {snippetTags.length > 0 && (
                <div class="flex flex-wrap gap-1 mb-2">
                    {snippetTags.map(tag => (
                        <span
                            key={tag.id}
                            class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0"
                            style={{
                                background: `color-mix(in srgb, ${tag.color} 30%, transparent)`,
                                color: '#fff',
                                fontSize: '10px',
                            }}
                        >
                            <TagIcon size={8} /> {tag.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Code preview */}
            <CodePreview code={snippet.code} language={snippet.language} />

            {/* Action row */}
            <div
                class="flex items-center gap-2 mt-3 pt-3"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--vscode-panel-border, #666) 8%, transparent)' }}
            >
                <button class="kodo-btn text-xs" onClick={handleInsert}>
                    <CursorIcon size={12} /> Insert
                </button>
                <div class="flex-1" />
                <button class="kodo-btn-ghost" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(snippet); }}>
                    <EditIcon size={12} />
                </button>
                <button class="kodo-btn-ghost" title="Delete" onClick={handleDelete}>
                    <TrashIcon size={12} />
                </button>
            </div>
        </div>
    );
}
