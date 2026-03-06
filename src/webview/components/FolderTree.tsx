import { h } from 'preact';
import { Folder, Snippet } from '../hooks/useKodoState';
import { FolderItem } from './FolderItem';

interface FolderTreeProps {
    folders: Folder[];
    snippets: Snippet[];
    activeFolderId: string | null;
    expandedFolders: Set<string>;
    onFolderClick: (id: string | null) => void;
    onToggleFolder: (id: string) => void;
    onDeleteFolder: (id: string) => void;
}

export function FolderTree({
    folders, snippets, activeFolderId, expandedFolders,
    onFolderClick, onToggleFolder, onDeleteFolder,
}: FolderTreeProps) {
    const rootFolders = folders
        .filter(f => f.parentId === null)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div class="mb-1">
            <div class="kodo-section-header">
                <span>Folders</span>
            </div>
            {rootFolders.map(folder => (
                <FolderItem
                    key={folder.id}
                    folder={folder}
                    folders={folders}
                    snippets={snippets}
                    depth={0}
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
