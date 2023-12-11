import * as vscode from "vscode";
import {MessageType} from "./MmlNotificationTypes.js";

export function showUIMessage(type: MessageType, message: string) {
    if (type == MessageType.INFO) {
        vscode.window.showInformationMessage(message);
    } else if (type == MessageType.WARNING) {
        vscode.window.showWarningMessage(message);
    } else if (type == MessageType.ERROR) {
        vscode.window.showErrorMessage(message);
    }
}