import {MessageType} from "./NotificationUtil.js";

export type MmlGeneratorRequest = {
    readonly wsBasePath: string;
    readonly wsName: string;
}

export type MmlGeneratorResponse = {
    readonly type: MessageType;
    readonly message: string;
}