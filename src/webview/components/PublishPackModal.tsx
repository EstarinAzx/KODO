import { h } from 'preact';
import { useState } from 'preact/hooks';
import { vscode } from '../lib/vscodeApi';
import { Folder } from '../hooks/useKodoState';

interface PublishPackModalProps {
    folders: Folder[];
    isSignedIn: boolean;
    onSignIn: () => void;
    onClose: () => void;
    publishResult: { success: boolean; message: string } | null;
    onClearResult: () => void;
}

export function PublishPackModal({ folders, isSignedIn, onSignIn, onClose, publishResult, onClearResult }: PublishPackModalProps) {
    const [folderId, setFolderId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('📦');
    const [language, setLanguage] = useState('javascript');
    const [version, setVersion] = useState('1.0.0');

    const handlePublish = () => {
        if (!folderId || !name) return;
        vscode.postMessage({
            type: 'registryPublishPack',
            folderId,
            name,
            description,
            icon,
            language,
            version,
        });
    };

    if (!isSignedIn) {
        return (
            <div class="kodo-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div class="kodo-modal">
                    <h3 class="text-sm font-bold mb-2">Publish a Pack</h3>
                    <p class="text-xs mb-4" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                        Sign in with GitHub to publish your packs to the community registry.
                    </p>
                    <div class="flex justify-center mb-4">
                        <button class="kodo-auth-btn" onClick={onSignIn}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                            </svg>
                            Sign in with GitHub
                        </button>
                    </div>
                    <div class="flex justify-end">
                        <button class="kodo-btn-secondary" onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    if (publishResult) {
        return (
            <div class="kodo-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClearResult(); onClose(); } }}>
                <div class="kodo-modal">
                    <div class="text-center py-4">
                        <div class="text-2xl mb-3">{publishResult.success ? '✓' : '✗'}</div>
                        <h3 class="text-sm font-bold mb-2">
                            {publishResult.success ? 'Pack Submitted!' : 'Publish Failed'}
                        </h3>
                        <p class="text-xs mb-4" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                            {publishResult.message}
                        </p>
                        <button class="kodo-btn" onClick={() => { onClearResult(); onClose(); }}>
                            OK
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div class="kodo-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div class="kodo-modal" style={{ maxWidth: '420px' }}>
                <h3 class="text-sm font-bold mb-1">Publish a Pack</h3>
                <p class="text-xs mb-4" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    Share a folder of snippets with the community
                </p>

                {/* Folder select */}
                <label class="text-xs font-semibold mb-1 block" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    Source Folder
                </label>
                <select
                    class="kodo-input mb-3"
                    value={folderId}
                    onChange={(e) => setFolderId((e.target as HTMLSelectElement).value)}
                >
                    <option value="">Select a folder...</option>
                    {folders.filter(f => f.id !== 'default').map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>

                {/* Pack name */}
                <label class="text-xs font-semibold mb-1 block" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    Pack Name
                </label>
                <input
                    class="kodo-input mb-3"
                    type="text"
                    placeholder="e.g. React Hooks Pro"
                    value={name}
                    onInput={(e) => setName((e.target as HTMLInputElement).value)}
                />

                {/* Description */}
                <label class="text-xs font-semibold mb-1 block" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                    Description
                </label>
                <textarea
                    class="kodo-input mb-3"
                    style={{ minHeight: '60px', resize: 'vertical' }}
                    placeholder="Brief description of what's in this pack..."
                    value={description}
                    onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                />

                {/* Row: icon, language, version */}
                <div class="flex gap-2 mb-4">
                    <div class="flex-1">
                        <label class="text-xs font-semibold mb-1 block" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                            Icon
                        </label>
                        <input
                            class="kodo-input"
                            type="text"
                            placeholder="Icon"
                            value={icon}
                            onInput={(e) => setIcon((e.target as HTMLInputElement).value)}
                            style={{ textAlign: 'center' }}
                        />
                    </div>
                    <div class="flex-1">
                        <label class="text-xs font-semibold mb-1 block" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                            Language
                        </label>
                        <select
                            class="kodo-input"
                            value={language}
                            onChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="csharp">C#</option>
                            <option value="go">Go</option>
                            <option value="rust">Rust</option>
                            <option value="php">PHP</option>
                            <option value="ruby">Ruby</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="flex-1">
                        <label class="text-xs font-semibold mb-1 block" style={{ color: 'var(--vscode-descriptionForeground)' }}>
                            Version
                        </label>
                        <input
                            class="kodo-input"
                            type="text"
                            placeholder="1.0.0"
                            value={version}
                            onInput={(e) => setVersion((e.target as HTMLInputElement).value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div class="flex justify-end gap-2">
                    <button class="kodo-btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        class="kodo-btn"
                        onClick={handlePublish}
                        disabled={!folderId || !name}
                        style={{ opacity: (!folderId || !name) ? 0.5 : 1 }}
                    >
                        Publish
                    </button>
                </div>
            </div>
        </div>
    );
}
