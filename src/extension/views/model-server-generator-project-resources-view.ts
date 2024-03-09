import {ExtensionTreeView} from "./view-utils.js";
import * as vscode from "vscode";
import {ProviderResult, ThemeIcon, TreeItem} from "vscode";
import {URI, Utils} from "vscode-uri";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import fs from "fs";
import path from "node:path";

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
            return Promise.resolve(this.getDirectoryElements(element.resourceUri.fsPath));
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

}

export class ProjectResource extends vscode.TreeItem {

    constructor(public override readonly label: string,
                public override readonly resourceUri: URI,
                private resourceType: ProjectResourceType,
                public override readonly collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);

        if (this.resourceType == ProjectResourceType.ECORE_RESOURCE) {
            this.description = "Ecore";
            this.iconPath = new ThemeIcon("circuit-board");
        } else if (this.resourceType == ProjectResourceType.XMI_RESOURCE) {
            this.description = "XMI";
            this.iconPath = new ThemeIcon("combine");
        } else if (this.resourceType == ProjectResourceType.GC_RESOURCE) {
            this.description = "GC";
            this.iconPath = new ThemeIcon("github-action");
        }

        if (this.resourceType != ProjectResourceType.DIRECTORY) {
            this.tooltip = `${this.label} (${this.description})`;
        }
    }
}

enum ProjectResourceType {
    DIRECTORY,
    ECORE_RESOURCE,
    XMI_RESOURCE,
    GC_RESOURCE
}