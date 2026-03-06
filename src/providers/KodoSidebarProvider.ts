import * as vscode from 'vscode';
import { StorageService } from '../services/StorageService';
import { MessageFromWebview } from '../models/types';

export class KodoSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'kodoSidebar';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _storage: StorageService,
    ) { }

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
            }
        });
    }

    public sendDataToWebview(): void {
        if (this._view) {
            const data = this._storage.getData();
            this._view.webview.postMessage({ type: 'update', data });
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
