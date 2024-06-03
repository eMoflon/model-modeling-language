import {ExtensionCommand} from "./command-utils.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import vscode from "vscode";
import {ModelServerGeneratorViewContainer} from "../views/model-server-generator-view-container.js";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import {ProjectResource} from "../views/project-resource-item.js";

export class RemoveSelectedResourceCommand extends ExtensionCommand {
    readonly generatorViewContainer;

    constructor(client: LanguageClient, logger: vscode.OutputChannel, generatorViewContainer: ModelServerGeneratorViewContainer) {
        super("model-modeling-language.removeSelectedResource", client, logger);
        this.generatorViewContainer = generatorViewContainer;
    }

    execute(...args: any[]): any {
        if (args.length > 1 && args.at(0) != null && args.at(0) != undefined) {
            const selectedProjectResource: ProjectResource = args.at(0) as ProjectResource;
            if (!this.generatorViewContainer.unselectProjectResource(selectedProjectResource)) {
                showUIMessage(MessageType.ERROR, `Could not unselect ProjectResource!`);
            } else {
                this.generatorViewContainer.refreshSelectedResources();
            }
        } else {
            showUIMessage(MessageType.ERROR, `Could not resolve ProjectResource to unselect!`);
        }
    }
}