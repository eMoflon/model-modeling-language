import {ModelServerGeneratorProjectResourcesView} from "./model-server-generator-project-resources-view.js";
import {ModelServerGeneratorSelectedResourcesView} from "./model-server-generator-selected-resources-view.js";
import vscode from "vscode";
import {URI} from "vscode-uri";
import {ProjectResource} from "./project-resource-item.js";

export class ModelServerGeneratorViewContainer {
    private readonly _projectResourcesView: ModelServerGeneratorProjectResourcesView;
    private readonly _selectedResourcesView: ModelServerGeneratorSelectedResourcesView;


    constructor() {
        const rootPath =
            vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
                ? vscode.workspace.workspaceFolders[0].uri.fsPath
                : undefined;

        this._projectResourcesView = new ModelServerGeneratorProjectResourcesView(rootPath);
        this._selectedResourcesView = new ModelServerGeneratorSelectedResourcesView();

        this._projectResourcesView.register();
        this._selectedResourcesView.register();
    }

    refreshProjectResources(): void {
        this._projectResourcesView.refresh();
    }

    refreshSelectedResources(): void {
        this._selectedResourcesView.refresh();
    }

    unselectProjectResource(resource: ProjectResource): boolean {
        return this._selectedResourcesView.unselectResource(resource);
    }

    getSelectedProjectResources(): { ecore: URI | undefined, xmi: URI | undefined, gc: URI | undefined } {
        return this._selectedResourcesView.selectedResources;
    }

    unselectAllProjectResources() {
        this._selectedResourcesView.unselectAllResources();
    }
}