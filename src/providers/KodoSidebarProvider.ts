import * as vscode from 'vscode';
import { StorageService } from '../services/StorageService';
import { PackService } from '../services/PackService';
import { FirebaseService } from '../services/FirebaseService';
import { MessageFromWebview } from '../models/types';

export class KodoSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'kodoSidebar';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _storage: StorageService,
        private readonly _firebase: FirebaseService,
    ) {
        // Try to restore Firebase session
        this._firebase.restoreSession().then(user => {
            if (user) {
                this._view?.webview.postMessage({ type: 'registryAuthState', user });
            }
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (message: MessageFromWebview) => {
            switch (message.type) {
                case 'ready':
                    this.sendDataToWebview();
                    break;

                case 'insertSnippet':
                    await vscode.commands.executeCommand(
                        'kodo.insertSnippet',
                        message.snippetId,
                        message.asPlainText
                    );
                    break;

                case 'saveSnippet':
                    await this._storage.saveSnippet(message.snippet);
                    this.sendDataToWebview();
                    break;

                case 'updateSnippet':
                    await this._storage.updateSnippet(message.snippet);
                    this.sendDataToWebview();
                    break;

                case 'deleteSnippet':
                    await this._storage.deleteSnippet(message.snippetId);
                    this.sendDataToWebview();
                    break;

                case 'createFolder':
                    await this._storage.createFolder(message.folder);
                    this.sendDataToWebview();
                    break;

                case 'updateFolder':
                    await this._storage.updateFolder(message.folder);
                    this.sendDataToWebview();
                    break;

                case 'deleteFolder':
                    await this._storage.deleteFolder(message.folderId);
                    this.sendDataToWebview();
                    break;

                case 'createTag':
                    await this._storage.createTag(message.tag);
                    this.sendDataToWebview();
                    break;

                case 'updateTag':
                    await this._storage.updateTag(message.tag);
                    this.sendDataToWebview();
                    break;

                case 'deleteTag':
                    await this._storage.deleteTag(message.tagId);
                    this.sendDataToWebview();
                    break;

                case 'reorderSnippets':
                    await this._storage.reorderSnippets(
                        message.sourceId,
                        message.targetId,
                        message.position,
                    );
                    this.sendDataToWebview();
                    break;

                case 'exportData': {
                    const exportData = this._storage.exportData();
                    const exportJson = JSON.stringify(exportData, null, 2);
                    const saveUri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file('kodo-snippets.json'),
                        filters: { 'JSON Files': ['json'] },
                        title: 'Export Kodo Snippets',
                    });
                    if (saveUri) {
                        await vscode.workspace.fs.writeFile(
                            saveUri,
                            Buffer.from(exportJson, 'utf-8'),
                        );
                        vscode.window.showInformationMessage(
                            `Exported ${exportData.snippets.length} snippets to ${saveUri.fsPath}`,
                        );
                    }
                    break;
                }

                case 'importData': {
                    const openUris = await vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: { 'JSON Files': ['json'] },
                        title: 'Import Kodo Snippets',
                    });
                    if (openUris && openUris.length > 0) {
                        try {
                            const fileContent = await vscode.workspace.fs.readFile(openUris[0]);
                            const importedData = JSON.parse(
                                Buffer.from(fileContent).toString('utf-8'),
                            );
                            if (!importedData.snippets || !Array.isArray(importedData.snippets)) {
                                vscode.window.showErrorMessage('Invalid Kodo export file.');
                                break;
                            }
                            await this._storage.importData(importedData, 'merge');
                            this.sendDataToWebview();
                            vscode.window.showInformationMessage(
                                `Imported ${importedData.snippets.length} snippets successfully!`,
                            );
                        } catch (err) {
                            vscode.window.showErrorMessage(
                                `Failed to import: ${err instanceof Error ? err.message : 'Unknown error'}`,
                            );
                        }
                    }
                    break;
                }

                case 'installPack': {
                    const manifest = await PackService.getPackManifest(this._extensionUri, message.packId);
                    if (manifest) {
                        await this._storage.installPack(manifest);
                        this.sendDataToWebview();
                        await this.sendPacksToWebview();
                        vscode.window.showInformationMessage(`Installed "${manifest.name}" pack (${manifest.snippets.length} snippets)`);
                    }
                    break;
                }

                case 'uninstallPack': {
                    await this._storage.uninstallPack(message.packId);
                    this.sendDataToWebview();
                    await this.sendPacksToWebview();
                    vscode.window.showInformationMessage('Pack uninstalled successfully.');
                    break;
                }

                case 'importPack': {
                    const openPackUris = await vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: { 'KODO Pack Files': ['json'] },
                        title: 'Import Template Pack',
                    });
                    if (openPackUris && openPackUris.length > 0) {
                        try {
                            const fileContent = await vscode.workspace.fs.readFile(openPackUris[0]);
                            const packData = JSON.parse(Buffer.from(fileContent).toString('utf-8'));
                            if (!PackService.validatePack(packData)) {
                                vscode.window.showErrorMessage('Invalid pack file format.');
                                break;
                            }
                            await this._storage.installPack(packData);
                            this.sendDataToWebview();
                            await this.sendPacksToWebview();
                            vscode.window.showInformationMessage(`Imported "${packData.name}" pack (${packData.snippets.length} snippets)`);
                        } catch (err) {
                            vscode.window.showErrorMessage(
                                `Failed to import pack: ${err instanceof Error ? err.message : 'Unknown error'}`,
                            );
                        }
                    }
                    break;
                }

                case 'getAvailablePacks': {
                    await this.sendPacksToWebview();
                    break;
                }

                // ─── Registry Handlers ───

                case 'registryFetchPacks': {
                    try {
                        const result = await this._firebase.fetchPacks({
                            page: message.page,
                            sortBy: message.sortBy,
                            language: message.language,
                            search: message.search,
                        });
                        this._view?.webview.postMessage({
                            type: 'registryPacks',
                            packs: result.packs,
                            hasMore: result.hasMore,
                        });
                    } catch {
                        this._view?.webview.postMessage({
                            type: 'registryPacks',
                            packs: [],
                            hasMore: false,
                        });
                    }
                    break;
                }

                case 'registryInstallPack': {
                    let manifest = null;

                    // Try inline manifest first (stored as JSON string in Firestore)
                    if (message.manifest) {
                        try {
                            manifest = JSON.parse(message.manifest);
                        } catch {
                            console.error('[KODO] Failed to parse inline manifest');
                        }
                    }

                    // Fall back to URL download if no inline manifest
                    if (!manifest && message.fileUrl) {
                        manifest = await this._firebase.downloadPackFile(message.fileUrl);
                    }

                    if (manifest) {
                        await this._storage.installPack(manifest);
                        await this._firebase.incrementDownloadCount(message.packId);
                        this.sendDataToWebview();
                        await this.sendPacksToWebview();
                        vscode.window.showInformationMessage(
                            `Installed "${manifest.name}" from registry (${manifest.snippets.length} snippets)`,
                        );
                    } else {
                        vscode.window.showErrorMessage('Failed to download pack from registry.');
                    }
                    break;
                }

                case 'registryRatePack': {
                    await this._firebase.ratePack(message.packId, message.stars);
                    break;
                }

                case 'registryPublishPack': {
                    const data = this._storage.getData();
                    const folder = data.folders.find(f => f.id === message.folderId);
                    if (!folder) {
                        this._view?.webview.postMessage({
                            type: 'registryPublishResult',
                            success: false,
                            message: 'Folder not found',
                        });
                        break;
                    }

                    // Build a PackManifest from the folder
                    const folderSnippets = data.snippets.filter(s => s.folderId === message.folderId);
                    const usedTagIds = new Set(folderSnippets.flatMap(s => s.tags));
                    const folderTags = data.tags.filter(t => usedTagIds.has(t.id));

                    const packManifest = {
                        id: message.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                        name: message.name,
                        description: message.description,
                        author: this._firebase.getCurrentUser()?.githubUsername || 'anonymous',
                        version: message.version,
                        language: message.language,
                        icon: message.icon,
                        snippets: folderSnippets.map(s => ({
                            id: s.id,
                            name: s.name,
                            code: s.code,
                            language: s.language,
                            folderId: 'root',
                            tags: s.tags,
                            description: s.description,
                        })),
                        folders: [{ id: 'root', name: message.name, parentId: null, sortOrder: 0 }],
                        tags: folderTags.map(t => ({ id: t.id, name: t.name, color: t.color })),
                    };

                    const user = this._firebase.getCurrentUser();
                    const result = await this._firebase.publishPack(packManifest as any, {
                        authorId: user?.id || '',
                        author: user?.githubUsername || 'anonymous',
                        icon: message.icon,
                        language: message.language,
                    });

                    this._view?.webview.postMessage({
                        type: 'registryPublishResult',
                        success: result.success,
                        message: result.message,
                    });
                    break;
                }

                case 'registrySignIn': {
                    const user = await this._firebase.signInWithGitHub();
                    this._view?.webview.postMessage({
                        type: 'registryAuthState',
                        user,
                    });
                    break;
                }

                case 'registrySignOut': {
                    await this._firebase.signOut();
                    this._view?.webview.postMessage({
                        type: 'registryAuthState',
                        user: null,
                    });
                    break;
                }
            }
        });
    }

    public sendDataToWebview(): void {
        if (this._view) {
            const data = this._storage.getData();
            this._view.webview.postMessage({ type: 'update', data });
        }
    }

    public async sendPacksToWebview(): Promise<void> {
        if (this._view) {
            const builtinPacks = await PackService.getBuiltinPacks(this._extensionUri);
            const installedPacks = this._storage.getAllPacks();
            this._view.webview.postMessage({
                type: 'packsUpdate',
                packs: installedPacks,
                availablePacks: builtinPacks,
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'main.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'tailwind-output.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource};">
  <link href="${styleUri}" rel="stylesheet">
  <title>KODO</title>
</head>
<body class="bg-sidebar text-foreground p-0 m-0 overflow-x-hidden">
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
