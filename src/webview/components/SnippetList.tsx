import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import { Snippet, Tag } from '../hooks/useKodoState';
import { SnippetCard } from './SnippetCard';
import { SnippetIcon } from '../lib/icons';
import { vscode } from '../lib/vscodeApi';

interface SnippetListProps {
    snippets: Snippet[];
    tags: Tag[];
    onEditSnippet: (snippet: Snippet) => void;
}

export function SnippetList({ snippets, tags, onEditSnippet }: SnippetListProps) {
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below'>('below');
    const dragSourceId = useRef<string | null>(null);

    const handleDragStartReorder = (snippetId: string) => {
        dragSourceId.current = snippetId;
    };

    const handleDragOver = (e: DragEvent, snippetId: string) => {
        // Only handle reorder drags (from within our list)
        if (!dragSourceId.current || dragSourceId.current === snippetId) return;

        e.preventDefault();
        e.stopPropagation();

        // Determine if dropping above or below the target card
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const position = e.clientY < midY ? 'above' : 'below';

        setDragOverId(snippetId);
        setDragOverPosition(position);
    };

    const handleDragLeave = (e: DragEvent) => {
        // Only clear if leaving the card entirely
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !(e.currentTarget as HTMLElement).contains(relatedTarget)) {
            setDragOverId(null);
        }
    };

    const handleDrop = (e: DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const sourceId = dragSourceId.current;
        if (!sourceId || sourceId === targetId) {
            cleanup();
            return;
        }

        // Send reorder message to extension host
        vscode.postMessage({
            type: 'reorderSnippets',
            sourceId,
            targetId,
            position: dragOverPosition,
        });

        cleanup();
    };

    const cleanup = () => {
        dragSourceId.current = null;
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        cleanup();
    };

    return (
        <div class="px-3">
            <div class="kodo-section-header">
                <span>Snippets ({snippets.length})</span>
            </div>
            {snippets.length === 0 ? (
                <div class="kodo-empty">
                    <div class="text-2xl mb-3" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                        <SnippetIcon size={32} />
                    </div>
                    <div class="text-sm mb-1">No snippets yet</div>
                    <div class="text-xs" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                        Right-click selected code → "Save to KODO"
                    </div>
                </div>
            ) : (
                snippets.map(snippet => (
                    <div
                        key={snippet.id}
                        onDragOver={(e: DragEvent) => handleDragOver(e, snippet.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e: DragEvent) => handleDrop(e, snippet.id)}
                        class="relative"
                    >
                        {/* Drop indicator line */}
                        {dragOverId === snippet.id && (
                            <div
                                class="kodo-drop-indicator"
                                style={{
                                    [dragOverPosition === 'above' ? 'top' : 'bottom']: '-2px',
                                }}
                            />
                        )}
                        <SnippetCard
                            snippet={snippet}
                            tags={tags}
                            onEdit={onEditSnippet}
                            onDragStartReorder={handleDragStartReorder}
                            onDragEndReorder={handleDragEnd}
                        />
                    </div>
                ))
            )}
        </div>
    );
}
