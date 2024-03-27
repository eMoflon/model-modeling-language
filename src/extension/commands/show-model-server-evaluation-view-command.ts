import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerEvaluationPanel} from "../panels/model-server-evaluation-panel.js";
import {ModelServerConnector} from "../model-server-connector.js";

export class ShowModelServerEvaluationViewCommand extends ExtensionCommand {
    private _extensionContext: vscode.ExtensionContext;
    private _modelServerConnector: ModelServerConnector;
    private _modelEvaluationLogger: vscode.OutputChannel;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, extensionContext: vscode.ExtensionContext, modelServerConnector: ModelServerConnector, evalLogger: vscode.OutputChannel) {
        super("model-modeling-language.showModelServerEvaluationView", client, logger);
        this._extensionContext = extensionContext;
        this._modelServerConnector = modelServerConnector;
        this._modelEvaluationLogger = evalLogger;
    }

    execute(...args: any[]): any {
        ModelServerEvaluationPanel.createOrShow(this._extensionContext, this._modelServerConnector, this._modelEvaluationLogger);
    }
}