// ─── Data Model Types ───

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

// ─── Template Packs ───

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
    snippets: Omit<Snippet, 'createdAt' | 'updatedAt'>[];
    folders: Folder[];
    tags: Tag[];
}

// ─── Data Container ───

export interface KodoData {
    version: number;
    snippets: Snippet[];
    folders: Folder[];
    tags: Tag[];
    packs: TemplatePack[];
}

// ─── Registry Types ───

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

// ─── Message Types (Webview ↔ Extension Host) ───

export type MessageToWebview =
    | { type: 'init'; data: KodoData }
    | { type: 'update'; data: KodoData }
    | { type: 'snippetInserted'; snippetId: string }
    | { type: 'importResult'; success: boolean; count: number }
    | { type: 'packsUpdate'; packs: TemplatePack[]; availablePacks: PackManifest[] }
    | { type: 'registryPacks'; packs: RegistryPack[]; hasMore: boolean }
    | { type: 'registryAuthState'; user: RegistryUser | null }
    | { type: 'registryPublishResult'; success: boolean; message: string };

export type MessageFromWebview =
    | { type: 'ready' }
    | { type: 'insertSnippet'; snippetId: string; asPlainText: boolean }
    | { type: 'saveSnippet'; snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> }
    | { type: 'updateSnippet'; snippet: Snippet }
    | { type: 'deleteSnippet'; snippetId: string }
    | { type: 'createFolder'; folder: Omit<Folder, 'id'> }
    | { type: 'updateFolder'; folder: Folder }
    | { type: 'deleteFolder'; folderId: string }
    | { type: 'createTag'; tag: Omit<Tag, 'id'> & { id?: string } }
    | { type: 'updateTag'; tag: Tag }
    | { type: 'deleteTag'; tagId: string }
    | { type: 'reorderSnippets'; sourceId: string; targetId: string; position: 'above' | 'below' }
    | { type: 'exportData' }
    | { type: 'importData' }
    | { type: 'installPack'; packId: string }
    | { type: 'uninstallPack'; packId: string }
    | { type: 'importPack' }
    | { type: 'getAvailablePacks' }
    | { type: 'registryFetchPacks'; page: number; sortBy: string; language?: string; search?: string }
    | { type: 'registryInstallPack'; packId: string; fileUrl: string }
    | { type: 'registryRatePack'; packId: string; stars: number }
    | { type: 'registryPublishPack'; folderId: string; name: string; description: string; icon: string; language: string; version: string }
    | { type: 'registrySignIn' }
    | { type: 'registrySignOut' };

// ─── Utility ───

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
