import { h, render } from 'preact';
import { useKodoState } from './hooks/useKodoState';
import { vscode } from './lib/vscodeApi';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { TagFilterBar } from './components/TagFilterBar';
import { FolderTree } from './components/FolderTree';
import { PacksSection } from './components/PacksSection';
import { SnippetList } from './components/SnippetList';
import { SnippetEditor } from './components/SnippetEditor';
import { NewFolderModal } from './components/NewFolderModal';
import { PackBrowser } from './components/PackBrowser';

function App() {
    const state = useKodoState();

    return (
        <div class="min-h-screen">
            <Header
                onNewSnippet={() => state.setEditingSnippet({} as any)}
                onNewFolder={() => state.setShowNewFolderModal(true)}
            />

            <SearchBar
                query={state.searchQuery}
                onQueryChange={state.setSearchQuery}
            />

            {state.data.tags.length > 0 && (
                <TagFilterBar
                    tags={state.data.tags}
                    activeTagId={state.activeTagId}
                    onTagClick={state.setActiveTagId}
                />
            )}

            <div class="kodo-divider" />

            <FolderTree
                folders={state.data.folders}
                snippets={state.data.snippets}
                activeFolderId={state.activeFolderId}
                expandedFolders={state.expandedFolders}
                onFolderClick={state.setActiveFolderId}
                onToggleFolder={state.toggleFolder}
                onDeleteFolder={(id) => vscode.postMessage({ type: 'deleteFolder', folderId: id })}
            />

            <div class="kodo-divider" />

            <PacksSection
                packs={state.data.packs?.filter(p => p.installed) || []}
                onBrowsePacks={() => state.setShowPackBrowser(true)}
            />

            <div class="kodo-divider" />

            <SnippetList
                snippets={state.filteredSnippets}
                tags={state.data.tags}
                onEditSnippet={state.setEditingSnippet}
            />

            {state.editingSnippet !== null && (
                <SnippetEditor
                    snippet={state.editingSnippet.id ? state.editingSnippet : null}
                    data={state.data}
                    onClose={() => state.setEditingSnippet(null)}
                />
            )}

            {state.showNewFolderModal && (
                <NewFolderModal
                    data={state.data}
                    onClose={() => state.setShowNewFolderModal(false)}
                />
            )}

            {state.showPackBrowser && (
                <PackBrowser
                    packs={state.availablePacks}
                    installedPacks={state.data.packs || []}
                    folders={state.data.folders || []}
                    onClose={() => state.setShowPackBrowser(false)}
                />
            )}
        </div>
    );
}

render(<App />, document.getElementById('app')!);
