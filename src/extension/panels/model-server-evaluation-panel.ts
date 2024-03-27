import * as vscode from 'vscode';
import {getNonce} from "./panel-utils.js";
import {ModelServerConnector} from "../model-server-connector.js";
import {
    EditChainRequest,
    EditChainResponse,
    EditCreateEdgeRequest,
    EditCreateEdgeResponse,
    EditCreateNodeRequest,
    EditCreateNodeResponse,
    EditDeleteEdgeRequest,
    EditDeleteEdgeResponse,
    EditDeleteNodeRequest,
    EditDeleteNodeResponse,
    EditRequest,
    EditResponse,
    EditSetAttributeRequest,
    EditSetAttributeResponse,
    EditState
} from "../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";
import {PostEditRequest} from "../generated/de/nexus/modelserver/ModelServerEdits_pb.js";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";

export class ModelServerEvaluationPanel {

    public static currentPanel: ModelServerEvaluationPanel | undefined;

    private static readonly viewType = "ModelServerEvaluation";

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _extContext: vscode.ExtensionContext;
    private readonly _modelServerConnector: ModelServerConnector;
    private readonly _modelEvaluationLogger: vscode.OutputChannel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extContext: vscode.ExtensionContext, modelServerConnector: ModelServerConnector, evalLogger: vscode.OutputChannel) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        // Otherwise, create a new panel.
        if (ModelServerEvaluationPanel.currentPanel) {
            ModelServerEvaluationPanel.currentPanel._panel.reveal(column);
        } else {
            ModelServerEvaluationPanel.currentPanel = new ModelServerEvaluationPanel(extContext, column || vscode.ViewColumn.One, modelServerConnector, evalLogger);
        }
    }

    //temporarily setting extcontext to any type
    private constructor(_extContext: vscode.ExtensionContext, column: vscode.ViewColumn, modelServerConnector: ModelServerConnector, evalLogger: vscode.OutputChannel) {
        this._extContext = _extContext;
        this._extensionUri = this._extContext.extensionUri;

        this._modelServerConnector = modelServerConnector;
        this._modelEvaluationLogger = evalLogger;

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
                    case 'performModelRepair':
                        console.log('received: performModelRepair');
                        const repairRequest: EditChainRequest = EditChainRequest.fromJsonString(msg.data);
                        const postRequest: PostEditRequest = new PostEditRequest({
                            request: {
                                case: 'editChain',
                                value: repairRequest
                            }
                        });
                        this._modelServerConnector.clients.editClient.requestEdit(postRequest)
                            .then(res => {
                                if (res.response.case == 'editChain') {
                                    this.logModelRepair(repairRequest, res.response.value);
                                } else {
                                    throw new Error('Expected EditChainResponse but received EditResponse!');
                                }
                            }).catch(reason => {
                            this._modelEvaluationLogger.appendLine(`[ERROR] Failed to perform ModelRepair due to: ${reason}`)
                        });
                }
            },
            null,
            this._disposables
        );
    }

    private logModelRepair(req: EditChainRequest, res: EditChainResponse) {
        if (req.edits.length != res.edits.length) {
            throw new Error("Requested edits do not match response!");
        }
        for (let i = 0; i < res.edits.length; i++) {
            const editReq: EditRequest = req.edits.at(i) as EditRequest;
            const editRes: EditResponse = res.edits.at(i) as EditResponse;

            this._processResponse(editReq, editRes);
        }
    }

    private _processResponse(request: EditRequest, response: EditResponse) {
        if (request.request.case == "setAttributeRequest" && response.response.case == "setAttributeResponse") {
            const editRequest: EditSetAttributeRequest = request.request.value;
            const editResponse: EditSetAttributeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                this._modelEvaluationLogger.appendLine(`[SUCCESS] Updated Node ${editRequest.node?.nodeType.value}["${editRequest.attributeName}"] -> ${editRequest.attributeValue}`);
            } else if (editResponse.state == EditState.FAILURE) {
                this._modelEvaluationLogger.appendLine(`[FAILED] ${editResponse.message}`);
                showUIMessage(MessageType.ERROR, `[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        } else if (request.request.case == "createEdgeRequest" && response.response.case == "createEdgeResponse") {
            const editRequest: EditCreateEdgeRequest = request.request.value;
            const editResponse: EditCreateEdgeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                this._modelEvaluationLogger.appendLine(`[SUCCESS] Created ${editRequest.startNode?.nodeType.value} -${editRequest.referenceName}-> ${editRequest.targetNode?.nodeType.value}`);
            } else if (editResponse.state == EditState.FAILURE) {
                this._modelEvaluationLogger.appendLine(`[FAILED] ${editResponse.message}`);
                showUIMessage(MessageType.ERROR, `[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        } else if (request.request.case == "createNodeRequest" && response.response.case == "createNodeResponse") {
            const editRequest: EditCreateNodeRequest = request.request.value;
            const editResponse: EditCreateNodeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                this._modelEvaluationLogger.appendLine(`[SUCCESS] Created new ${editRequest.nodeType}(${editRequest.assignments.map(x => `${x.attributeName} = ${x.attributeValue}`).join(", ")}) -> NEW ID: ${editResponse.createdNodeId}`);
            } else if (editResponse.state == EditState.FAILURE) {
                this._modelEvaluationLogger.appendLine(`[FAILED] ${editResponse.message}`);
                showUIMessage(MessageType.ERROR, `[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        } else if (request.request.case == "deleteEdgeRequest" && response.response.case == "deleteEdgeResponse") {
            const editRequest: EditDeleteEdgeRequest = request.request.value;
            const editResponse: EditDeleteEdgeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                this._modelEvaluationLogger.appendLine(`[SUCCESS] Deleted ${editRequest.startNode?.nodeType.value} -${editRequest.referenceName}-> ${editRequest.targetNode?.nodeType.value}`);
            } else if (editResponse.state == EditState.FAILURE) {
                this._modelEvaluationLogger.appendLine(`[FAILED] ${editResponse.message}`);
                showUIMessage(MessageType.ERROR, `[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        } else if (request.request.case == "deleteNodeRequest" && response.response.case == "deleteNodeResponse") {
            const editRequest: EditDeleteNodeRequest = request.request.value;
            const editResponse: EditDeleteNodeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                this._modelEvaluationLogger.appendLine(`[SUCCESS] Deleted Node (${editRequest.node?.nodeType.value})`);
                for (const removedEdge of editResponse.removedEdges) {
                    this._modelEvaluationLogger.appendLine(`[ImplicitlyRemovedEdge] (${removedEdge.fromNode?.nodeType.value ?? "UNKNOWN"})-${removedEdge.reference}->(${removedEdge.toNode?.nodeType.value ?? "UNKNOWN"})`);
                }
            } else if (editResponse.state == EditState.FAILURE) {
                this._modelEvaluationLogger.appendLine(`[FAILED] ${editResponse.message}`);
                showUIMessage(MessageType.ERROR, `[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        }
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