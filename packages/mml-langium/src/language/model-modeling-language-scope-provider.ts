import {
    AstNode,
    AstNodeDescription,
    DefaultScopeProvider,
    EMPTY_SCOPE,
    getContainerOfType,
    getDocument,
    LangiumDocument,
    MapScope,
    ReferenceInfo,
    Scope,
    Stream,
    URI,
    UriUtils
} from "langium";
import {
    Class,
    Enum,
    EnumValueExpr,
    FunctionAssignment,
    FunctionMacroCall,
    FunctionVariable,
    IMacro,
    Import,
    isClass,
    isEnum,
    isEnumValueExpr,
    isFunctionArgument,
    isFunctionAssignment,
    isFunctionLoop,
    isFunctionMacroCall,
    isFunctionReturn,
    isFunctionVariable,
    isIFunction,
    isIInstance,
    isIMacro,
    isImportAlias,
    isInstanceLoop,
    isMacroAssignStatement,
    isMacroAttributeStatement,
    isModel,
    isQualifiedValueExpr,
    TypedVariable,
    Variable
} from "./generated/ast.js";
import {ModelModelingLanguageServices} from "./model-modeling-language-module.js";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils.js";
import {ScopingUtils} from "./scoping-utils.js";

/**
 * The ScopeProvider searches scopes and is used to calculate custom scopes for individual
 * parameters that are not covered by the standard scoper.
 */
export class ModelModelingLanguageScopeProvider extends DefaultScopeProvider {
    services: ModelModelingLanguageServices;

    constructor(services: ModelModelingLanguageServices) {
        super(services);
        this.services = services;
    }


