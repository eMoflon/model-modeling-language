import * as vscode from "vscode";
import {Uri} from "vscode";
import {EnhancedSerializedWorkspace, MmlGeneratorRequest, SerializedWorkspace} from "../../shared/MmlConnectorTypes.js";
import {showUIMessage} from "../../shared/NotificationUtil.js";
import {MessageType} from "../../shared/MmlNotificationTypes.js";
import fs from "fs";
import path from "node:path";
import {LanguageClient} from "vscode-languageclient/node.js";

export abstract class ExtensionCommand {
    protected readonly command: string;
    protected readonly client: LanguageClient;
    protected readonly logger: vscode.OutputChannel;

    protected constructor(command: string, client: LanguageClient, logger: vscode.OutputChannel) {
        this.command = command;
        this.client = client;
        this.logger = logger;
    }

    abstract execute(...args: any[]): any;

    register(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.commands.registerCommand(this.command, (...args) => this.execute(...args)));
    }
}


export function getSerializedWorkspace(client: LanguageClient, ...args: any[]): Promise<EnhancedSerializedWorkspace> {
    return new Promise<EnhancedSerializedWorkspace>(resolve => {
        if (args.length == 0) {
            showUIMessage(MessageType.ERROR, "Could not determine workspace!");
            resolve({success: false, data: "Could not determine workspace!", documents: [], wsName: "", wsBasePath: ""})
            return;
        }

        const {fsPath}: { fsPath: string } = args[0]
        const fsPathUri: Uri = Uri.file(fsPath);

        const workspace = vscode.workspace.getWorkspaceFolder(fsPathUri);

        if (workspace == undefined) {
            showUIMessage(MessageType.ERROR, "Could not determine workspace!");
            resolve({success: false, data: "Could not determine workspace!", documents: [], wsName: "", wsBasePath: ""})
            return;
        }

        const workspaceName: string = workspace!.name;
        const workspacePath = workspace.uri.fsPath;

        const req: MmlGeneratorRequest = {
            wsBasePath: workspacePath,
            wsName: workspaceName
        }

        client.sendRequest("model-modeling-language-get-serialized-workspace", req, undefined)
            .then((uResponse) => {
                const res: SerializedWorkspace = uResponse as SerializedWorkspace;
                resolve({
                    success: res.success,
                    data: res.data,
                    documents: res.documents,
                    wsName: workspaceName,
                    wsBasePath: workspacePath
                });
            })
    });
}

export function writeToFile(enhancedSerializedWorkspace: EnhancedSerializedWorkspace): void {
export function writeSerializedWorkspaceToFile(enhancedSerializedWorkspace: EnhancedSerializedWorkspace): void {
    const content: string = JSON.stringify(enhancedSerializedWorkspace.documents);
    if (writeToFile(enhancedSerializedWorkspace.wsBasePath, `${enhancedSerializedWorkspace.wsName}.json`, content)) {
        showUIMessage(MessageType.INFO, `Stored serialized workspace in ${enhancedSerializedWorkspace.wsName}.json`);
    }
}
function writeToFile(targetParentDir: string, targetFileName: string, content: string): boolean {
    let fd;
    try {
        fs.mkdirSync(targetParentDir, {recursive: true});
        fd = fs.openSync(path.join(targetParentDir, targetFileName), "w");
        fs.writeFileSync(fd, content, {encoding: "utf-8"});
    } catch (err) {
        showUIMessage(MessageType.ERROR, err instanceof Error ? err.message : "Unknown Exception (FILE_WRITE)")
        return false;
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
        }
    }
    return true;
}