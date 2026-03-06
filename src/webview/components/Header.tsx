import { h } from 'preact';
import { SnippetIcon, PlusIcon, FolderIcon } from '../lib/icons';

interface HeaderProps {
    onNewSnippet: () => void;
    onNewFolder: () => void;
}

export function Header({ onNewSnippet, onNewFolder }: HeaderProps) {
    return (
        <div class="flex items-center justify-between px-4 py-3">
            <div class="flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--vscode-editor-foreground)' }}>
                <SnippetIcon />
                KODO
            </div>
            <div class="flex items-center gap-1">
                <button class="kodo-btn-ghost" title="New snippet" onClick={onNewSnippet}>
                    <PlusIcon />
                </button>
                <button class="kodo-btn-ghost" title="New folder" onClick={onNewFolder}>
                    <FolderIcon />
                </button>
            </div>
        </div>
    );
}
