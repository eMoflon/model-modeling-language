import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerGeneratorViewContainer} from "../views/model-server-generator-view-container.js";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import {URI} from "vscode-uri";

export class StartModelServerCommand extends ExtensionCommand {
    readonly generatorViewContainer;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, generatorViewContainer: ModelServerGeneratorViewContainer) {
        super("model-modeling-language.startModelServer", client, logger);
        this.generatorViewContainer = generatorViewContainer;
    }

    execute(...args: any[]): any {
        const selectedResources: {
            ecore: URI | undefined,
            xmi: URI | undefined,
            gc: URI | undefined
        } = this.generatorViewContainer.getSelectedProjectResources();
        if (selectedResources.ecore == undefined || selectedResources.xmi == undefined || selectedResources.gc == undefined) {
            showUIMessage(MessageType.ERROR, "Not all needed resources selected!");
        } else {
            showUIMessage(MessageType.INFO, `Start modelserver: ${JSON.stringify(selectedResources)}`);
        }
    }
}