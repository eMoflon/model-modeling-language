import {startLanguageServer} from 'langium';
import {NodeFileSystem} from 'langium/node';
import {createConnection, ProposedFeatures} from 'vscode-languageserver/node.js';
import {createModelModelingLanguageServices} from './model-modeling-language-module.js';
import {Model} from "./generated/ast.js";
import {Diagnostic} from "vscode-languageserver";
import {serializeModel} from "./serializer/mml-serializer.js";
import {MmlGeneratorRequest, MmlGeneratorResponse} from "../shared/MmlConnectorTypes.js";
import * as fs from "fs";
import path from "node:path";
import {MessageType} from "../shared/NotificationUtil.js";

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const {shared, MmlServices} = createModelModelingLanguageServices({connection, ...NodeFileSystem});

type SerializedDocument = {
    uri: string,
    content: string,
    diagnostics: Diagnostic[]
}

connection.onRequest("model-modeling-language-generator-file", (params: MmlGeneratorRequest) => {
    return new Promise<MmlGeneratorResponse>(resolve => {
        let serializedDocuments: SerializedDocument[] = [];
        if (shared.workspace.LangiumDocuments.all.isEmpty()) {
            resolve({
                type: MessageType.WARNING,
                message: `The workspace ${params.wsName} does not contain any managed MML files!`
            });
        }

        shared.workspace.LangiumDocuments.all.forEach(doc => {
            const docModel: Model = doc.parseResult.value as Model;
            const serializedDoc: SerializedDocument = {
                uri: doc.uri.toString(),
                content: serializeModel(docModel, MmlServices),
                diagnostics: doc.diagnostics ?? []
            };
            serializedDocuments.push(serializedDoc);
        });

        let fd;
        try {
            fd = fs.openSync(path.join(params.wsBasePath, `${params.wsName}.json`), "w");
            fs.writeFileSync(fd, JSON.stringify(serializedDocuments), {encoding: "utf-8"});
        } catch (err) {
            console.error(err);
            resolve({
                type: MessageType.ERROR,
                message: err instanceof Error ? err.message : "Unknown Exception"
            });
        } finally {
            if (fd !== undefined) {
                fs.closeSync(fd);
                resolve({
                    type: MessageType.INFO,
                    message: `Stored serialized workspace in ${params.wsName}.json`
                });
            }
        }
    })
});

// Start the language server with the shared services
startLanguageServer(shared);
