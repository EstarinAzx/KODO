import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Snippet, Tag, Folder } from '../hooks/useKodoState';
import { vscode } from '../lib/vscodeApi';
import { GripDotsIcon, CursorIcon, EditIcon, TrashIcon, TagIcon, CopyIcon, FolderMoveIcon } from '../lib/icons';
import { CodePreview } from './CodePreview';

interface SnippetCardProps {
    snippet: Snippet;
    tags: Tag[];
    folders: Folder[];
    onEdit: (snippet: Snippet) => void;
    onDragStartReorder?: (snippetId: string) => void;
    onDragEndReorder?: () => void;
}

export function SnippetCard({ snippet, tags, folders, onEdit, onDragStartReorder, onDragEndReorder }: SnippetCardProps) {
    const [dragging, setDragging] = useState(false);
    const [showMoveMenu, setShowMoveMenu] = useState(false);

    const handleDragStart = (e: DragEvent) => {
        setDragging(true);
        e.dataTransfer?.setData('text/plain', snippet.code);
        e.dataTransfer?.setData('application/kodo-snippet-id', snippet.id);
        onDragStartReorder?.(snippet.id);
    };

    const handleDragEnd = () => {
        setDragging(false);
        onDragEndReorder?.();
    };

    const handleInsert = (e: MouseEvent) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'insertSnippet', snippetId: snippet.id, asPlainText: false });
    };

    const handleDelete = (e: MouseEvent) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'deleteSnippet', snippetId: snippet.id });
    };

    const handleDuplicate = (e: MouseEvent) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'duplicateSnippet', snippetId: snippet.id });
    };

    const handleMove = (e: MouseEvent, targetFolderId: string) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'moveSnippet', snippetId: snippet.id, targetFolderId });
        setShowMoveMenu(false);
    };

    const snippetTags = snippet.tags
        .map(id => tags.find(t => t.id === id))
        .filter(Boolean) as Tag[];

    // Only show folders that are different from current
    const otherFolders = folders.filter(f => f.id !== snippet.folderId);

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
                <button class="kodo-btn-ghost" title="Duplicate" onClick={handleDuplicate}>
                    <CopyIcon size={12} />
                </button>
                {otherFolders.length > 0 && (
                    <div style={{ position: 'relative' }}>
                        <button
                            class="kodo-btn-ghost"
                            title="Move to folder"
                            onClick={(e: any) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
                        >
                            <FolderMoveIcon size={12} />
                        </button>
                        {showMoveMenu && (
                            <div
                                class="kodo-dropdown"
                                style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    right: 0,
                                    marginBottom: '4px',
                                    minWidth: '140px',
                                    zIndex: 50,
                                    background: 'var(--vscode-dropdown-background, #3c3c3c)',
                                    border: '1px solid var(--vscode-dropdown-border, #555)',
                                    borderRadius: '6px',
                                    padding: '4px 0',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                }}
                            >
                                <div
                                    class="text-xs px-3 py-1"
                                    style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.7 }}
                                >
                                    Move to...
                                </div>
                                {otherFolders.map(f => (
                                    <button
                                        key={f.id}
                                        class="kodo-dropdown-item"
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '5px 12px',
                                            fontSize: '12px',
                                            background: 'transparent',
                                            color: 'var(--vscode-dropdown-foreground, #ccc)',
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                        onClick={(e: any) => handleMove(e, f.id)}
                                        onMouseEnter={(e: any) => { e.currentTarget.style.background = 'var(--vscode-list-hoverBackground, #2a2d2e)'; }}
                                        onMouseLeave={(e: any) => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <button class="kodo-btn-ghost" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(snippet); }}>
                    <EditIcon size={12} />
                </button>
                <button class="kodo-btn-ghost" title="Delete" onClick={handleDelete}>
                    <TrashIcon size={12} />
                </button>
            </div>

            {/* Click-away to close move menu */}
            {showMoveMenu && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={(e: any) => { e.stopPropagation(); setShowMoveMenu(false); }}
                />
            )}
        </div>
    );
}
