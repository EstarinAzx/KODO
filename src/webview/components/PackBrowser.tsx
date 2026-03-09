import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { TemplatePack, PackManifest } from '../hooks/useKodoState';
import { useRegistry, RegistryPack } from '../hooks/useRegistry';
import { PackCard } from './PackCard';
import { RegistryPackCard } from './RegistryPackCard';
import { AuthButton } from './AuthButton';
import { PublishPackModal } from './PublishPackModal';
import { vscode } from '../lib/vscodeApi';
import { DownloadIcon } from '../lib/icons';

interface PackBrowserProps {
    packs: PackManifest[];
    installedPacks: TemplatePack[];
    folders: any[];
    onClose: () => void;
}

type Tab = 'builtin' | 'community';

const LANGUAGE_OPTIONS = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'PHP'];

export function PackBrowser({ packs, installedPacks, onClose, folders }: PackBrowserProps) {
    const [activeTab, setActiveTab] = useState<Tab>('builtin');
    const [builtinSearch, setBuiltinSearch] = useState('');
    const [showPublishModal, setShowPublishModal] = useState(false);
    const registry = useRegistry();

    // Fetch packs when community tab is opened
    useEffect(() => {
        if (activeTab === 'community') {
            registry.fetchPacks();
        }
    }, [activeTab]);

    // Re-fetch when sort/filter changes
    useEffect(() => {
        if (activeTab === 'community') {
            registry.fetchPacks();
        }
    }, [registry.sortBy, registry.languageFilter]);

    // Merge available packs with install status for builtin tab
    const builtinList: TemplatePack[] = packs.map(manifest => {
        const installed = installedPacks.find(p => p.id === manifest.id);
        return {
            id: manifest.id,
            name: manifest.name,
            description: manifest.description,
            author: manifest.author,
            version: manifest.version,
            language: manifest.language,
            icon: manifest.icon,
            snippetCount: manifest.snippets.length,
            installed: installed?.installed ?? false,
            builtin: true,
            installedAt: installed?.installedAt ?? 0,
        };
    });

    const filteredBuiltin = builtinSearch.trim()
        ? builtinList.filter(p =>
            p.name.toLowerCase().includes(builtinSearch.toLowerCase()) ||
            p.language.toLowerCase().includes(builtinSearch.toLowerCase())
        )
        : builtinList;

    const handleBuiltinInstall = (packId: string) => {
        vscode.postMessage({ type: 'installPack', packId });
    };

    const handleBuiltinUninstall = (packId: string) => {
        vscode.postMessage({ type: 'uninstallPack', packId });
    };

    const handleImportPack = () => {
        vscode.postMessage({ type: 'importPack' });
    };

    return (
        <div class="kodo-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div class="kodo-modal" style={{ maxWidth: '520px' }}>
                {/* Header */}
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-bold">📦 Template Packs</h3>
                    {activeTab === 'community' && (
                        <AuthButton
                            user={registry.currentUser}
                            onSignIn={registry.signIn}
                            onSignOut={registry.signOut}
                        />
                    )}
                </div>

                {/* Tabs */}
                <div class="flex gap-0 mb-4" style={{ borderBottom: '1px solid var(--vscode-widget-border, rgba(255,255,255,0.08))' }}>
                    <button
                        class={`kodo-tab ${activeTab === 'builtin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('builtin')}
                    >
                        Built-in
                    </button>
                    <button
                        class={`kodo-tab ${activeTab === 'community' ? 'active' : ''}`}
                        onClick={() => setActiveTab('community')}
                    >
                        🌐 Community
                    </button>
                </div>

                {/* ─── Built-in Tab ─── */}
                {activeTab === 'builtin' && (
                    <div>
                        <div class="mb-4">
                            <input
                                type="text"
                                class="kodo-input"
                                placeholder="Search built-in packs..."
                                value={builtinSearch}
                                onInput={(e) => setBuiltinSearch((e.target as HTMLInputElement).value)}
                            />
                        </div>

                        <div class="flex flex-col gap-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {filteredBuiltin.length === 0 ? (
                                <div class="text-xs text-center py-6" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                                    No packs found
                                </div>
                            ) : (
                                filteredBuiltin.map(pack => (
                                    <PackCard
                                        key={pack.id}
                                        pack={pack}
                                        expanded={true}
                                        onInstall={() => handleBuiltinInstall(pack.id)}
                                        onUninstall={() => handleBuiltinUninstall(pack.id)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div class="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))' }}>
                            <button
                                class="kodo-btn-secondary flex items-center gap-1.5"
                                onClick={handleImportPack}
                                style={{ fontSize: '11px' }}
                            >
                                <DownloadIcon size={12} /> Import from file
                            </button>
                            <button class="kodo-btn-secondary" onClick={onClose}>Close</button>
                        </div>
                    </div>
                )}

                {/* ─── Community Tab ─── */}
                {activeTab === 'community' && (
                    <div>
                        {/* Search */}
                        <div class="mb-3">
                            <input
                                type="text"
                                class="kodo-input"
                                placeholder="Search community packs..."
                                value={registry.searchQuery}
                                onInput={(e) => registry.setSearchQuery((e.target as HTMLInputElement).value)}
                            />
                        </div>

                        {/* Sort + Filter row */}
                        <div class="flex items-center gap-2 mb-3 flex-wrap">
                            <select
                                class="kodo-input"
                                style={{ width: 'auto', fontSize: '11px', padding: '4px 8px', borderRadius: '999px' }}
                                value={registry.sortBy}
                                onChange={(e) => registry.setSortBy((e.target as HTMLSelectElement).value as any)}
                            >
                                <option value="downloads">Most Downloaded</option>
                                <option value="rating">Highest Rated</option>
                                <option value="newest">Newest</option>
                            </select>

                            <div class="flex gap-1 flex-wrap">
                                <button
                                    class={`kodo-tag-pill ${!registry.languageFilter ? 'active' : ''}`}
                                    onClick={() => registry.setLanguageFilter(null)}
                                    style={{ fontSize: '10px', background: !registry.languageFilter ? 'var(--vscode-list-hoverBackground)' : 'transparent' }}
                                >
                                    All
                                </button>
                                {LANGUAGE_OPTIONS.map(lang => (
                                    <button
                                        key={lang}
                                        class={`kodo-tag-pill ${registry.languageFilter === lang.toLowerCase() ? 'active' : ''}`}
                                        onClick={() => registry.setLanguageFilter(
                                            registry.languageFilter === lang.toLowerCase() ? null : lang.toLowerCase()
                                        )}
                                        style={{
                                            fontSize: '10px',
                                            background: registry.languageFilter === lang.toLowerCase() ? 'var(--vscode-list-hoverBackground)' : 'transparent',
                                        }}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pack list */}
                        <div class="flex flex-col gap-3" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {registry.isLoading && registry.packs.length === 0 ? (
                                // Skeleton loaders
                                <div class="flex flex-col gap-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} class="kodo-skeleton" style={{ height: '120px', borderRadius: '12px' }} />
                                    ))}
                                </div>
                            ) : registry.packs.length === 0 ? (
                                <div class="kodo-empty py-8">
                                    <div class="text-2xl mb-2">🌐</div>
                                    <div class="text-xs">
                                        {registry.error
                                            ? "Can't reach the registry. Check your connection."
                                            : 'No community packs yet. Be the first to publish!'}
                                    </div>
                                    {registry.error && (
                                        <button class="kodo-btn-secondary mt-3" onClick={registry.fetchPacks}>
                                            Retry
                                        </button>
                                    )}
                                </div>
                            ) : (
                                registry.packs.map((pack: RegistryPack) => (
                                    <RegistryPackCard
                                        key={pack.id}
                                        pack={pack}
                                        isInstalled={installedPacks.some(p => p.id === pack.id && p.installed)}
                                        onInstall={() => registry.installPack(pack.id, pack.fileUrl)}
                                        onRate={registry.currentUser ? (stars) => registry.ratePack(pack.id, stars) : undefined}
                                        canRate={!!registry.currentUser}
                                    />
                                ))
                            )}

                            {registry.hasMore && !registry.isLoading && (
                                <button
                                    class="kodo-btn-secondary w-full"
                                    onClick={registry.loadMore}
                                    style={{ fontSize: '11px' }}
                                >
                                    Load more...
                                </button>
                            )}

                            {registry.isLoading && registry.packs.length > 0 && (
                                <div class="text-xs text-center py-2" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                                    Loading...
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div class="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--vscode-widget-border, rgba(255,255,255,0.1))' }}>
                            {registry.currentUser ? (
                                <button
                                    class="kodo-btn flex items-center gap-1.5"
                                    onClick={() => setShowPublishModal(true)}
                                    style={{ fontSize: '11px' }}
                                >
                                    📤 Publish a Pack
                                </button>
                            ) : (
                                <span class="text-xs" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.6 }}>
                                    Sign in to publish packs
                                </span>
                            )}
                            <button class="kodo-btn-secondary" onClick={onClose}>Close</button>
                        </div>
                    </div>
                )}
            </div>

            {showPublishModal && (
                <PublishPackModal
                    folders={folders}
                    isSignedIn={!!registry.currentUser}
                    onSignIn={registry.signIn}
                    onClose={() => setShowPublishModal(false)}
                    publishResult={registry.publishResult}
                    onClearResult={registry.clearPublishResult}
                />
            )}
        </div>
    );
}
