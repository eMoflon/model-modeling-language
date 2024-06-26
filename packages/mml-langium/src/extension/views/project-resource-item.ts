import vscode, {ThemeIcon} from "vscode";
import {URI} from "vscode-uri";

export class ProjectResource extends vscode.TreeItem {

    constructor(public override readonly label: string,
                public override readonly resourceUri: URI | undefined,
                public resourceType: ProjectResourceType,
                public override readonly collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);

        if (this.resourceType == ProjectResourceType.ECORE_RESOURCE) {
            this.description = "Ecore";
            this.iconPath = new ThemeIcon("circuit-board");
            this.contextValue = "ECORE";
        } else if (this.resourceType == ProjectResourceType.XMI_RESOURCE) {
            this.description = "XMI";
            this.iconPath = new ThemeIcon("combine");
            this.contextValue = "XMI";
        } else if (this.resourceType == ProjectResourceType.GC_RESOURCE) {
            this.description = "GC";
            this.iconPath = new ThemeIcon("github-action");
            this.contextValue = "GC";
        } else if (this.resourceType == ProjectResourceType.DIRECTORY) {
            this.contextValue = "DIRECTORY";
        }

        if (this.resourceType != ProjectResourceType.DIRECTORY) {
            this.tooltip = `${this.label} (${this.description})`;
        }
    }
}

export enum ProjectResourceType {
    DIRECTORY,
    ECORE_RESOURCE,
    XMI_RESOURCE,
    GC_RESOURCE
}