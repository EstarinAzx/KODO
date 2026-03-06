import { h } from 'preact';
import { Tag } from '../hooks/useKodoState';

interface TagFilterBarProps {
    tags: Tag[];
    activeTagId: string | null;
    onTagClick: (id: string | null) => void;
}

export function TagFilterBar({ tags, activeTagId, onTagClick }: TagFilterBarProps) {
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
                    }}
                    onClick={() => onTagClick(activeTagId === tag.id ? null : tag.id)}
                >
                    {tag.name}
                </button>
            ))}
        </div>
    );
}
