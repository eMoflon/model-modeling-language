import {MessageType} from "./MmlNotificationTypes.js";
import {Diagnostic} from "vscode-languageserver";

export type MmlGeneratorRequest = {
    readonly wsBasePath: string;
    readonly wsName: string;
}

export type MmlGeneratorResponse = {
    readonly type: MessageType;
    readonly message: string;
}

export type SerializedDocument = {
    readonly uri: string;
    readonly content: string;
    readonly diagnostics: Diagnostic[];
}

export type SerializedWorkspace = {
    readonly success: boolean;
    readonly data: string;
    readonly documents: SerializedDocument[];
}

export type EnhancedSerializedWorkspace = {
    readonly success: boolean;
    readonly data: string;
    readonly documents: SerializedDocument[];
    readonly wsBasePath: string;
    readonly wsName: string;
}