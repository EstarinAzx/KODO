import { h } from 'preact';
import { TemplatePack } from '../hooks/useKodoState';
import { CheckCircleIcon } from '../lib/icons';

interface PackCardProps {
    pack: TemplatePack;
    expanded?: boolean;
    onInstall?: () => void;
    onUninstall?: () => void;
}

export function PackCard({ pack, expanded, onInstall, onUninstall }: PackCardProps) {
    if (expanded) {
        return (
            <div class="kodo-pack-card">
                <div class="flex items-start gap-3">
                    <span class="text-xl flex-shrink-0">{pack.icon}</span>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm font-semibold truncate">{pack.name}</span>
                            {pack.installed && (
                                <span class="kodo-pack-badge installed">
                                    <CheckCircleIcon size={10} /> Installed
                                </span>
                            )}
                        </div>
                        <div class="text-xs mb-2" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                            {pack.description}
                        </div>
                        <div class="text-xs mb-2" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.7 }}>
                            {pack.snippetCount} snippets • {pack.language} • v{pack.version}
                        </div>
                        <div class="text-xs mb-3" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.6 }}>
                            By: {pack.author}
                        </div>
                        <div class="flex justify-end">
                            {pack.installed ? (
                                <button
                                    class="kodo-btn-uninstall"
                                    onClick={onUninstall}
                                >
                                    Uninstall
                                </button>
                            ) : (
                                <button
                                    class="kodo-btn"
                                    style={{ borderRadius: '9999px', fontSize: '11px', padding: '4px 14px' }}
                                    onClick={onInstall}
                                >
                                    Install
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Compact sidebar view
    return (
        <div class="kodo-pack-card compact">
            <div class="flex items-center gap-2">
                <span class="text-base flex-shrink-0">{pack.icon}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold truncate">{pack.name}</span>
                        <span class="kodo-pack-badge installed" style={{ marginLeft: 'auto' }}>
                            <CheckCircleIcon size={9} /> Installed
                        </span>
                    </div>
                    <div class="text-xs" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.7 }}>
                        {pack.snippetCount} snippets • v{pack.version}
                    </div>
                </div>
            </div>
        </div>
    );
}
