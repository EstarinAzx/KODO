import * as vscode from 'vscode';
import { KodoData, Snippet, Folder, Tag, generateId } from '../models/types';

const STORAGE_KEY = 'kodo.data';
const DATA_VERSION = 1;

export class StorageService {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    // ─── Full Data Access ───

    getData(): KodoData {
        const raw = this.context.globalState.get<KodoData>(STORAGE_KEY);
        if (!raw || !raw.version) {
            return this.getDefaultData();
        }
        // Future migration logic would go here
        return raw;
    }

    async setData(data: KodoData): Promise<void> {
        await this.context.globalState.update(STORAGE_KEY, data);
    }

    private getDefaultData(): KodoData {
        return {
            version: DATA_VERSION,
            snippets: [],
            folders: [
                { id: 'default', name: 'General', parentId: null, sortOrder: 0 },
            ],
            tags: [],
        };
    }

    // ─── Snippet CRUD ───

    getSnippets(): Snippet[] {
        return this.getData().snippets;
    }

    async saveSnippet(partial: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Snippet> {
        const data = this.getData();
        const now = Date.now();
        const snippet: Snippet = {
            ...partial,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        data.snippets.push(snippet);
        await this.setData(data);
        return snippet;
    }

    async updateSnippet(updated: Snippet): Promise<void> {
        const data = this.getData();
        const idx = data.snippets.findIndex(s => s.id === updated.id);
        if (idx !== -1) {
            data.snippets[idx] = { ...updated, updatedAt: Date.now() };
            await this.setData(data);
        }
    }

    async deleteSnippet(id: string): Promise<void> {
        const data = this.getData();
        data.snippets = data.snippets.filter(s => s.id !== id);
        await this.setData(data);
    }

    async reorderSnippets(sourceId: string, targetId: string, position: 'above' | 'below'): Promise<void> {
        const data = this.getData();
        const sourceIdx = data.snippets.findIndex(s => s.id === sourceId);
        if (sourceIdx === -1) return;

        // Remove source from array
        const [source] = data.snippets.splice(sourceIdx, 1);

        // Find target index (after removal)
        let targetIdx = data.snippets.findIndex(s => s.id === targetId);
        if (targetIdx === -1) {
            data.snippets.push(source);
        } else {
            if (position === 'below') { targetIdx += 1; }
            data.snippets.splice(targetIdx, 0, source);
        }

        await this.setData(data);
    }

    getSnippetById(id: string): Snippet | undefined {
        return this.getData().snippets.find(s => s.id === id);
    }

    // ─── Folder CRUD ───

    getFolders(): Folder[] {
        return this.getData().folders;
    }

    async createFolder(partial: Omit<Folder, 'id'>): Promise<Folder> {
        const data = this.getData();
        const folder: Folder = { ...partial, id: generateId() };
        data.folders.push(folder);
        await this.setData(data);
        return folder;
    }

    async updateFolder(updated: Folder): Promise<void> {
        const data = this.getData();
        const idx = data.folders.findIndex(f => f.id === updated.id);
        if (idx !== -1) {
            data.folders[idx] = updated;
            await this.setData(data);
        }
    }

    async deleteFolder(id: string): Promise<void> {
        if (id === 'default') { return; } // Protect default folder
        const data = this.getData();
        // Move orphaned snippets to default
        data.snippets.forEach(s => {
            if (s.folderId === id) { s.folderId = 'default'; }
        });
        // Move child folders to parent of deleted folder
        const deleted = data.folders.find(f => f.id === id);
        const parentId = deleted?.parentId ?? null;
        data.folders.forEach(f => {
            if (f.parentId === id) { f.parentId = parentId; }
        });
        data.folders = data.folders.filter(f => f.id !== id);
        await this.setData(data);
    }

    // ─── Tag CRUD ───

    getTags(): Tag[] {
        return this.getData().tags;
    }

    async createTag(partial: Omit<Tag, 'id'> & { id?: string }): Promise<Tag> {
        const data = this.getData();
        const tag: Tag = { ...partial, id: partial.id || generateId() };
        data.tags.push(tag);
        await this.setData(data);
        return tag;
    }

    async updateTag(updated: Tag): Promise<void> {
        const data = this.getData();
        const idx = data.tags.findIndex(t => t.id === updated.id);
        if (idx !== -1) {
            data.tags[idx] = updated;
            await this.setData(data);
        }
    }

    async deleteTag(id: string): Promise<void> {
        const data = this.getData();
        // Remove tag references from snippets
        data.snippets.forEach(s => {
            s.tags = s.tags.filter(t => t !== id);
        });
        data.tags = data.tags.filter(t => t.id !== id);
        await this.setData(data);
    }

    // ─── Export / Import ───

    exportData(): KodoData {
        return this.getData();
    }

    async importData(imported: KodoData, strategy: 'merge' | 'replace'): Promise<void> {
        if (strategy === 'replace') {
            await this.setData({ ...imported, version: DATA_VERSION });
            return;
        }
        // Merge strategy: add new items, skip duplicates by id
        const current = this.getData();
        const existingSnippetIds = new Set(current.snippets.map(s => s.id));
        const existingFolderIds = new Set(current.folders.map(f => f.id));
        const existingTagIds = new Set(current.tags.map(t => t.id));

        for (const s of imported.snippets) {
            if (!existingSnippetIds.has(s.id)) {
                current.snippets.push(s);
            }
        }
        for (const f of imported.folders) {
            if (!existingFolderIds.has(f.id)) {
                current.folders.push(f);
            }
        }
        for (const t of imported.tags) {
            if (!existingTagIds.has(t.id)) {
                current.tags.push(t);
            }
        }
        await this.setData(current);
    }
}
