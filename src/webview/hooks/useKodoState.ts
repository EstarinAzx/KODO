import { useState, useEffect, useMemo } from 'preact/hooks';
import { vscode } from '../lib/vscodeApi';

// ─── Types (mirrored from extension host) ───
export interface Snippet {
    id: string;
    name: string;
    code: string;
    language: string;
    folderId: string;
    tags: string[];
    description: string;
    createdAt: number;
    updatedAt: number;
}

export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    sortOrder: number;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface TemplatePack {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    language: string;
    icon: string;
    snippetCount: number;
    installed: boolean;
    builtin: boolean;
    installedAt: number;
}

export interface PackManifest {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    language: string;
    icon: string;
    snippets: any[];
    folders: any[];
    tags: any[];
}

export interface KodoData {
    version: number;
    snippets: Snippet[];
    folders: Folder[];
    tags: Tag[];
    packs: TemplatePack[];
}

export interface KodoState {
    data: KodoData;
    activeFolderId: string | null;
    activeTagId: string | null;
    searchQuery: string;
    expandedFolders: Set<string>;
    editingSnippet: Snippet | null;
    showNewFolderModal: boolean;
    showPackBrowser: boolean;
    availablePacks: PackManifest[];
    filteredSnippets: Snippet[];
    setActiveFolderId: (id: string | null) => void;
    setActiveTagId: (id: string | null) => void;
    setSearchQuery: (q: string) => void;
    toggleFolder: (id: string) => void;
    setEditingSnippet: (s: Snippet | null) => void;
    setShowNewFolderModal: (show: boolean) => void;
    setShowPackBrowser: (show: boolean) => void;
}

const defaultData: KodoData = { version: 2, snippets: [], folders: [], tags: [], packs: [] };

export function useKodoState(): KodoState {
    const [data, setData] = useState<KodoData>(defaultData);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [activeTagId, setActiveTagId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['default']));
    const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [showPackBrowser, setShowPackBrowser] = useState(false);
    const [availablePacks, setAvailablePacks] = useState<PackManifest[]>([]);

    // Listen for messages from extension host
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.type === 'init' || msg.type === 'update') {
                setData(msg.data);
            }
            if (msg.type === 'packsUpdate') {
                setAvailablePacks(msg.availablePacks || []);
                // Also update pack installed status in data
                if (msg.packs) {
                    setData(prev => ({ ...prev, packs: msg.packs }));
                }
            }
        };
        window.addEventListener('message', handler);
        vscode.postMessage({ type: 'ready' });
        vscode.postMessage({ type: 'getAvailablePacks' });
        return () => window.removeEventListener('message', handler);
    }, []);

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
            return next;
        });
    };

    // Filtered + sorted snippets
    const filteredSnippets = useMemo(() => {
        let snippets = data.snippets;

        if (activeFolderId) {
            snippets = snippets.filter(s => s.folderId === activeFolderId);
        }
        if (activeTagId) {
            snippets = snippets.filter(s => s.tags.includes(activeTagId!));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            snippets = snippets.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.code.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.language.toLowerCase().includes(q)
            );
        }

        return [...snippets];
    }, [data.snippets, activeFolderId, activeTagId, searchQuery]);

    return {
        data,
        activeFolderId, setActiveFolderId,
        activeTagId, setActiveTagId,
        searchQuery, setSearchQuery,
        expandedFolders, toggleFolder,
        editingSnippet, setEditingSnippet,
        showNewFolderModal, setShowNewFolderModal,
        showPackBrowser, setShowPackBrowser,
        availablePacks,
        filteredSnippets,
    };
}
