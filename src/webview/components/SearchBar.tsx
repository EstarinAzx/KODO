import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import { SearchIcon } from '../lib/icons';

interface SearchBarProps {
    query: string;
    onQueryChange: (q: string) => void;
}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div class="px-4 pb-3">
            <div class="relative flex items-center">
                <span class="absolute left-2.5 pointer-events-none flex items-center" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    <SearchIcon />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    class="kodo-input pl-8"
                    placeholder="Search snippets…"
                    value={query}
                    onInput={(e) => onQueryChange((e.target as HTMLInputElement).value)}
                />
            </div>
        </div>
    );
}
