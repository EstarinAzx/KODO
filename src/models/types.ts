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

export interface KodoData {
    version: number;
    snippets: Snippet[];
    folders: Folder[];
    tags: Tag[];
}

// ─── Message Types (Webview ↔ Extension Host) ───

export type MessageToWebview =
    | { type: 'init'; data: KodoData }
    | { type: 'update'; data: KodoData }
    | { type: 'snippetInserted'; snippetId: string };

export type MessageFromWebview =
    | { type: 'ready' }
    | { type: 'insertSnippet'; snippetId: string; asPlainText: boolean }
    | { type: 'saveSnippet'; snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'> }
    | { type: 'updateSnippet'; snippet: Snippet }
    | { type: 'deleteSnippet'; snippetId: string }
    | { type: 'createFolder'; folder: Omit<Folder, 'id'> }
    | { type: 'updateFolder'; folder: Folder }
    | { type: 'deleteFolder'; folderId: string }
    | { type: 'createTag'; tag: Omit<Tag, 'id'> }
    | { type: 'updateTag'; tag: Tag }
    | { type: 'deleteTag'; tagId: string };

// ─── Utility ───

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