    override getScope(context: ReferenceInfo): Scope {
        if (isMacroAttributeStatement(context.container)) {
            const attr = context.container;
            const macroInst = attr.$container;
            let refInstVar: TypedVariable;
            if (macroInst.nInst != undefined) {
                refInstVar = macroInst.nInst;
            } else if (macroInst.iVar != undefined && macroInst.iVar.ref != undefined) {
                refInstVar = macroInst.iVar.ref;
            } else {
                return EMPTY_SCOPE;
            }
            if (refInstVar.typing.dtype != undefined) {
                return EMPTY_SCOPE;
            }
            if (refInstVar.typing.type != undefined && refInstVar.typing.type.ref != undefined && isClass(refInstVar.typing.type.ref)) {
                const containerClass: Class = refInstVar.typing.type.ref;
                return ScopingUtils.computeCustomScope(ScopingUtils.getAllInheritedAttributes(containerClass), this.descriptions, (x) => this.nameProvider.getName(x), x => x, this.createScope);
            }
            //console.log(`[getScope] ${context.property} | ${context.index}`)
        } else if (isMacroAssignStatement(context.container)) {
            const attr = context.container;
            const macroInst = attr.$container;
            let refInstVar;
            if (macroInst.nInst != undefined) {
                refInstVar = macroInst.nInst;
            } else if (macroInst.iVar != undefined && macroInst.iVar.ref != undefined) {
                refInstVar = macroInst.iVar.ref;
            } else {
                return EMPTY_SCOPE;
            }
            if (refInstVar.typing.dtype != undefined) {
                return EMPTY_SCOPE;
            }
            if (refInstVar.typing.type != undefined && refInstVar.typing.type.ref != undefined && isClass(refInstVar.typing.type.ref)) {
                const containerClass: Class = refInstVar.typing.type.ref;
                const scopes: Array<Stream<AstNodeDescription>> = [];
                if (context.property === "cref") {
                    scopes.push(ScopingUtils.createScopeElementStream(ScopingUtils.getAllInheritedReferences(containerClass), this.descriptions, x => this.nameProvider.getName(x), x => x));
                } else if (context.property === "instance") {
                    scopes.push(ScopingUtils.createScopeElementStream(macroInst.$container.instances.filter(inst => inst.nInst != undefined && inst.iVar == undefined).map(x => x.nInst), this.descriptions, x => this.nameProvider.getName(x), x => x));
                    scopes.push(ScopingUtils.createScopeElementStream(macroInst.$container.parameter, this.descriptions, x => this.nameProvider.getName(x), x => x));
                }
                return ScopingUtils.buildScopeFromAstNodeDesc(scopes, this.createScope);
            }
        } else if (isFunctionAssignment(context.container)) {
            const assgnmt = context.container;
            if (isFunctionMacroCall(assgnmt.call)) {
                const mcrCll = assgnmt.call;
                if (mcrCll.macro.ref != undefined) {
                    const mcr = mcrCll.macro.ref;
                    if (context.property === "select") {
                        return ScopingUtils.computeCustomScope(mcr.instances.map(
                            inst => {
                                if (inst.nInst != undefined && inst.iVar == undefined) {
                                    return inst.nInst;
                                } else if (inst.nInst == undefined && inst.iVar != undefined && inst.iVar.ref != undefined) {
                                    return inst.iVar.ref;
                                }
                                return undefined;
                            }
                        ), this.descriptions, (x) => this.nameProvider.getName(x), x => x, this.createScope);
                    }
                }
                return EMPTY_SCOPE;
            }
        } else if (isInstanceLoop(context.container)) {
            const instLoop = context.container;
            if (context.property === "var") {
                const inst = context.container.$container;
                return ScopingUtils.computeCustomScope(inst.statements.filter(x => isFunctionAssignment(x)).map(x => (x as FunctionAssignment).var), this.descriptions, x => this.nameProvider.getName(x), x => x, this.createScope);
            } else if (context.property === "ref") {
                if (instLoop.var.ref != undefined && instLoop.var.ref.typing.type != undefined && instLoop.var.ref.typing.type.ref != undefined && isClass(instLoop.var.ref.typing.type.ref)) {
                    const sourceClass = instLoop.var.ref.typing.type.ref;
                    return ScopingUtils.computeCustomScope(ScopingUtils.getAllInheritedReferences(sourceClass), this.descriptions, x => this.nameProvider.getName(x), x => x, this.createScope);
                }
                return EMPTY_SCOPE;
            }
        } else if (isFunctionReturn(context.container)) {
            if (context.property === "var") {
                return ScopingUtils.computeCustomScope(this.getLocalInstanceVariablesInScope(context.container), this.descriptions, x => this.nameProvider.getName(x), x => x, this.createScope);
            }
        } else if (isFunctionArgument(context.container)) {
            if (context.property === "ref") {
                return ScopingUtils.computeCustomScope(this.getLocalInstanceVariablesInScope(context.container), this.descriptions, x => this.nameProvider.getName(x), x => x, this.createScope);
            }
        } else if (isEnumValueExpr(context.container)) {
            //console.log(`[EVExp] isEnumValue | ${context.property}`);
            if (context.property === "val") {
                //console.log("[EVExp] isVal");
                const containerEnum: Enum | undefined = this._getEnumEntryValueType(context.container, context);
                //console.log(`[EVExp] > ${containerEnum == undefined ? "undefined" : containerEnum.name}`);
                if (containerEnum != undefined) {
                    //console.log(`[EVExp] >> ${containerEnum.entries.map(e => e.name).join(",")}`);
                    return ScopingUtils.computeCustomScope(containerEnum.entries, this.descriptions, x => ModelModelingLanguageUtils.getFullyQualifiedEnumEntryName(x, x.name), x => x, this.createScope);
                }
                return EMPTY_SCOPE;
            }
        } else if (isQualifiedValueExpr(context.container)) {
            //console.log(`[FSelExprEval] isFunctionArgument | ${context.property}`);
            if (context.property === "val") {
                //console.log("[FSelExprEval] isSelectedRef");
                const scopes: Array<Stream<AstNodeDescription>> = [];
                const functionVarsInScope: FunctionVariable[] = this.getLocalInstanceVariablesInScope(context.container).filter(x => isFunctionVariable(x)).map(x => x as FunctionVariable);
                //console.log(`[FSelExprEval] VarsInScope: ${functionVarsInScope.map(x => x.name).join(", ")}`);
                functionVarsInScope.forEach(fVar => {
                    const availableSelectors: TypedVariable[] | undefined = this.getAvailableFunctionVariablesSelectors(fVar);
                    if (availableSelectors != undefined) {
                        //console.log(`[FSelExprEval] Selectors (-> ${fVar.name}): ${availableSelectors.map(x => x.name).join(", ")}`);
                        scopes.push(ScopingUtils.createScopeElementStream(availableSelectors, this.descriptions, x => fVar.name + "." + x.name, x => x));
                    }
                });
                return ScopingUtils.buildScopeFromAstNodeDesc(scopes, this.createScope);
            }
        } else if (isImportAlias(context.container)) {
            if (context.property === "ref") {
                const iprt: Import = context.container.$container;
                const localDocumentUri: URI = getDocument(iprt).uri;
                const importedDocURI: URI | undefined = ModelModelingLanguageUtils.resolveRelativeModelImport(iprt.target, localDocumentUri);
                if (importedDocURI != undefined) {
                    return new MapScope(this.indexManager.allElements("Package", new Set([importedDocURI.toString()])));
                }
                return EMPTY_SCOPE;
            }
        }
        //console.log(`[GetScope] Return super scope [Container: ${context.container.$type} (${context.container.$cstNode?.range.start.line})]`);
        return super.getScope(context);
    }

