import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { vscode } from '../lib/vscodeApi';

// Types mirrored from extension host
export interface RegistryPack {
    id: string;
    name: string;
    description: string;
    author: string;
    authorId: string;
    language: string;
    icon: string;
    version: string;
    snippetCount: number;
    downloads: number;
    rating: number;
    ratingCount: number;
    tags: string[];
    fileUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    updatedAt: number;
}

export interface RegistryUser {
    id: string;
    githubUsername: string;
    displayName: string;
    avatarUrl: string;
    publishedPackCount: number;
}

export interface RegistryState {
    packs: RegistryPack[];
    hasMore: boolean;
    isLoading: boolean;
    error: string | null;
    sortBy: 'downloads' | 'rating' | 'newest';
    languageFilter: string | null;
    searchQuery: string;
    currentUser: RegistryUser | null;
    publishResult: { success: boolean; message: string } | null;
    fetchPacks: () => void;
    loadMore: () => void;
    setSortBy: (sort: 'downloads' | 'rating' | 'newest') => void;
    setLanguageFilter: (lang: string | null) => void;
    setSearchQuery: (q: string) => void;
    ratePack: (packId: string, stars: number) => void;
    installPack: (packId: string, fileUrl: string) => void;
    signIn: () => void;
    signOut: () => void;
    clearPublishResult: () => void;
}

export function useRegistry(): RegistryState {
    const [packs, setPacks] = useState<RegistryPack[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'newest'>('downloads');
    const [languageFilter, setLanguageFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState<RegistryUser | null>(null);
    const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(null);
    const [page, setPage] = useState(0);
    const debounceRef = useRef<number | null>(null);

    // Listen for messages from extension host
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.type === 'registryPacks') {
                if (page === 0) {
                    setPacks(msg.packs || []);
                } else {
                    setPacks(prev => [...prev, ...(msg.packs || [])]);
                }
                setHasMore(msg.hasMore || false);
                setIsLoading(false);
                setError(null);
            }
            if (msg.type === 'registryAuthState') {
                setCurrentUser(msg.user || null);
            }
            if (msg.type === 'registryPublishResult') {
                setPublishResult({ success: msg.success, message: msg.message });
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [page]);

    const fetchPacks = useCallback(() => {
        setIsLoading(true);
        setPage(0);
        vscode.postMessage({
            type: 'registryFetchPacks',
            page: 0,
            sortBy,
            language: languageFilter || undefined,
            search: searchQuery || undefined,
        });
    }, [sortBy, languageFilter, searchQuery]);

    const loadMore = useCallback(() => {
        const nextPage = page + 1;
        setPage(nextPage);
        setIsLoading(true);
        vscode.postMessage({
            type: 'registryFetchPacks',
            page: nextPage,
            sortBy,
            language: languageFilter || undefined,
            search: searchQuery || undefined,
        });
    }, [page, sortBy, languageFilter, searchQuery]);

    // Debounce search
    const setSearchQueryDebounced = useCallback((q: string) => {
        setSearchQuery(q);
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(() => {
            setIsLoading(true);
            setPage(0);
            vscode.postMessage({
                type: 'registryFetchPacks',
                page: 0,
                sortBy,
                language: languageFilter || undefined,
                search: q || undefined,
            });
        }, 300);
    }, [sortBy, languageFilter]);

    const ratePack = useCallback((packId: string, stars: number) => {
        vscode.postMessage({ type: 'registryRatePack', packId, stars });
    }, []);

    const installPack = useCallback((packId: string, fileUrl: string) => {
        vscode.postMessage({ type: 'registryInstallPack', packId, fileUrl });
    }, []);

    const signIn = useCallback(() => {
        vscode.postMessage({ type: 'registrySignIn' });
    }, []);

    const signOut = useCallback(() => {
        vscode.postMessage({ type: 'registrySignOut' });
    }, []);

    const clearPublishResult = useCallback(() => {
        setPublishResult(null);
    }, []);

    return {
        packs,
        hasMore,
        isLoading,
        error,
        sortBy,
        languageFilter,
        searchQuery,
        currentUser,
        publishResult,
        fetchPacks,
        loadMore,
        setSortBy: (s) => { setSortBy(s); },
        setLanguageFilter: (l) => { setLanguageFilter(l); },
        setSearchQuery: setSearchQueryDebounced,
        ratePack,
        installPack,
        signIn,
        signOut,
        clearPublishResult,
    };
}
