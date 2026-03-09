import * as vscode from 'vscode';
import * as path from 'path';
import { PackManifest, Snippet, Folder, Tag } from '../models/types';

export class PackService {
    /**
     * Load all built-in pack manifests from the packs/ directory.
     */
    static async getBuiltinPacks(extensionUri: vscode.Uri): Promise<PackManifest[]> {
        const packs: PackManifest[] = [];
        const packsDir = vscode.Uri.joinPath(extensionUri, 'dist', 'packs');

        try {
            const files = await vscode.workspace.fs.readDirectory(packsDir);
            for (const [fileName] of files) {
                if (fileName.endsWith('.json')) {
                    try {
                        const fileUri = vscode.Uri.joinPath(packsDir, fileName);
                        const content = await vscode.workspace.fs.readFile(fileUri);
                        const data = JSON.parse(Buffer.from(content).toString('utf-8'));
                        if (PackService.validatePack(data)) {
                            packs.push(data);
                        }
                    } catch {
                        // Skip invalid pack files
                    }
                }
            }
        } catch {
            // packs/ directory not found — return empty
        }

        return packs;
    }

    /**
     * Load a specific pack manifest by ID.
     */
    static async getPackManifest(extensionUri: vscode.Uri, packId: string): Promise<PackManifest | null> {
        const packs = await PackService.getBuiltinPacks(extensionUri);
        return packs.find(p => p.id === packId) ?? null;
    }

    /**
     * Validate that data conforms to the PackManifest schema.
     */
    static validatePack(data: unknown): data is PackManifest {
        if (!data || typeof data !== 'object') return false;
        const d = data as Record<string, unknown>;

        return (
            typeof d.id === 'string' && d.id.length > 0 &&
            typeof d.name === 'string' && d.name.length > 0 &&
            typeof d.description === 'string' &&
            typeof d.author === 'string' &&
            typeof d.version === 'string' &&
            typeof d.language === 'string' &&
            typeof d.icon === 'string' &&
            Array.isArray(d.snippets) &&
            Array.isArray(d.folders) &&
            Array.isArray(d.tags)
        );
    }

    /**
     * Prefix all snippet/folder/tag IDs with `pack:{packId}:` to avoid collisions.
     * Also remaps folderId and tag references in snippets.
     */
    static prefixPackIds(manifest: PackManifest): PackManifest {
        const prefix = `pack:${manifest.id}:`;

        const folders: Folder[] = manifest.folders.map(f => ({
            ...f,
            id: prefix + f.id,
            parentId: f.parentId ? prefix + f.parentId : null,
        }));

        const tags: Tag[] = manifest.tags.map(t => ({
            ...t,
            id: prefix + t.id,
        }));

        const snippets = manifest.snippets.map(s => ({
            ...s,
            id: prefix + s.id,
            folderId: prefix + s.folderId,
            tags: s.tags.map(tagRef => prefix + tagRef),
        }));

        return {
            ...manifest,
            snippets,
            folders,
            tags,
        };
    }
}
