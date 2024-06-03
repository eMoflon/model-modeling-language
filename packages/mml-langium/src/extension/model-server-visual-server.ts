import {ActionNotification, WebviewPanelManager} from "sprotty-vscode";
import vscode from "vscode";
import {RequestBoundsAction, RequestModelAction, SEdge, SModelRoot, SNode} from "sprotty-protocol";
import {ModelServerConnector} from "./model-server-connector.js";
import {GetModelVisualizationResponse} from "./generated/de/nexus/modelserver/ModelServerVisualization_pb.js";
import {ModelServerVisualBuilder} from "./model-server-visual-builder.js";
import {showUIMessage} from "../shared/NotificationUtil.js";
import {MessageType} from "../shared/MmlNotificationTypes.js";

export class ModelServerVisualServer {
    private readonly _webviewManager: WebviewPanelManager;
    private readonly _logger: vscode.OutputChannel;
    private readonly _modelServerConnector: ModelServerConnector;

    private _model: SModelRoot;

    private static readonly EMPTY_MODEL: SModelRoot = <SModelRoot>{
        type: 'graph',
        id: 'EMPTY_ROOT',
        children: []
    };


    constructor(webviewManager: WebviewPanelManager, modelServerConnector: ModelServerConnector, logger: vscode.OutputChannel) {
        this._webviewManager = webviewManager;
        this._modelServerConnector = modelServerConnector;
        this._logger = logger;

        this.initializeNotificationHandler();
        this._model = ModelServerVisualServer.EMPTY_MODEL;
    }

    private initializeNotificationHandler() {
        this._webviewManager.messenger.onNotification(ActionNotification, (params, sender) => {
            if (params.action.kind == RequestModelAction.KIND) {
                this.updateModel();
            }
        });
    }

    public openVisualization() {
        this._webviewManager.openDiagram(vscode.Uri.file("ModelServer"), {reveal: true});
    }

    public fitVisualization() {
        const activeWebview = this._webviewManager.findActiveWebview();
        if (activeWebview) {
            activeWebview.sendAction({
                kind: 'fit',
                elementIds: [],
                animate: true
            });
        }
    }

    public centerVisualization() {
        const activeWebview = this._webviewManager.findActiveWebview();
        if (activeWebview) {
            activeWebview.sendAction({
                kind: 'center',
                elementIds: [],
                animate: true
            });
        }
    }

    public exportVisualization() {
        const activeWebview = this._webviewManager.findActiveWebview();
        if (activeWebview) {
            activeWebview.sendAction({
                kind: 'requestExportSvg'
            });
        }
    }

    public requestVisualizationData(filterNodes: number[], highlightNodes: number[]) {
        this._modelServerConnector.clients.visualizationClient.getVisualization({
            options: {
                filterNodes: filterNodes,
                highlightNodes: highlightNodes
            }
        }).then(res => {
            if (res.nodes.length > 8000) {
                showUIMessage(MessageType.ERROR, "Visualization could not be rendered because the model is too large.");
                this.setModelAndUpdate(ModelServerVisualServer.EMPTY_MODEL);
            } else {
                const newRoot: SModelRoot = this.translateModel(res);
                this.setModelAndUpdate(newRoot);
            }
        }).catch(reason => {
            showUIMessage(MessageType.ERROR, `Could not load visualization: ${reason}`);
            const emptyRoot: SModelRoot = ModelServerVisualServer.EMPTY_MODEL;
            this.setModelAndUpdate(emptyRoot);
        });
    }

    private translateModel(visResponse: GetModelVisualizationResponse): SModelRoot {
        const nodes: SNode[] = visResponse.nodes.map(node => ModelServerVisualBuilder.mapVisualizationNode(node));
        const edges: SEdge[] = visResponse.edges.map(edge => ModelServerVisualBuilder.mapVisualizationEdge(edge));

        return ModelServerVisualBuilder.createModelRoot("model-root", nodes, edges);
    }

    public setModel(model: SModelRoot) {
        this._model = model;
    }

    public updateModel() {
        const activeWebview = this._webviewManager.findActiveWebview();
        if (activeWebview) {
            this._logger.appendLine(`Found webview (${JSON.stringify(activeWebview.messageParticipant)}), sending action!`)
            activeWebview.sendAction({
                kind: RequestBoundsAction.KIND,
                newRoot: this._model
            } as RequestBoundsAction)
                .then(r => this._logger.appendLine("Looks fine..."))
                .catch(reason => this._logger.appendLine(`[Error] Hmm: ${reason}`));
        } else {
            this._logger.appendLine("Unable to find active Webview!")
        }
    }

    public setModelAndUpdate(model: SModelRoot) {
        this.setModel(model);
        this.updateModel();
    }
}