import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {WebviewPanelManager} from "sprotty-vscode/lib";

export class ModelServerVisualizationFitCommand extends ExtensionCommand {
    private readonly webviewManager: WebviewPanelManager;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, webViewManager: WebviewPanelManager) {
        super("model-modeling-language.msvis.diagram.fit", client, logger);
        this.webviewManager = webViewManager;
    }

    execute(...args: any[]): any {
        const activeWebview = this.webviewManager.findActiveWebview();
        this.logger.appendLine("Running Fit Command");
        if (activeWebview) {
            activeWebview.sendAction({
                kind: 'fit',
                elementIds: [],
                animate: true
            });
        }
    }
}