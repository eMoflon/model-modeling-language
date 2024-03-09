import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerGeneratorViewContainer} from "../views/model-server-generator-view-container.js";

export class RefreshProjectResourcesCommand extends ExtensionCommand {
    readonly generatorViewContainer;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, generatorViewContainer: ModelServerGeneratorViewContainer) {
        super("model-modeling-language.refreshProjectResources", client, logger);
        this.generatorViewContainer = generatorViewContainer;
    }

    execute(...args: any[]): any {
        this.generatorViewContainer.refreshProjectResources();
    }
}