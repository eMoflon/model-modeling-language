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
export class GraphConstraintLanguageCompletionProvider extends DefaultCompletionProvider {

    override async getCompletion(document: LangiumDocument, params: CompletionParams): Suggestions {
        const list = await super.getCompletion(document, params);
        if (list !== undefined) {
            const snippets: CompletionItem[] = [
                {
                    label: 'pattern',
                    labelDetails: {
                        detail: ' Define a new pattern'
                    },
                    kind: CompletionItemKind.Snippet,
                    insertText: 'pattern ${1:name} {\n}',
                    documentation: 'Define a new pattern',
                    insertTextFormat: InsertTextFormat.Snippet
                }
            ];
            list.items.push(...snippets);
        }
        return list;
    }
}