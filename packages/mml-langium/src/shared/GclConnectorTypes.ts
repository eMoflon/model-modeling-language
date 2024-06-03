import {Uri} from "vscode";

export type GclSerializerRequest = {
    readonly uri: Uri;
}

export type GclSerializerResponse = {
    readonly success: boolean;
    readonly data: string;
    readonly filename: string;
    readonly parentDirPath: string;
}