    protected override getGlobalScope(referenceType: string, _context: ReferenceInfo): Scope {
        const modl = getContainerOfType(_context.container, isModel);
        if (!modl) {
            return super.getGlobalScope(referenceType, _context);
        }

        if (isMacroAttributeStatement(_context.container)) {
            console.log(`[MacroInstanceGlobalScope] ${referenceType} | ${_context.container.$type} | ${_context.property}`);
        }


        const localDocumentUri: URI = getDocument(modl).uri;
        const localUriSet: Set<string> = new Set([localDocumentUri.toString()]);
        const mappedRelativeUris: Map<string, URI | undefined> = new Map(modl.imports.filter(ip => ip.aliases.length == 0).map(ip => [ip.target, ModelModelingLanguageUtils.resolveRelativeModelImport(ip.target, localDocumentUri)]));
        const mappedAliasedRelativeUris: Map<string, URI | undefined> = new Map(modl.imports.filter(ip => ip.aliases.length > 0).map(ip => [ip.target, ModelModelingLanguageUtils.resolveRelativeModelImport(ip.target, localDocumentUri)]));
        const importedUris: URI[] = [...mappedRelativeUris.values()].filter(x => x != undefined).map(x => x as URI);
        const importedAliasedUris: URI[] = [...mappedAliasedRelativeUris.values()].filter(x => x != undefined).map(x => x as URI);
        const importedUriSet: Set<string> = new Set(importedUris.map(x => x.toString()));
        const importedAliasedUriSet: Set<string> = new Set(importedAliasedUris.map(x => x.toString()));
        const localDocScope: Scope = new MapScope(this.indexManager.allElements(referenceType, localUriSet));
        const importedDocScope: Scope = new MapScope(this.indexManager.allElements(referenceType, importedUriSet));
        const importedAliasedDocScope: Scope = new MapScope(this.indexManager.allElements(referenceType, importedAliasedUriSet));

        const aliasDescriptions: AstNodeDescription[] = [];

        const aliasMap: Map<string, Import> = new Map(modl.imports.filter(ip => ip.aliases.length > 0).map(ip => [ModelModelingLanguageUtils.resolveRelativeModelImport(ip.target, localDocumentUri)!.toString(), ip]));


        importedAliasedDocScope.getAllElements().forEach(nodeDesc => {
            const ip: Import | undefined = aliasMap.get(nodeDesc.documentUri.toString());
            if (ip != undefined) {
                ip.aliases.forEach(alias => {
                    if (nodeDesc.name == alias.ref.$refText || nodeDesc.name.startsWith(alias.ref.$refText)) {
                        const targetAstNode = this.getAstNodeByPath(nodeDesc);
                        if (targetAstNode != null) {
                            const updatedName = nodeDesc.name.replace(alias.ref.$refText, alias.alias);
                            aliasDescriptions.push(this.descriptions.createDescription(targetAstNode, updatedName));
                        } else {
                            console.warn(`[AliasResolution] TargetAstNode is null!`)
                        }
                    }
                });
            } else {
                console.warn(`[AliasResolution] Could not determine correct import for ${nodeDesc.documentUri.toString()}!`)
            }
        });

        const importedScope: AstNodeDescription[] = [...aliasDescriptions, ...importedDocScope.getAllElements()];

        return this.createScope(importedScope, localDocScope)
    }

    getAvailableFunctionVariablesSelectors(fvar: FunctionVariable): TypedVariable[] | undefined {
        if (isFunctionAssignment(fvar.$container)) {
            const assignment: FunctionAssignment = fvar.$container;
            if (isFunctionMacroCall(assignment.call)) {
                const calledMacro: FunctionMacroCall = assignment.call;
                if (calledMacro.macro.ref != undefined) {
                    const macro: IMacro = calledMacro.macro.ref;
                    return macro.instances.map(x => {
                        if (x.nInst != undefined && x.iVar == undefined) {
                            return x.nInst;
                        } else if (x.nInst == undefined && x.iVar != undefined && x.iVar.ref != undefined) {
                            return x.iVar.ref;
                        } else {
                            throw new Error("Invalid function call assignment");
                        }
                    })
                }
            }
        }
        return undefined;
    }

