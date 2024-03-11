import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerEvaluationPanel} from "../panels/model-server-evaluation-panel.js";

export class ShowModelServerEvaluationViewCommand extends ExtensionCommand {
    private _extensionContext: vscode.ExtensionContext;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, extensionContext: vscode.ExtensionContext) {
        super("model-modeling-language.showModelServerEvaluationView", client, logger);
        this._extensionContext = extensionContext;
    }

    execute(...args: any[]): any {
        ModelServerEvaluationPanel.createOrShow(this._extensionContext);
    }
}