import {DefaultCompletionProvider, LangiumDocument} from "langium";
import {
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    CompletionParams,
    InsertTextFormat,
} from 'vscode-languageserver';

type Suggestions = Promise<CompletionList | undefined>;

export class ModelModelingLanguageCompletionProvider extends DefaultCompletionProvider {

    override async getCompletion(document: LangiumDocument, params: CompletionParams): Suggestions {
        const list = await super.getCompletion(document, params);
        if (list !== undefined) {
            const snippets: CompletionItem[] = [
                {
                    label: 'import',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'import "${1:uri}";',
                    documentation: 'Define a new import',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'package',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'package ${1:name} {\n}',
                    documentation: 'Define a new package',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'class',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'class ${1:name} {\n}',
                    documentation: 'Define a new class',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'aclass',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'abstract class ${1:name} {\n}',
                    documentation: 'Define a new abstract class',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'interface',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'interface ${1:name} {\n}',
                    documentation: 'Define a new interface',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'enum',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'enum ${1:name} {\n    ${2:entry}\n}',
                    documentation: 'Define a new enum',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'macro',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'macro ${1:name}[] {\n}',
                    documentation: 'Define a new macro',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'function',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'function ${1:name}() {\n}',
                    documentation: 'Define a new function',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'rfunction',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'function ${1:name}() returns ${2:type} {\n}',
                    documentation: 'Define a new function with return type',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'fori',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'for ${1:name} in ${2:lower}:${3:upper} {\n}',
                    documentation: 'Define a new loop in range',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'instance',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'instance ${1:name} {\n}',
                    documentation: 'Define a new instance',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'forin',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'for ${1:container}-${2:ref}->${3:name} {\n}',
                    documentation: 'Define a new loop over class references',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'attribute',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'attribute ${1:type} ${2:name};',
                    documentation: 'Define a new attribute',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'reference',
                    kind: CompletionItemKind.Snippet,
                    insertText: 'reference ${1:type} ${2:name};',
                    documentation: 'Define a new reference',
                    insertTextFormat: InsertTextFormat.Snippet
                },
                {
                    label: 'oreference',
                    kind: CompletionItemKind.Snippet,
                    insertText: '@opposite ${1:type}::${2:ref}\nreference ${1:type} ${3:name};',
                    documentation: 'Define a new reference with opposite',
                    insertTextFormat: InsertTextFormat.Snippet
                }
            ];
            list.items.push(...snippets);
        }
        return list;
    }
}