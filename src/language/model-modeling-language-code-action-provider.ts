import {
    AstReflection,
    CodeActionProvider,
    findLeafNodeAtOffset,
    getContainerOfType,
    IndexManager,
    LangiumDocument,
    LangiumServices,
    MaybePromise
} from "langium";
import * as ast from "./generated/ast.js";
import {Attribute, CReference, EnumEntry, EnumValueExpr} from "./generated/ast.js";
import {CodeAction, CodeActionKind, CodeActionParams, Command, Diagnostic} from "vscode-languageserver";
import {IssueCodes} from "./model-modeling-language-validator.js";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils.js";

/**
 * The CodeActionProvider deals with code actions (also known as quick fixes).
 * Based on the issue codes of the validator, actions are matched that make minor
 * adjustments to the code to fix a problem (e.g. adjust attribute type based on real value).
 */
export class ModelModelingLanguageCodeActionProvider implements CodeActionProvider {
    protected readonly reflection: AstReflection;
    protected readonly indexManager: IndexManager;

    constructor(services: LangiumServices) {
        this.reflection = services.shared.AstReflection;
        this.indexManager = services.shared.workspace.IndexManager;
    }

    getCodeActions(document: LangiumDocument, params: CodeActionParams): MaybePromise<Array<Command | CodeAction>> {
        const result: CodeAction[] = [];

        const acceptor = (ca: CodeAction | CodeAction[] | undefined) => {
            if (Array.isArray(ca)) {
                result.push(...ca);
            } else {
                result.push(ca as CodeAction)
            }
            return ca;
        };
        for (const diagnostic of params.context.diagnostics) {
            this.createCodeActions(diagnostic, document, acceptor);
        }
        return result;
    }

    private createCodeActions(diagnostic: Diagnostic, document: LangiumDocument, accept: (ca: CodeAction | CodeAction[] | undefined) => void): void {
        switch (diagnostic.code) {
            case IssueCodes.ImportAlreadyExists:
                accept(this.fixDuplicateImport(diagnostic, document));
                break;
            case IssueCodes.ImportIsMissing:
                accept(this.fixMissingImport(diagnostic, document));
                break;
            case IssueCodes.OppositeAnnotationMissing:
                accept(this.fixMissingOppositeAnnotation(diagnostic, document));
                break;
            case IssueCodes.AttributeTypeDoesNotMatch:
                accept(this.fixAttributeType(diagnostic, document));
                break;
            case IssueCodes.OppositesOppositeAnnotationMissing:
                accept(this.fixMissingOppositesOppositeAnnotation(diagnostic, document));
                break;
            case IssueCodes.UnnecessaryAttributeModifier:
            case IssueCodes.UnnecessaryReferenceModifier:
                accept(this.fixUnnecessaryModifiers(diagnostic, document));
                break;
            case IssueCodes.InvalidAttributeModifierCombination:
            case IssueCodes.InvalidReferenceModifierCombination:
                accept(this.fixInvalidModifierCombination(diagnostic, document));
                break;
        }
        return undefined;
    }

    /**
     *
     */
    private fixAttributeType(diagnostic: Diagnostic, document: LangiumDocument): CodeAction | undefined {
        const offset = document.textDocument.offsetAt(diagnostic.range.start);
        const rootCst = document.parseResult.value.$cstNode;
        const text = document.textDocument.getText(diagnostic.range);
        if (rootCst && text) {
            const cstNode = findLeafNodeAtOffset(rootCst, offset);
            const container: Attribute | undefined = getContainerOfType(cstNode?.astNode, ast.isAttribute);
            if (container && container.$cstNode && container.defaultValue != undefined) {
                let newType: string = "";
                if (ModelModelingLanguageUtils.isStringArithExpr(container.defaultValue)) {
                    newType = "string";
                } else if (ModelModelingLanguageUtils.isIntArithExpr(container.defaultValue)) {
                    newType = "int";
                } else if (ModelModelingLanguageUtils.isNumberArithExpr(container.defaultValue)) {
                    newType = "double";
                } else if (ModelModelingLanguageUtils.isBoolArithExpr(container.defaultValue)) {
                    newType = "bool"
                } else if (ModelModelingLanguageUtils.isEnumValueArithExpr(container.defaultValue)) {
                    const defValueEnumEntry: EnumEntry | undefined = (container.defaultValue as EnumValueExpr).val.ref;
                    if (defValueEnumEntry != undefined) {
                        newType = ModelModelingLanguageUtils.getQualifiedClassName(defValueEnumEntry.$container, defValueEnumEntry.$container.name);
                    }
                }
                if (newType != "") {
                    return {
                        title: `Update type to ${newType}`,
                        kind: CodeActionKind.QuickFix,
                        diagnostics: [diagnostic],
                        edit: {
                            changes: {
                                [document.textDocument.uri]: [{
                                    range: diagnostic.range,
                                    newText: newType
                                }]
                            }
                        }
                    };
                }
            }
        }
        return undefined;
    }

