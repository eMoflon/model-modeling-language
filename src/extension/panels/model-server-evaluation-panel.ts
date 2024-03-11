import * as vscode from 'vscode';
import {getNonce} from "./panel-utils.js";

export class ModelServerEvaluationPanel {

    public static currentPanel: ModelServerEvaluationPanel | undefined;

    private static readonly viewType = "PanelNameGoesHere";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _extContext: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extContext: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        // Otherwise, create a new panel.
        if (ModelServerEvaluationPanel.currentPanel) {
            ModelServerEvaluationPanel.currentPanel._panel.reveal(column);
        } else {
            // ReactPanel.currentPanel = new ReactPanel(extensionPath, column || vscode.ViewColumn.One);
            ModelServerEvaluationPanel.currentPanel = new ModelServerEvaluationPanel(extContext, column || vscode.ViewColumn.One);
        }
    }

    //temporarily setting extcontext to any type
    private constructor(_extContext: vscode.ExtensionContext, column: vscode.ViewColumn) {
        this._extContext = _extContext;
        this._extensionUri = this._extContext.extensionUri;

        // Create and show a new webview panel
        this._panel = vscode.window.createWebviewPanel(ModelServerEvaluationPanel.viewType, "ReacTree", column, {
            // Enable javascript in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        });

        // Set the webview's initial html content
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        //Listen to messages
        this._panel.webview.onDidReceiveMessage(
            async (msg: any) => {
                switch (msg.command) {
                    case 'startup':
                        console.log('message received')
                        break;
                    case 'testing':
                        console.log('reachedBrain')
                        this._panel!.webview.postMessage({command: 'refactor'});
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        ModelServerEvaluationPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "out", "extension", "webview", "index.wv.js")
        );

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "styles.css")
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Panel Title Goes Here</title>
        <link rel="stylesheet" href="${styleUri}">
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          window.onload = function() {
            vscode.postMessage({ command: 'startup' });
            console.log('HTML started up.');
          };
        </script>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>
    `;
    }
}