import {ExtensionTreeView} from "./view-utils.js";
import {ProjectResource, ProjectResourceType} from "./project-resource-item.js";
import vscode, {CancellationToken, DataTransfer, ProviderResult, TreeDragAndDropController, TreeItem} from "vscode";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";

export class ModelServerGeneratorSelectedResourcesView extends ExtensionTreeView<ProjectResource> {
    private selectedEcore: ProjectResource | undefined = undefined;
    private selectedXMI: ProjectResource | undefined = undefined;
    private selectedGC: ProjectResource | undefined = undefined;

    constructor() {
        super('model-server-selected-resources');
    }

    selectFile(selectedResource: ProjectResource): boolean {
        if (selectedResource.resourceType == ProjectResourceType.ECORE_RESOURCE) {
            if (this.selectedEcore == undefined) {
                this.selectedEcore = selectedResource;
                return true;
            }
        } else if (selectedResource.resourceType == ProjectResourceType.XMI_RESOURCE) {
            if (this.selectedXMI == undefined) {
                this.selectedXMI = selectedResource;
                return true;
            }
        } else if (selectedResource.resourceType == ProjectResourceType.GC_RESOURCE) {
            if (this.selectedGC == undefined) {
                this.selectedGC = selectedResource;
                return true;
            }
        }
        return false;
    }

    /*unselectFile(selectedFile: URI): boolean {
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
    }*/

    getChildren(element?: ProjectResource): ProviderResult<ProjectResource[]> {
        if (element) {
            if (element.label == "Metamodel" && this.selectedEcore != undefined) {
                return Promise.resolve([new ProjectResource(this.selectedEcore.label, this.selectedEcore.resourceUri, this.selectedEcore.resourceType, vscode.TreeItemCollapsibleState.None)]);
            } else if (element.label == "Model" && this.selectedXMI != undefined) {
                return Promise.resolve([new ProjectResource(this.selectedXMI.label, this.selectedXMI.resourceUri, this.selectedXMI.resourceType, vscode.TreeItemCollapsibleState.None)]);
            } else if (element.label == "Constraints" && this.selectedGC != undefined) {
                return Promise.resolve([new ProjectResource(this.selectedGC.label, this.selectedGC.resourceUri, this.selectedGC.resourceType, vscode.TreeItemCollapsibleState.None)]);
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

    override getDragAndDropController(): vscode.TreeDragAndDropController<ProjectResource> | undefined {
        return new SelectedResourcesDragAndDropController(this);
    }
}


class SelectedResourcesDragAndDropController implements TreeDragAndDropController<ProjectResource> {
    readonly dragMimeTypes: readonly string[];
    readonly dropMimeTypes: readonly string[];
    private readonly _view: ModelServerGeneratorSelectedResourcesView;

    constructor(view: ModelServerGeneratorSelectedResourcesView) {
        this.dragMimeTypes = [];
        this.dropMimeTypes = ['application/vnd.code.tree.model-server-file-explorer'];
        this._view = view;
    }

    handleDrop(target: ProjectResource | undefined, dataTransfer: DataTransfer, token: CancellationToken): Thenable<void> | void {
        const transferItemAppContent = dataTransfer.get('application/vnd.code.tree.model-server-selected-resources');
        if (transferItemAppContent) {
            const droppedResources: ProjectResource[] = JSON.parse(transferItemAppContent.value) as ProjectResource[];
            if (droppedResources.length == 0) {
                return;
            } else if (droppedResources.length > 1) {
                showUIMessage(MessageType.ERROR, "You can only drop a single ProjectResource!");
            } else {
                const droppedResource: ProjectResource = droppedResources.at(0)!;
                if (droppedResource.resourceType == ProjectResourceType.DIRECTORY) {
                    showUIMessage(MessageType.ERROR, "You can not drop a directory!");
                } else if (!this._view.selectFile(droppedResource)) {
                    showUIMessage(MessageType.ERROR, "Could not select ProjectResource! Is there already a resource of this type selected?");
                } else {
                    this._view.refresh();
                }
            }
            return;
        }
    }
}
