import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {WebviewPanelManager} from "sprotty-vscode/lib";

export class ModelServerVisualizationOpenCommand extends ExtensionCommand {
    private readonly webviewManager: WebviewPanelManager;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, webViewManager: WebviewPanelManager) {
        super("model-modeling-language.msvis.diagram.open", client, logger);
        this.webviewManager = webViewManager;
    }

    execute(...args: any[]): any {
        this.webviewManager.openDiagram(vscode.Uri.file("ModelServer"), {reveal: true})
            .then(r => this.logger.appendLine(`[Opened] ${r == undefined ? "UNDEFINED" : "Received Endpoint"}`))
            .catch(reason => this.logger.appendLine(`[Failed] Could not initialize WebViewEndpoint: ${reason}`));
    }
}