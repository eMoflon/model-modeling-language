import * as vscode from 'vscode';
import {getNonce} from "./panel-utils.js";
import {ModelServerConnector} from "../model-server-connector.js";

export class ModelServerEvaluationPanel {

    public static currentPanel: ModelServerEvaluationPanel | undefined;

    private static readonly viewType = "ModelServerEvaluation";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _extContext: vscode.ExtensionContext;
    private readonly _modelServerConnector: ModelServerConnector;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extContext: vscode.ExtensionContext, modelServerConnector: ModelServerConnector) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        // Otherwise, create a new panel.
        if (ModelServerEvaluationPanel.currentPanel) {
            ModelServerEvaluationPanel.currentPanel._panel.reveal(column);
        } else {
            // ReactPanel.currentPanel = new ReactPanel(extensionPath, column || vscode.ViewColumn.One);
            ModelServerEvaluationPanel.currentPanel = new ModelServerEvaluationPanel(extContext, column || vscode.ViewColumn.One, modelServerConnector);
        }
    }

    //temporarily setting extcontext to any type
    private constructor(_extContext: vscode.ExtensionContext, column: vscode.ViewColumn, modelServerConnector: ModelServerConnector) {
        this._extContext = _extContext;
        this._extensionUri = this._extContext.extensionUri;

        this._modelServerConnector = modelServerConnector;

        // Create and show a new webview panel
        this._panel = vscode.window.createWebviewPanel(ModelServerEvaluationPanel.viewType, "ModelServer Evaluation", column, {
            // Enable javascript in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
            retainContextWhenHidden: true
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
                    case 'updateConstraints':
                        console.log('received: updateConstraints');
                        this._modelServerConnector.clients.constraintClient.getConstraints({})
                            .then(res => {
                                this._panel!.webview.postMessage({
                                    command: 'updateView',
                                    success: true,
                                    data: res.toJsonString()
                                });
                            })
                            .catch(reason => {
                                this._panel!.webview.postMessage({
                                    command: 'updateView',
                                    success: false,
                                    data: JSON.stringify(reason)
                                });
                            });
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
            vscode.Uri.joinPath(this._extensionUri, "out", "extension", "webview", "index.wv.css")
        );

        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

        const nonce = getNonce();

        return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} unsafe-inline; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Panel Title Goes Here</title>
        <link rel="stylesheet" href="${styleUri}">
        <link rel="stylesheet" href="${codiconsUri}"/>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
        </script>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>
    `;
    }
}