    getAstNodeByPath(nodeDescription: AstNodeDescription): AstNode | undefined {
        const targetDocUri: URI = nodeDescription.documentUri;
        if (!this.services.shared.workspace.LangiumDocuments.hasDocument(targetDocUri)) {
            console.error("This document is not managed by langium services!")
            return undefined;
        }
        const targetDoc: LangiumDocument = this.services.shared.workspace.LangiumDocuments.getOrCreateDocument(targetDocUri);
        return this.services.workspace.AstNodeLocator.getAstNode(targetDoc.parseResult.value, nodeDescription.path);
    }

    getLocalInstanceVariablesInScope(node: AstNode): Variable[] {
        return this._getLocalInstanceVariables(node, undefined)
    }

    private _getLocalInstanceVariables(node: AstNode, containerIdx: number | undefined): Variable[] {
        let scopedInstanceVariables: Variable[] = [];
        //console.log(`[GETLOCALINSTVARS] Entry -> ${node.$type} (${node.$cstNode?.range.start.line})`)
        if (node == undefined) {
            return scopedInstanceVariables;
        }
        if (!(isIFunction(node) || isIMacro(node) || isIInstance(node))) {
            if (node.$container == undefined) {
                return scopedInstanceVariables;
            } else {
                if (isFunctionLoop(node)) {
                    node.statements.forEach((statement, idx) => {
                        //console.log(`[GETLOCALINSTVARS] FunctionLoop >> ${statement.$type} [${idx}/${containerIdx}]`)
                        if (containerIdx == undefined || idx < containerIdx) {
                            if (isFunctionAssignment(statement)) {
                                //console.log(`[GETLOCALINSTVARS] FunctionLoop >>> ${statement.var.name} `)
                                scopedInstanceVariables.push(statement.var);
                            }
                        }
                    });
                    scopedInstanceVariables.push(node.var);
                } else if (isInstanceLoop(node)) {
                    node.statements.forEach((statement, idx) => {
                        if (containerIdx == undefined || idx < containerIdx) {
                            if (isFunctionAssignment(statement)) {
                                scopedInstanceVariables.push(statement.var);
                            }
                        }
                    });
                    scopedInstanceVariables.push(node.ivar);
                }
                scopedInstanceVariables.push(...this._getLocalInstanceVariables(node.$container, node.$containerIndex));
            }
        }

        if (isIFunction(node)) {
            node.statements.forEach((statement, idx) => {
                //console.log(`[GETLOCALINSTVARS] IFunction >> ${statement.$type} `)
                if (containerIdx == undefined || idx < containerIdx) {
                    if (isFunctionAssignment(statement)) {
                        //console.log(`[GETLOCALINSTVARS] IFunction >>> ${statement.var.name} `)
                        scopedInstanceVariables.push(statement.var);
                    }
                }
            });
            scopedInstanceVariables.push(...node.parameter);
        } else if (isIMacro(node)) {
            node.instances.forEach((instance, idx) => {
                if (containerIdx == undefined || idx < containerIdx) {
                    if (instance.nInst != undefined) {
                        scopedInstanceVariables.push(instance.nInst);
                    }
                }
            });
            scopedInstanceVariables.push(...node.parameter);
        } else if (isIInstance(node)) {
            node.statements.forEach((statement, idx) => {
                if (containerIdx == undefined || idx < containerIdx) {
                    if (isFunctionAssignment(statement)) {
                        scopedInstanceVariables.push(statement.var);
                    }
                }
            });
        }
        return scopedInstanceVariables;
    }

    private _getEnumEntryValueType(node: EnumValueExpr, context: ReferenceInfo): Enum | undefined {
        const globalScope = this.getGlobalScope("Enum", context);
        const targetEnum = ModelModelingLanguageUtils.getEnumValueExprEnumName(node);
        if (targetEnum != undefined) {
            const res = globalScope.getElement(targetEnum);
            if (res != undefined && res.node != undefined && isEnum(res.node)) {
                return res.node;
            }
            if (res != undefined) {
                const nodeByPath = this.getAstNodeByPath(res);
                if (nodeByPath != undefined && isEnum(nodeByPath)) {
                    return nodeByPath;
                }
            }
        }
        return undefined;
    }

    public getScopeFixingUris(referenceType: string, referenceName: string, parentDir: URI, excludedUris: Set<string>): string[] {
        const possibleDocs: Set<string> = new Set([...this.services.shared.workspace.LangiumDocuments.all.filter(x => !excludedUris.has(x.uri.toString())).map(x => x.uri.toString())]);
        const importableUris: string[] = [];
        for (const element of this.indexManager.allElements(referenceType, possibleDocs)) {
            if (element.name == referenceName) {
                importableUris.push(UriUtils.relative(parentDir, element.documentUri));
            }
        }
        return importableUris;
    }
}