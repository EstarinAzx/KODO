import { h } from 'preact';
import { Snippet, Tag } from '../hooks/useKodoState';
import { SnippetCard } from './SnippetCard';
import { SnippetIcon, PlusIcon } from '../lib/icons';

interface SnippetListProps {
    snippets: Snippet[];
    tags: Tag[];
    onEditSnippet: (snippet: Snippet) => void;
}

export function SnippetList({ snippets, tags, onEditSnippet }: SnippetListProps) {
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
                    <SnippetCard
                        key={snippet.id}
                        snippet={snippet}
                        tags={tags}
                        onEdit={onEditSnippet}
                    />
                ))
            )}
        </div>
    );
}
