import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerGeneratorViewContainer} from "../views/model-server-generator-view-container.js";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import {URI} from "vscode-uri";
import {ModelServerStarter, ModelServerStarterConfig} from "../model-server-starter.js";

export class StartModelServerCommand extends ExtensionCommand {
    readonly generatorViewContainer: ModelServerGeneratorViewContainer;
    readonly modelServerStarter: ModelServerStarter;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, generatorViewContainer: ModelServerGeneratorViewContainer, modelServerStarter: ModelServerStarter) {
        super("model-modeling-language.startModelServer", client, logger);
        this.generatorViewContainer = generatorViewContainer;
        this.modelServerStarter = modelServerStarter;
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
            const workspace: URI | undefined = this.getWorkspace();
            if (workspace == undefined) {
                showUIMessage(MessageType.ERROR, "Could not determine workspace!");
                return;
            }
            const config: ModelServerStarterConfig = {
                workspace: workspace,
                ecore: selectedResources.ecore,
                xmi: selectedResources.xmi,
                gc: selectedResources.gc
            };
            this.modelServerStarter.startModelServer(config);
        }
    }

    getWorkspace(): URI | undefined {
        return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders!.length > 0
            ? vscode.workspace.workspaceFolders![0].uri
            : undefined;
    }
}