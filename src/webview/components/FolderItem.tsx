import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Folder, Snippet } from '../hooks/useKodoState';
import { FolderIcon, FolderOpenIcon, ChevronRightIcon, ChevronDownIcon, TrashIcon } from '../lib/icons';

interface FolderItemProps {
    folder: Folder;
    folders: Folder[];
    snippets: Snippet[];
    depth: number;
    activeFolderId: string | null;
    expandedFolders: Set<string>;
    onFolderClick: (id: string | null) => void;
    onToggleFolder: (id: string) => void;
    onDeleteFolder: (id: string) => void;
}

export function FolderItem({
    folder, folders, snippets, depth,
    activeFolderId, expandedFolders,
    onFolderClick, onToggleFolder, onDeleteFolder,
}: FolderItemProps) {
    const [hovered, setHovered] = useState(false);
    const isExpanded = expandedFolders.has(folder.id);
    const childFolders = folders
        .filter(f => f.parentId === folder.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    const hasChildren = childFolders.length > 0;
    const snippetCount = snippets.filter(s => s.folderId === folder.id).length;
    const isActive = activeFolderId === folder.id;

    return (
        <div>
            <div
                class={`kodo-folder ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => {
                    onFolderClick(isActive ? null : folder.id);
                    if (!isExpanded) { onToggleFolder(folder.id); }
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <span
                    class="flex-shrink-0"
                    style={{ width: '12px', cursor: hasChildren ? 'pointer' : 'default' }}
                    onClick={(e) => {
                        if (hasChildren) {
                            e.stopPropagation();
                            onToggleFolder(folder.id);
                        }
                    }}
                >
                    {hasChildren && (isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />)}
                </span>
                <span class="flex-shrink-0">
                    {isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
                </span>
                <span class="truncate flex-1 text-sm">{folder.name}</span>
                <span class="text-xs flex-shrink-0" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    {snippetCount}
                </span>
                {folder.id !== 'default' && hovered && (
                    <button
                        class="kodo-btn-ghost"
                        title="Delete folder"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFolder(folder.id);
                        }}
                    >
                        <TrashIcon size={12} />
                    </button>
                )}
            </div>
            {isExpanded && childFolders.map(child => (
                <FolderItem
                    key={child.id}
                    folder={child}
                    folders={folders}
                    snippets={snippets}
                    depth={depth + 1}
                    activeFolderId={activeFolderId}
                    expandedFolders={expandedFolders}
                    onFolderClick={onFolderClick}
                    onToggleFolder={onToggleFolder}
                    onDeleteFolder={onDeleteFolder}
                />
            ))}
        </div>
    );
}