    private fixMissingOppositeAnnotation(diagnostic: Diagnostic, document: LangiumDocument): CodeAction | undefined {
        const offset = document.textDocument.offsetAt(diagnostic.range.start);
        const rootCst = document.parseResult.value.$cstNode;
        if (rootCst) {
            const cstNode = findLeafNodeAtOffset(rootCst, offset);
            const container = getContainerOfType(cstNode?.element, ast.isCReference);
            if (container && container.$cstNode) {
                const start = container.$cstNode.range.start;
                const indentation = start.character;
                return {
                    title: `Add new @opposite annotation`,
                    kind: CodeActionKind.QuickFix,
                    diagnostics: [diagnostic],
                    edit: {
                        changes: {
                            [document.textDocument.uri]: [{
                                range: {
                                    start: start,
                                    end: start
                                },
                                newText: '@opposite \n' + ' '.repeat(indentation)
                            }]
                        }
                    }
                };
            }
        }
        return undefined;
    }

    private fixMissingOppositesOppositeAnnotation(diagnostic: Diagnostic, document: LangiumDocument): CodeAction | undefined {
        const offset = document.textDocument.offsetAt(diagnostic.range.start);
        const rootCst = document.parseResult.value.$cstNode;
        if (rootCst) {
            const cstNode = findLeafNodeAtOffset(rootCst, offset);
            const container: CReference | undefined = getContainerOfType(cstNode?.astNode, ast.isCReference);
            if (container && container.$cstNode) {
                if (container.opposite != undefined && container.opposite.reference.ref != undefined) {
                    const oppositeNode = container.opposite.reference.ref;
                    const oppositeCNode = oppositeNode.$cstNode;
                    if (oppositeCNode != undefined) {
                        const oppositeCNodeDocument = oppositeCNode.root.element.$document;
                        if (oppositeCNodeDocument != undefined) {
                            const start = oppositeCNode.range.start;
                            const indentation = start.character;
                            const refQName = ModelModelingLanguageUtils.getFullyQualifiedRefName(container, container.name);
                            return {
                                title: `Add corresponding @opposite annotation`,
                                kind: CodeActionKind.QuickFix,
                                diagnostics: [diagnostic],
                                edit: {
                                    changes: {
                                        [oppositeCNodeDocument.textDocument.uri]: [{
                                            range: {
                                                start: start,
                                                end: start
                                            },
                                            newText: `@opposite ${refQName}\n` + ' '.repeat(indentation)
                                        }]
                                    }
                                }
                            };
                        }
                    }
                }
            }
        }
        return undefined;
    }

    private fixDuplicateImport(diagnostic: Diagnostic, document: LangiumDocument): CodeAction | undefined {
        const text = document.textDocument.getText(diagnostic.range);
        if (text) {
            return {
                title: `Remove duplicate import ${text}`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: diagnostic.range,
                            newText: ""
                        }]
                    }
                }
            };
        }
        return undefined;
    }

    private fixUnnecessaryModifiers(diagnostic: Diagnostic, document: LangiumDocument): CodeAction | undefined {
        const text = document.textDocument.getText(diagnostic.range);
        if (text) {
            return {
                title: `Remove unnecessary modifier ${text}`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: diagnostic.range,
                            newText: ""
                        }]
                    }
                }
            };
        }
        return undefined;
    }

    private fixInvalidModifierCombination(diagnostic: Diagnostic, document: LangiumDocument): CodeAction | undefined {
        const text = document.textDocument.getText(diagnostic.range);
        if (text) {
            return {
                title: `Remove invalid modifier ${text}`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: diagnostic.range,
                            newText: ""
                        }]
                    }
                }
            };
        }
        return undefined;
    }

    private fixMissingImport(diagnostic: Diagnostic, document: LangiumDocument): CodeAction[] | undefined {
        const possibleImports: string[] = diagnostic.data as string[];
        if (possibleImports.length == 0) {
            return undefined;
        }
        return possibleImports.map(pimport => {
            return ({
                title: `Import ${pimport}`,
                kind: CodeActionKind.QuickFix,
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [document.textDocument.uri]: [{
                            range: {start: {character: 0, line: 0}, end: {character: 0, line: 0}},
                            newText: `import "${pimport}";\n`
                        }]
                    }
                }
            } as CodeAction)
        })
    }

}

/*
function getRelativeImport(source: URI, target: URI): string {
    const sourceDir = Utils.dirname(source);
    let relativePath = relativeURI(sourceDir, target);
    if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
        relativePath = './' + relativePath;
    }
    if (relativePath.endsWith('.langium')) {
        relativePath = relativePath.substring(0, relativePath.length - '.langium'.length);
    }
    return relativePath;
}*/
