import {DocumentState, EmptyFileSystem, startLanguageServer} from 'langium';
import {BrowserMessageReader, BrowserMessageWriter, createConnection} from 'vscode-languageserver/browser';
import {createModelModelingLanguageServices} from "./model-modeling-language-module";
import {Diagnostic, NotificationType} from "vscode-languageserver";
import {Model} from "./generated/ast";
import {serializeModel} from "./generator/mml-serializer";

declare const self: DedicatedWorkerGlobalScope;

/* browser specific setup code */
const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

// Inject the shared services and language-specific services
const {shared, mmlServices} = createModelModelingLanguageServices({connection, ...EmptyFileSystem});

// Start the language server with the shared services
startLanguageServer(shared);

// Send a notification with the serialized AST after every document change
type DocumentChange = { uri: string, content: string, diagnostics: Diagnostic[] };
const documentChangeNotification = new NotificationType<DocumentChange>('browser/DocumentChange');
shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, documents => {
    for (const document of documents) {
        const module = document.parseResult.value as Model;

        connection.sendNotification(documentChangeNotification, {
            uri: document.uri.toString(),
            content: serializeModel(module, mmlServices),
            diagnostics: document.diagnostics ?? []
        });
    }
});