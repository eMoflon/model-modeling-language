import {ExtensionTreeView} from "./view-utils.js";
import {ProjectResource, ProjectResourceType} from "./project-resource-item.js";
import {URI, Utils} from "vscode-uri";
import vscode, {ProviderResult, TreeItem} from "vscode";

export class ModelServerGeneratorSelectedResourcesView extends ExtensionTreeView<ProjectResource> {
    private selectedEcore: URI | undefined;
    private selectedXMI: URI | undefined;
    private selectedGC: URI | undefined;

    constructor() {
        super('model-server-selected-resources');
    }

    selectFile(selectedFile: URI): boolean {
        const fileExtension: string = Utils.extname(selectedFile);
        if (fileExtension == ".ecore") {
            if (this.selectedEcore == undefined) {
                this.selectedEcore = selectedFile;
                return true;
            }
        } else if (fileExtension == ".xmi") {
            if (this.selectedXMI == undefined) {
                this.selectedXMI = selectedFile;
                return true;
            }
        } else if (fileExtension == ".gc") {
            if (this.selectedGC == undefined) {
                this.selectedGC = selectedFile;
                return true;
            }
        }
        return false;
    }

    unselectFile(selectedFile: URI): boolean {
        const fileExtension: string = Utils.extname(selectedFile);
        if (fileExtension == ".ecore") {
            if (this.selectedEcore != undefined && this.selectedEcore == selectedFile) {
                this.selectedEcore = undefined;
                return true;
            }
        } else if (fileExtension == ".xmi") {
            if (this.selectedXMI != undefined && this.selectedXMI == selectedFile) {
                this.selectedXMI = undefined;
                return true;
            }
        } else if (fileExtension == ".gc") {
            if (this.selectedGC != undefined && this.selectedGC == selectedFile) {
                this.selectedGC = undefined;
                return true;
            }
        }
        return false;
    }

    getChildren(element?: ProjectResource): ProviderResult<ProjectResource[]> {
        if (element) {
            if (element.resourceUri != undefined) {
                const fileName = Utils.basename(element.resourceUri);
                if (element.label == "Metamodel" && this.selectedEcore != undefined) {
                    return Promise.resolve([new ProjectResource(fileName, element.resourceUri, ProjectResourceType.ECORE_RESOURCE, vscode.TreeItemCollapsibleState.None)]);
                } else if (element.label == "Model" && this.selectedXMI != undefined) {
                    return Promise.resolve([new ProjectResource(fileName, element.resourceUri, ProjectResourceType.XMI_RESOURCE, vscode.TreeItemCollapsibleState.None)]);
                } else if (element.label == "Constraints" && this.selectedGC != undefined) {
                    return Promise.resolve([new ProjectResource(fileName, element.resourceUri, ProjectResourceType.GC_RESOURCE, vscode.TreeItemCollapsibleState.None)]);
                }
            }
            return Promise.resolve([]);
        } else {
            return Promise.resolve([
                new ProjectResource("Metamodel", undefined, ProjectResourceType.DIRECTORY, vscode.TreeItemCollapsibleState.Expanded),
                new ProjectResource("Model", undefined, ProjectResourceType.DIRECTORY, vscode.TreeItemCollapsibleState.Expanded),
                new ProjectResource("Constraints", undefined, ProjectResourceType.DIRECTORY, vscode.TreeItemCollapsibleState.Expanded),
            ]);
        }
    }

    getTreeItem(element: ProjectResource): TreeItem | Thenable<TreeItem> {
        return element;
    }
}

