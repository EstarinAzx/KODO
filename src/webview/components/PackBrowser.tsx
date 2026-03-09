import { h } from 'preact';
import { useState } from 'preact/hooks';
import { TemplatePack, PackManifest } from '../hooks/useKodoState';
import { PackCard } from './PackCard';
import { vscode } from '../lib/vscodeApi';
import { DownloadIcon } from '../lib/icons';

interface PackBrowserProps {
    packs: PackManifest[];
    installedPacks: TemplatePack[];
    onClose: () => void;
}

export function PackBrowser({ packs, installedPacks, onClose }: PackBrowserProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Merge available packs with install status
    const packList: TemplatePack[] = packs.map(manifest => {
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
            builtin: manifest.id.startsWith('kodo.'),
            installedAt: installed?.installedAt ?? 0,
        };
    });

    // Filter by search
    const filtered = searchQuery.trim()
        ? packList.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : packList;

    const handleInstall = (packId: string) => {
        vscode.postMessage({ type: 'installPack', packId });
    };

    const handleUninstall = (packId: string) => {
        vscode.postMessage({ type: 'uninstallPack', packId });
    };

    const handleImportPack = () => {
        vscode.postMessage({ type: 'importPack' });
    };

    return (
        <div class="kodo-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div class="kodo-modal" style={{ maxWidth: '480px' }}>
                <h3 class="text-sm font-bold mb-1">📦 Template Packs</h3>
                <p class="text-xs mb-4" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    Install curated code snippet packs
                </p>

                {/* Search */}
                <div class="mb-4">
                    <input
                        type="text"
                        class="kodo-input"
                        placeholder="Search packs..."
                        value={searchQuery}
                        onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                    />
                </div>

                {/* Pack list */}
                <div class="flex flex-col gap-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div class="text-xs text-center py-6" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                            No packs found
                        </div>
                    ) : (
                        filtered.map(pack => (
                            <PackCard
                                key={pack.id}
                                pack={pack}
                                expanded={true}
                                onInstall={() => handleInstall(pack.id)}
                                onUninstall={() => handleUninstall(pack.id)}
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
        </div>
    );
}
