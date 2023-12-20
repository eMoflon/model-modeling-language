import {startLanguageServer} from 'langium';
import {NodeFileSystem} from 'langium/node';
import {createConnection, ProposedFeatures} from 'vscode-languageserver/node.js';
import {createModelModelingLanguageServices} from './model-modeling-language-module.js';
import {Model} from "./generated/ast.js";
import {serializeModel} from "./serializer/mml-serializer.js";
import {MmlGeneratorRequest, SerializedDocument, SerializedWorkspace} from "../shared/MmlConnectorTypes.js";

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const {shared, MmlServices} = createModelModelingLanguageServices({connection, ...NodeFileSystem});

connection.onRequest("model-modeling-language-get-serialized-workspace", (params: MmlGeneratorRequest) => {
    return new Promise<SerializedWorkspace>(resolve => {
        let serializedDocuments: SerializedDocument[] = [];
        if (shared.workspace.LangiumDocuments.all.isEmpty()) {
            resolve({
                success: false,
                data: `The workspace ${params.wsName} does not contain any managed MML files!`,
                documents: []
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

        resolve({
            success: true,
            data: "",
            documents: serializedDocuments
        });
    })
});

// Start the language server with the shared services
startLanguageServer(shared);
