import * as vscode from "vscode";
import {MessageType} from "./MmlNotificationTypes.js";

export function showUIMessage(type: MessageType, message: string): void {
    if (type == MessageType.INFO) {
        vscode.window.showInformationMessage(message);
    } else if (type == MessageType.WARNING) {
        vscode.window.showWarningMessage(message);
    } else if (type == MessageType.ERROR) {
        vscode.window.showErrorMessage(message);
    }
}

export async function showInteractiveUIMessage(type: MessageType, message: string, actions: string[]): Promise<string | undefined> {
    let selection: string | undefined;
    if (type == MessageType.INFO) {
        selection = await vscode.window.showInformationMessage(message, ...actions);
    } else if (type == MessageType.WARNING) {
        selection = await vscode.window.showWarningMessage(message, ...actions);
    } else if (type == MessageType.ERROR) {
        selection = await vscode.window.showErrorMessage(message, ...actions);
    }

    return new Promise<string | undefined>(resolve => {
        resolve(selection);
    });
}