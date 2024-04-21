import {ActionNotification, WebviewPanelManager} from "sprotty-vscode";
import vscode from "vscode";
import {RequestBoundsAction, RequestModelAction, SModelRoot} from "sprotty-protocol";

export class ModelServerVisualServer {
    private readonly _webviewManager: WebviewPanelManager;
    private readonly _logger: vscode.OutputChannel;

    private _model: SModelRoot;


    constructor(webviewManager: WebviewPanelManager, logger: vscode.OutputChannel) {
        this._webviewManager = webviewManager;
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
                this.updateModel();
            }
        });
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