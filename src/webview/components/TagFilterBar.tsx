import { h } from 'preact';
import { Tag } from '../hooks/useKodoState';
import { vscode } from '../lib/vscodeApi';

interface TagFilterBarProps {
    tags: Tag[];
    activeTagId: string | null;
    onTagClick: (id: string | null) => void;
}

export function TagFilterBar({ tags, activeTagId, onTagClick }: TagFilterBarProps) {
    const handleDeleteTag = (e: MouseEvent, tagId: string) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'deleteTag', tagId });
        // If we're filtering by this tag, reset to All
        if (activeTagId === tagId) {
            onTagClick(null);
        }
    };

    return (
        <div class="px-4 pb-2 flex flex-wrap gap-1.5">
            <button
                class={`kodo-tag-pill ${!activeTagId ? 'active' : ''}`}
                style={{
                    background: 'color-mix(in srgb, var(--vscode-badge-background) 40%, transparent)',
                    color: 'var(--vscode-badge-foreground)',
                    opacity: !activeTagId ? 1 : 0.6,
                }}
                onClick={() => onTagClick(null)}
            >
                All
            </button>
            {tags.map(tag => (
                <button
                    key={tag.id}
                    class={`kodo-tag-pill ${activeTagId === tag.id ? 'active' : ''}`}
                    style={{
                        background: `color-mix(in srgb, ${tag.color} 30%, transparent)`,
                        color: '#fff',
                        opacity: activeTagId === tag.id ? 1 : 0.7,
                        position: 'relative',
                        paddingRight: '20px',
                    }}
                    onClick={() => onTagClick(activeTagId === tag.id ? null : tag.id)}
                >
                    {tag.name}
                    <span
                        class="kodo-tag-delete"
                        onClick={(e: any) => handleDeleteTag(e, tag.id)}
                        title={`Delete "${tag.name}" tag`}
                    >
                        ×
                    </span>
                </button>
            ))}
        </div>
    );
}
