import {ChildProcessWithoutNullStreams, spawn} from "node:child_process";
import os from "os";
import {showUIMessage} from "../shared/NotificationUtil.js";
import {MessageType} from "../shared/MmlNotificationTypes.js";
import vscode from "vscode";
import {getCliPath, getSerializedConstraintDocument} from "./commands/command-utils.js";
import {GclSerializerRequest, GclSerializerResponse} from "../shared/GclConnectorTypes.js";
import {LanguageClient} from "vscode-languageclient/node.js";
import {URI} from "vscode-uri";
import {ModelServerConnector} from "./model-server-connector.js";

export class ModelServerStarter {
    private _isRunning: boolean = false;
    private _logger: vscode.OutputChannel;
    private _client: LanguageClient;
    private _modelServerConnector: ModelServerConnector;
    private proc: ChildProcessWithoutNullStreams | undefined = undefined;


    constructor(logger: vscode.OutputChannel, client: LanguageClient, modelServerConnector: ModelServerConnector) {
        this._logger = logger;
        this._client = client;
        this._modelServerConnector = modelServerConnector;

        this.setRunningState(false);
    }

    private setRunningState(state: boolean) {
        this._isRunning = state;
        vscode.commands.executeCommand('setContext', 'model-modeling-language.isModelServerRunning', state);
    }

    async startModelServer(config: ModelServerStarterConfig): Promise<ModelServerStarterResponse> {
        if (this._isRunning) {
            this._logger.appendLine("[DEBUG] ModelServer already running!")
            return {success: false, message: "Could not start ModelServer! ModelServer is already running!"};
        }

        const connectorPath: string | undefined = getCliPath();
        if (connectorPath == undefined) {
            this._logger.appendLine("[DEBUG] CLI not found!")
            return {success: false, message: "Could not start ModelServer! CLI not found!"};
        }

        const gclRequest: GclSerializerRequest = {uri: config.gc};
        const gclResponse: GclSerializerResponse = await getSerializedConstraintDocument(this._client, gclRequest);

        if (!gclResponse.success) {
            return {success: false, message: gclResponse.data};
        }

        const connectorCommand: string[] = ['-jar', connectorPath, 'hipegen', config.workspace.fsPath, config.ecore.fsPath, config.xmi.fsPath, '--run-model-server', '--run-model-extender'];
        const connectorMessage = gclResponse.data;

        this._logger.appendLine("[INFO] " + "======== Model Modeling Language CLI ========");
        this._logger.appendLine("[INFO] " + connectorCommand.join(" "));
        this._logger.appendLine("[INFO] ");

        this.proc = spawn('java', connectorCommand);

        this.setRunningState(true);

        this.proc.stdin.setDefaultEncoding('utf8');
        this.proc.stdout.setEncoding('utf8');
        this.proc.stdin.write(connectorMessage + os.EOL);

        this.proc.stdout.on('data', (data) => {
            this._logger.appendLine("[INFO] " + data);
        });

        this.proc.stderr.on('data', (data) => {
            this._logger.appendLine("[ERROR] " + data);
        });

        this.proc.on('close', (code, signal) => {
            this.setRunningState(false);
            this._logger.appendLine(`[DEBUG] Terminated with code ${code}`);
            this.proc = undefined;
            if (code == null && signal != null) {
                showUIMessage(MessageType.INFO, `ModelServer terminated! (Signal: ${signal})`);
            } else if (code != 0) {
                showUIMessage(MessageType.ERROR, `ModelServer terminated with error! (Code: ${code})`);
            }
        });

        return {success: true, message: ""};
    }

    async terminate(forcibly: boolean): Promise<boolean> {
        if (forcibly || this._isRunning) {
            try {
                await this._modelServerConnector.terminate();
                return Promise.resolve(true);
            } catch (e) {
                this._logger.appendLine("[DEBUG] Failed to terminate ModelServer! Assuming it did not start yet...")
            }
        }
        if (this.proc != undefined && this._isRunning) {
            return Promise.resolve(this.proc.kill('SIGINT'));
        } else {
            this._logger.appendLine("[DEBUG] Failed to terminate ModelServer Process! Assuming it is not running!")
        }
        return Promise.resolve(false);
    }
}

export interface ModelServerStarterConfig {
    workspace: URI,
    ecore: URI,
    xmi: URI,
    gc: URI
}

export interface ModelServerStarterResponse {
    success: boolean,
    message: string
}