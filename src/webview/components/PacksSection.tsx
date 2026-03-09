import { h } from 'preact';
import { TemplatePack } from '../hooks/useKodoState';
import { PackCard } from './PackCard';
import { PackIcon } from '../lib/icons';

interface PacksSectionProps {
    packs: TemplatePack[];
    onBrowsePacks: () => void;
}

export function PacksSection({ packs, onBrowsePacks }: PacksSectionProps) {
    return (
        <div class="px-3">
            <div class="kodo-section-header">
                <div class="flex items-center gap-1.5">
                    <PackIcon size={12} />
                    <span>Template Packs</span>
                </div>
                <button
                    class="kodo-btn-ghost text-xs"
                    onClick={onBrowsePacks}
                    style={{ fontSize: '10px' }}
                >
                    Browse All
                </button>
            </div>

            {packs.length === 0 ? (
                <div class="text-xs py-3 text-center" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    No packs installed.{' '}
                    <button
                        class="kodo-btn-ghost"
                        onClick={onBrowsePacks}
                        style={{ fontSize: '11px', textDecoration: 'underline', opacity: 0.8 }}
                    >
                        Browse packs →
                    </button>
                </div>
            ) : (
                <div class="flex flex-col gap-2 mt-1">
                    {packs.map(pack => (
                        <PackCard key={pack.id} pack={pack} />
                    ))}
                </div>
            )}
        </div>
    );
}
