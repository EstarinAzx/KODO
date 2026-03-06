import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { Folder, KodoData } from '../hooks/useKodoState';
import { vscode } from '../lib/vscodeApi';

interface NewFolderModalProps {
    data: KodoData;
    onClose: () => void;
}

export function NewFolderModal({ data, onClose }: NewFolderModalProps) {
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const handleCreate = () => {
        if (!name.trim()) return;
        vscode.postMessage({
            type: 'createFolder',
            folder: {
                name: name.trim(),
                parentId: parentId || null,
                sortOrder: data.folders.length,
            },
        });
        onClose();
    };

    return (
        <div class="kodo-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div class="kodo-modal">
                <h3 class="text-sm font-bold mb-4">New Folder</h3>

                <div class="mb-4">
                    <label class="block text-xs mb-1.5" style={{ color: 'var(--vscode-descriptionForeground)' }}>Folder name</label>
                    <input
                        ref={nameRef}
                        type="text"
                        class="kodo-input"
                        value={name}
                        onInput={(e) => setName((e.target as HTMLInputElement).value)}
                    />
                </div>

                <div class="mb-4">
                    <label class="block text-xs mb-1.5" style={{ color: 'var(--vscode-descriptionForeground)' }}>Parent folder (optional)</label>
                    <select
                        class="kodo-input"
                        value={parentId}
                        onChange={(e) => setParentId((e.target as HTMLSelectElement).value)}
                    >
                        <option value="">— Root level —</option>
                        {data.folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>

                <div class="flex gap-3 justify-end">
                    <button class="kodo-btn-secondary" onClick={onClose}>Cancel</button>
                    <button class="kodo-btn" onClick={handleCreate}>Create</button>
                </div>
            </div>
        </div>
    );
}


