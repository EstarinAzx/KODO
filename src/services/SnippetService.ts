import { KodoData, Snippet, Folder, Tag } from '../models/types';

/**
 * Business-logic layer for search, filter, and sort operations over KODO data.
 * Pure functions — no dependency on VS Code API.
 */
export class SnippetService {

    // ─── Search & Filter ───

    static searchSnippets(snippets: Snippet[], query: string): Snippet[] {
        const q = query.toLowerCase().trim();
        if (!q) { return snippets; }
        return snippets.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.language.toLowerCase().includes(q)
        );
    }

    static filterByFolder(snippets: Snippet[], folderId: string): Snippet[] {
        return snippets.filter(s => s.folderId === folderId);
    }

    static filterByTag(snippets: Snippet[], tagId: string): Snippet[] {
        return snippets.filter(s => s.tags.includes(tagId));
    }

    static filterByLanguage(snippets: Snippet[], language: string): Snippet[] {
        return snippets.filter(s => s.language === language);
    }

    // ─── Folder Tree ───

    static getRootFolders(folders: Folder[]): Folder[] {
        return folders
            .filter(f => f.parentId === null)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    static getChildFolders(folders: Folder[], parentId: string): Folder[] {
        return folders
            .filter(f => f.parentId === parentId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    static getFolderPath(folders: Folder[], folderId: string): Folder[] {
        const path: Folder[] = [];
        let current = folders.find(f => f.id === folderId);
        while (current) {
            path.unshift(current);
            current = current.parentId ? folders.find(f => f.id === current!.parentId) : undefined;
        }
        return path;
    }

    // ─── Sort ───

    static sortByDate(snippets: Snippet[], direction: 'asc' | 'desc' = 'desc'): Snippet[] {
        return [...snippets].sort((a, b) =>
            direction === 'desc' ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt
        );
    }

    static sortByName(snippets: Snippet[], direction: 'asc' | 'desc' = 'asc'): Snippet[] {
        return [...snippets].sort((a, b) =>
            direction === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
        );
    }

    // ─── Template Variable Detection ───

    static hasTemplateVariables(code: string): boolean {
        // Match VS Code snippet tab-stop syntax: ${1:placeholder} or $1
        return /\$\{\d+:[^}]+\}|\$\d+/.test(code);
    }

    // ─── Validation ───

    static validateImport(data: unknown): data is KodoData {
        if (!data || typeof data !== 'object') { return false; }
        const d = data as Record<string, unknown>;
        if (typeof d.version !== 'number') { return false; }
        if (!Array.isArray(d.snippets)) { return false; }
        if (!Array.isArray(d.folders)) { return false; }
        if (!Array.isArray(d.tags)) { return false; }
        // Validate each snippet has required fields
        for (const s of d.snippets) {
            if (!s || typeof s !== 'object') { return false; }
            const sn = s as Record<string, unknown>;
            if (typeof sn.id !== 'string' || typeof sn.name !== 'string' || typeof sn.code !== 'string') {
                return false;
            }
        }
        return true;
    }
}
