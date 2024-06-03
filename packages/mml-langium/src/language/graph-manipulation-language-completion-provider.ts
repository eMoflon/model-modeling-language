import {DefaultCompletionProvider, LangiumDocument} from "langium";
import {
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    CompletionParams,
    InsertTextFormat,
} from 'vscode-languageserver';

type Suggestions = Promise<CompletionList | undefined>;

/**
 * The CompletionProvider deals with text completions. Langium allows completions of
 * various kinds, but we currently only use code snippets to provide ready-made code
 * snippets with fillable gaps.
 */
export class GraphManipulationLanguageCompletionProvider extends DefaultCompletionProvider {

    override async getCompletion(document: LangiumDocument, params: CompletionParams): Suggestions {
        const list = await super.getCompletion(document, params);
        if (list !== undefined) {
            const snippets: CompletionItem[] = [
                {
                    label: 'set',
                    labelDetails: {
                        detail: ' Set an attribute'
                    },
                    kind: CompletionItemKind.Snippet,
                    insertText: 'set ${1:nodeId}: ${2:attribute} = ${3:value};',
                    documentation: 'Set an attribute',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'create node',
                    labelDetails: {
                        detail: ' Create a new node'
                    },
                    kind: CompletionItemKind.Snippet,
                    insertText: 'create node ${1:class} ${2:identifier}();',
                    documentation: 'Create a new node',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'create edge',
                    labelDetails: {
                        detail: ' Create a new edge'
                    },
                    kind: CompletionItemKind.Snippet,
                    insertText: 'create edge ${1:nodeId} -${2:reference}-> ${3:nodeId};',
                    documentation: 'Create a new edge',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'delete node',
                    labelDetails: {
                        detail: ' Delete a node'
                    },
                    kind: CompletionItemKind.Snippet,
                    insertText: 'delete node ${1:nodeId};',
                    documentation: 'Delete a node',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'delete edge',
                    labelDetails: {
                        detail: ' Delete an edge'
                    },
                    kind: CompletionItemKind.Snippet,
                    insertText: 'delete edge ${1:nodeId} -${2:reference}-> ${3:nodeId};',
                    documentation: 'Delete an edge',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'chain',
                    labelDetails: {
                        detail: ' Create a chain'
                    },
                    kind: CompletionItemKind.Snippet,
                    insertText: 'chain {\n}',
                    documentation: 'Create a chain',
                    insertTextFormat: InsertTextFormat.Snippet
                }
            ];
            list.items.push(...snippets);
        }
        return list;
    }
}