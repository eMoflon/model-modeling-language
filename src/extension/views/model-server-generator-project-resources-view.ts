import {ExtensionTreeView} from "./view-utils.js";
import * as vscode from "vscode";
import {CancellationToken, DataTransfer, ProviderResult, TreeDragAndDropController, TreeItem} from "vscode";
import {URI, Utils} from "vscode-uri";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import fs from "fs";
import path from "node:path";
import {ProjectResource, ProjectResourceType} from "./project-resource-item.js";

export class ModelServerGeneratorProjectResourcesView extends ExtensionTreeView<ProjectResource> {

    constructor(private workspaceRoot: string | undefined) {
        super('model-server-file-explorer');
    }

    getChildren(element: ProjectResource | undefined): ProviderResult<ProjectResource[]> {
        if (!this.workspaceRoot) {
            showUIMessage(MessageType.ERROR, "Could not determine workspace!");
            return Promise.resolve([]);
        }

        if (element) {
            if (element.resourceUri != undefined) {
                return Promise.resolve(this.getDirectoryElements(element.resourceUri.fsPath));
            }
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.getDirectoryElements(this.workspaceRoot));
        }
    }

    getDirectoryElements(directoryPath: string): ProjectResource[] {
        if (!this.pathExists(directoryPath)) {
            return [];
        }

        let resources: ProjectResource[] = [];

        fs.readdirSync(directoryPath).forEach(file => {
            const fullFilePath: string = path.join(directoryPath, file);
            const fileUri: URI = URI.file(fullFilePath);

            if (fs.lstatSync(fileUri.fsPath).isDirectory()) {
                resources.push(new ProjectResource(file, fileUri, ProjectResourceType.DIRECTORY, vscode.TreeItemCollapsibleState.Collapsed))
            } else {
                const fileExtension: string = Utils.extname(fileUri);
                let resourceType: ProjectResourceType | undefined = undefined;
                if (fileExtension == ".ecore") {
                    resourceType = ProjectResourceType.ECORE_RESOURCE;
                } else if (fileExtension == ".xmi") {
                    resourceType = ProjectResourceType.XMI_RESOURCE;
                } else if (fileExtension == ".gc") {
                    resourceType = ProjectResourceType.GC_RESOURCE;
                }
                if (resourceType != undefined) {
                    resources.push(new ProjectResource(file, fileUri, resourceType, vscode.TreeItemCollapsibleState.None))
                }
            }
        });

        return resources;
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }

    getTreeItem(element: ProjectResource): TreeItem | Thenable<TreeItem> {
        return element;
    }

    override getDragAndDropController(): vscode.TreeDragAndDropController<ProjectResource> | undefined {
        return new ProjectResourcesDragAndDropController();
    }
}

class ProjectResourcesDragAndDropController implements TreeDragAndDropController<ProjectResource> {
    readonly dragMimeTypes: readonly string[];
    readonly dropMimeTypes: readonly string[];

    constructor() {
        this.dragMimeTypes = ['application/vnd.code.tree.model-server-selected-resources'];
        this.dropMimeTypes = [];
    }

    handleDrag(source: ProjectResource[], dataTransfer: DataTransfer, token: CancellationToken): Thenable<void> | void {
        const filteredResources: ProjectResource[] = source.filter(x => x.resourceType != ProjectResourceType.DIRECTORY);

        if (filteredResources.length > 0) {
            dataTransfer.set('application/vnd.code.tree.model-server-selected-resources', new vscode.DataTransferItem(filteredResources));
        }
    }
}

