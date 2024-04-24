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


    constructor(webviewManager: WebviewPanelManager, modelServerConnector: ModelServerConnector, logger: vscode.OutputChannel) {
        this._webviewManager = webviewManager;
        this._modelServerConnector = modelServerConnector;
        this._logger = logger;

        this.initializeNotificationHandler();
        this._model = this.initializeEmptyModel();
    }

    private initializeEmptyModel() {
        return {
            type: 'graph',
            id: 'EMPTY_ROOT',
            children: []
        } as SModelRoot;
    }

    private initializeNotificationHandler() {
        this._webviewManager.messenger.onNotification(ActionNotification, (params, sender) => {
            if (params.action.kind == RequestModelAction.KIND) {
                this.requestVisualizationData([], []);
            }
        });
    }

    public requestVisualizationData(filterNodes: number[], highlightNodes: number[]) {
        this._modelServerConnector.clients.visualizationClient.getVisualization({
            options: {
                filterNodes: filterNodes,
                highlightNodes: highlightNodes
            }
        }).then(res => {
            const newRoot: SModelRoot = this.translateModel(res);
            this.setModelAndUpdate(newRoot);
        }).catch(reason => {
            showUIMessage(MessageType.ERROR, `Could not load visualization: ${reason}`);
            const emptyRoot: SModelRoot = this.initializeEmptyModel();
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