import * as vscode from 'vscode';
import { KodoData, Snippet, Folder, Tag, TemplatePack, PackManifest, generateId } from '../models/types';
import { PackService } from './PackService';

const STORAGE_KEY = 'kodo.data';
const DATA_VERSION = 2;

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
        // Migration: v1 → v2 (add packs array)
        if (raw.version === 1) {
            (raw as any).packs = [];
            raw.version = 2;
        }
        // Ensure packs array exists
        if (!raw.packs) {
            raw.packs = [];
        }
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
            packs: [],
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

    // ─── Template Packs ───

    async installPack(manifest: PackManifest): Promise<void> {
        const data = this.getData();

        // Prefix all IDs
        const prefixed = PackService.prefixPackIds(manifest);
        const now = Date.now();

        // Add folders
        for (const folder of prefixed.folders) {
            if (!data.folders.find(f => f.id === folder.id)) {
                data.folders.push(folder);
            }
        }

        // Add tags
        for (const tag of prefixed.tags) {
            if (!data.tags.find(t => t.id === tag.id)) {
                data.tags.push(tag);
            }
        }

        // Add snippets
        for (const snippet of prefixed.snippets) {
            if (!data.snippets.find(s => s.id === snippet.id)) {
                data.snippets.push({
                    ...snippet,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        // Track the pack as installed
        const existingIdx = data.packs.findIndex(p => p.id === manifest.id);
        const packEntry: TemplatePack = {
            id: manifest.id,
            name: manifest.name,
            description: manifest.description,
            author: manifest.author,
            version: manifest.version,
            language: manifest.language,
            icon: manifest.icon,
            snippetCount: manifest.snippets.length,
            installed: true,
            builtin: manifest.id.startsWith('kodo.'),
            installedAt: now,
        };

        if (existingIdx !== -1) {
            data.packs[existingIdx] = packEntry;
        } else {
            data.packs.push(packEntry);
        }

        await this.setData(data);
    }

    async uninstallPack(packId: string): Promise<void> {
        const data = this.getData();
        const prefix = `pack:${packId}:`;

        // Remove pack snippets
        data.snippets = data.snippets.filter(s => !s.id.startsWith(prefix));

        // Remove pack folders
        data.folders = data.folders.filter(f => !f.id.startsWith(prefix));

        // Remove pack tags and clean references from remaining snippets
        const packTagIds = new Set(data.tags.filter(t => t.id.startsWith(prefix)).map(t => t.id));
        data.tags = data.tags.filter(t => !t.id.startsWith(prefix));
        data.snippets.forEach(s => {
            s.tags = s.tags.filter(tagId => !packTagIds.has(tagId));
        });

        // Mark pack as uninstalled
        const packIdx = data.packs.findIndex(p => p.id === packId);
        if (packIdx !== -1) {
            data.packs[packIdx].installed = false;
            data.packs[packIdx].installedAt = 0;
        }

        await this.setData(data);
    }

    getInstalledPacks(): TemplatePack[] {
        return this.getData().packs.filter(p => p.installed);
    }

    getAllPacks(): TemplatePack[] {
        return this.getData().packs;
    }
}
