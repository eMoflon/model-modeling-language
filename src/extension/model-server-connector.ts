import {createPromiseClient, PromiseClient} from "@connectrpc/connect";
import {
    ModelServerConstraints,
    ModelServerEdits,
    ModelServerManagement,
    ModelServerPattern
} from "./generated/de/nexus/modelserver/ModelServer_connect.js";
import {createGrpcTransport} from "@connectrpc/connect-node";
import * as vscode from "vscode";

export type ClientCollection = {
    managementClient: PromiseClient<typeof ModelServerManagement>,
    patternClient: PromiseClient<typeof ModelServerPattern>,
    constraintClient: PromiseClient<typeof ModelServerConstraints>
    editClient: PromiseClient<typeof ModelServerEdits>
}

export class ModelServerConnector {
    private _clients: ClientCollection | undefined;
    private readonly _logger;


    constructor(logger: vscode.OutputChannel) {
        this._logger = logger;
    }

    private initClients() {
        const transport = createGrpcTransport({
            baseUrl: "http://localhost:9090",
            httpVersion: "2"
        });

        return {
            managementClient: createPromiseClient(ModelServerManagement, transport),
            patternClient: createPromiseClient(ModelServerPattern, transport),
            constraintClient: createPromiseClient(ModelServerConstraints, transport),
            editClient: createPromiseClient(ModelServerEdits, transport)
        } as ClientCollection
    }

    public terminate() {
        if (this._clients != undefined) {
            this._clients.managementClient.terminateServer({}).then(() => this.log("Terminated!"))
            this._clients = undefined;
        }
    }

    public log(msg: string) {
        this._logger.appendLine(msg);
    }

    get clients(): ClientCollection {
        if (this._clients == undefined) {
            this._clients = this.initClients();
        }
        return this._clients;
    }
}