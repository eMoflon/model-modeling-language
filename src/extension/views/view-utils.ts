import * as vscode from "vscode";
import {ProviderResult, TreeItem} from "vscode";

export abstract class ExtensionView {
    protected readonly viewId: string;

    protected constructor(viewId: string) {
        this.viewId = viewId;
    }

    abstract register(context: vscode.ExtensionContext): any;
}

export abstract class ExtensionTreeView<T> extends ExtensionView implements vscode.TreeDataProvider<T> {

    private _treeView: vscode.TreeView<T> | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<T | undefined | null | void> = new vscode.EventEmitter<T | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<T | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(viewId: string) {
        super(viewId);
    }

    register() {
        this._treeView = vscode.window.createTreeView(this.viewId, {
            canSelectMany: false,
            treeDataProvider: this
        })
    }


    get treeView(): vscode.TreeView<T> | undefined {
        return this._treeView;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    abstract getChildren(element?: T): ProviderResult<T[]>;

    abstract getTreeItem(element: T): TreeItem | Thenable<TreeItem>;
}