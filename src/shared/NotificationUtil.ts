import * as vscode from "vscode";

export function showUIMessage(type: MessageType, message: string) {
    if (type == MessageType.INFO) {
        vscode.window.showInformationMessage(message);
    } else if (type == MessageType.WARNING) {
        vscode.window.showWarningMessage(message);
    } else if (type == MessageType.ERROR) {
        vscode.window.showErrorMessage(message);
    }
}

export enum MessageType {
    INFO,
    WARNING,
    ERROR
}