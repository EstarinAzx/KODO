import { h } from 'preact';
import { RegistryPack } from '../hooks/useRegistry';
import { StarRating } from './StarRating';
import { CheckCircleIcon } from '../lib/icons';

interface RegistryPackCardProps {
    pack: RegistryPack;
    isInstalled: boolean;
    onInstall: () => void;
    onRate?: (stars: number) => void;
    canRate?: boolean;
}

export function RegistryPackCard({ pack, isInstalled, onInstall, onRate, canRate }: RegistryPackCardProps) {
    return (
        <div class="kodo-registry-card">
            <div class="flex items-start gap-3">
                <span class="text-xl flex-shrink-0">{pack.icon}</span>
                <div class="flex-1 min-w-0">
                    {/* Header */}
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-semibold truncate">{pack.name}</span>
                        {isInstalled && (
                            <span class="kodo-pack-badge installed">
                                <CheckCircleIcon size={9} /> Installed
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div class="text-xs mb-2" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                        {pack.description}
                    </div>

                    {/* Author */}
                    <div class="text-xs mb-1.5" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.7 }}>
                        by <span style={{ opacity: 1 }}>@{pack.author}</span>
                    </div>

                    {/* Metadata row */}
                    <div class="flex items-center gap-3 mb-2 text-xs" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.6 }}>
                        <span>{pack.snippetCount} snippets</span>
                        <span>•</span>
                        <span>{pack.language}</span>
                        <span>•</span>
                        <span>v{pack.version}</span>
                    </div>

                    {/* Downloads */}
                    <div class="flex items-center gap-1 mb-2 text-xs" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.7 }}>
                        <span class="kodo-badge downloads">⬇ {formatDownloads(pack.downloads)}</span>
                    </div>

                    {/* Rating */}
                    <div class="mb-3">
                        <StarRating
                            rating={pack.rating}
                            count={pack.ratingCount}
                            interactive={canRate}
                            onRate={onRate}
                        />
                    </div>

                    {/* Install button */}
                    <div class="flex justify-end">
                        {isInstalled ? (
                            <span class="text-xs" style={{ color: 'var(--vscode-descriptionForeground)', opacity: 0.5 }}>
                                Already installed
                            </span>
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

function formatDownloads(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
}
