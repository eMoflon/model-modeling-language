import {
    AstNode,
    AstNodeDescription,
    DefaultScopeProvider,
    EMPTY_SCOPE,
    getContainerOfType,
    getDocument,
    LangiumDocument,
    ReferenceInfo,
    Scope,
    stream,
    Stream
} from "langium";
import {
    Class,
    Enum,
    EnumValueExpr,
    FunctionAssignment,
    IMacro,
    isAttribute,
    isClass,
    isCReference,
    isEnum,
    isEnumValueExpr,
    isFunctionArgument,
    isFunctionAssignment,
    isFunctionLoop,
    isFunctionMacroCall,
    isFunctionReturn,
    isIFunction,
    isIInstance,
    isIMacro,
    isInstanceLoop,
    isMacroAssignStatement,
    isMacroAttributeStatement,
    isModel,
    isTypedVariable,
    TypedVariable,
    Variable
} from "./generated/ast";
import {URI} from "vscode-uri";
import {ModelModelingLanguageServices} from "./model-modeling-language-module";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils";

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
            let refInstVar;
            if (macroInst.nInst != undefined) {
                //console.log("[MAS] nInst != undefined");
                refInstVar = macroInst.nInst;
            } else if (macroInst.iVar != undefined && macroInst.iVar.ref != undefined) {
                refInstVar = macroInst.iVar.ref;
                //console.log("[MAS] iVar != undefined");
            } else {
                //console.log("[MAS] Wat? both undefined!");
                return EMPTY_SCOPE;
            }
            if (refInstVar.typing.dtype != undefined) {
                //console.log("[MAS] dType != undefined");
                return EMPTY_SCOPE;
            }
            if (refInstVar.typing.type != undefined && refInstVar.typing.type.ref != undefined && isClass(refInstVar.typing.type.ref)) {
                const containerClass: Class = refInstVar.typing.type.ref;
                //console.log(`-> Found container class: ${containerClass.name}`);
                const precomputed = getDocument(containerClass).precomputedScopes;
                //console.log("[MAS] Retrieving precomputed scopes!");
                if (precomputed) {
                    //console.log("[MAS] Retrieved precomputed scopes");
                    const scopes: Array<Stream<AstNodeDescription>> = [];
                    const allDescriptions = precomputed.get(containerClass);
                    if (allDescriptions.length > 0) {
                        //console.log(`[MAS] Found ${allDescriptions.length} descriptions`);
                        scopes.push(stream(allDescriptions).filter(
                            desc => isAttribute(desc.node)));
                    } else {
                        //console.log("[MAS] No descriptions found!!");
                    }
                    let result: Scope = EMPTY_SCOPE;
                    //console.log("[MAS] Building scope!");
                    for (let i = scopes.length - 1; i >= 0; i--) {
                        result = this.createScope(scopes[i], result);
                    }
                    return result;
                }
            }
            console.log(`[getScope] ${context.property} | ${context.index}`)
        } else if (isMacroAssignStatement(context.container)) {
            const attr = context.container;
            const macroInst = attr.$container;
            let refInstVar;
            //console.log(`[MAS] >> ${context.property} <<`);
            if (macroInst.nInst != undefined) {
                //console.log("[MAS] nInst != undefined");
                refInstVar = macroInst.nInst;
            } else if (macroInst.iVar != undefined && macroInst.iVar.ref != undefined) {
                refInstVar = macroInst.iVar.ref;
                //console.log("[MAS] iVar != undefined");
            } else {
                //console.log("[MAS] Wat? both undefined!");
                return EMPTY_SCOPE;
            }
            if (refInstVar.typing.dtype != undefined) {
                //console.log("[MAS] dType != undefined");
                return EMPTY_SCOPE;
            }
            if (refInstVar.typing.type != undefined && refInstVar.typing.type.ref != undefined && isClass(refInstVar.typing.type.ref)) {
                const containerClass: Class = refInstVar.typing.type.ref;
                //console.log(`-> Found container class: ${containerClass.name}`);
                //console.log("[MAS] Retrieving precomputed scopes!");
                const precomputed = getDocument(containerClass).precomputedScopes;
                //console.log("[MAS] Retrieved precomputed scopes");
                const scopes: Array<Stream<AstNodeDescription>> = [];
                if (precomputed) {
                    if (context.property === "cref") {
                        const allDescriptions = precomputed.get(containerClass);
                        if (allDescriptions.length > 0) {
                            //console.log(`[MAS] Found ${allDescriptions.length} descriptions`);
                            scopes.push(stream(allDescriptions).filter(
                                desc => isCReference(desc.node)));
                        } else {
                            //console.log("[MAS] No descriptions found!!");
                        }
                    } else if (context.property === "instance") {
                        const iMacro: IMacro = macroInst.$container;
                        const allDescriptions = precomputed.get(iMacro);
                        if (allDescriptions.length > 0) {
                            //console.log(`[MAS] Found ${allDescriptions.length} descriptions`);
                            scopes.push(stream(allDescriptions).filter(
                                desc => isTypedVariable(desc.node)));
                        } else {
                            //console.log("[MAS] No descriptions found!!");
                        }
                        scopes.push(stream(iMacro.instances).filter(e => e != undefined && e.nInst != undefined && e.iVar == undefined).map(e => e.nInst as TypedVariable).map(v => {
                            if (v != undefined) {
                                const name = this.nameProvider.getName(v);
                                if (name != undefined) {
                                    return this.descriptions.createDescription(v, name);
                                }
                            }
                            return undefined;
                        }).filter(d => d != undefined) as Stream<AstNodeDescription>);
                    }
                }
                let result = EMPTY_SCOPE;
                //console.log("[MAS] Building scope!");
                for (let i = scopes.length - 1; i >= 0; i--) {
                    result = this.createScope(scopes[i], result);
                }
                return result;
            }
            //console.log(`[getScope] ${context.property} | ${context.index}`)
        } else if (isFunctionAssignment(context.container)) {
            const assgnmt = context.container;
            if (isFunctionMacroCall(assgnmt.call)) {
                const mcrCll = assgnmt.call;
                const scopes: Array<Stream<AstNodeDescription>> = [];
                if (mcrCll.macro.ref != undefined) {
                    const mcr = mcrCll.macro.ref;
                    if (context.property === "select") {
                        scopes.push(stream(mcr.instances).map(
                            inst => {
                                if (inst.nInst != undefined && inst.iVar == undefined) {
                                    return inst.nInst;
                                } else if (inst.nInst == undefined && inst.iVar != undefined && inst.iVar.ref != undefined) {
                                    return inst.iVar.ref;
                                }
                                return undefined;
                            }
                        ).map(v => {
                            if (v != undefined) {
                                const name = this.nameProvider.getName(v);
                                if (name != undefined) {
                                    return this.descriptions.createDescription(v, name);
                                }
                            }
                            return undefined;
                        }).filter(d => d != undefined) as Stream<AstNodeDescription>);
                    }
                }
                let result = EMPTY_SCOPE;
                for (let i = scopes.length - 1; i >= 0; i--) {
                    result = this.createScope(scopes[i], result);
                }
                return result;
            }
        } else if (isInstanceLoop(context.container)) {
            const instLoop = context.container;
            if (context.property === "var") {
                const scopes: Array<Stream<AstNodeDescription>> = [];
                const inst = context.container.$container;
                scopes.push(stream(inst.statements).filter(x => isFunctionAssignment(x)).map(x => (x as FunctionAssignment).var).map(v => {
                    if (v != undefined) {
                        const name = this.nameProvider.getName(v);
                        if (name != undefined) {
                            return this.descriptions.createDescription(v, name);
                        }
                    }
                    return undefined;
                }).filter(d => d != undefined) as Stream<AstNodeDescription>);
                let result = EMPTY_SCOPE;
                for (let i = scopes.length - 1; i >= 0; i--) {
                    result = this.createScope(scopes[i], result);
                }
                return result;
            } else if (context.property === "ref") {
                const scopes: Array<Stream<AstNodeDescription>> = [];
                if (instLoop.var.ref != undefined && instLoop.var.ref.typing.type != undefined && instLoop.var.ref.typing.type.ref != undefined && isClass(instLoop.var.ref.typing.type.ref)) {
                    const sourceClass = instLoop.var.ref.typing.type.ref;
                    scopes.push(stream(sourceClass.body).filter(x => isCReference(x)).map(v => {
                        if (v != undefined) {
                            const name = this.nameProvider.getName(v);
                            if (name != undefined) {
                                return this.descriptions.createDescription(v, name);
                            }
                        }
                        return undefined;
                    }).filter(d => d != undefined) as Stream<AstNodeDescription>);
                }
                let result = EMPTY_SCOPE;
                for (let i = scopes.length - 1; i >= 0; i--) {
                    result = this.createScope(scopes[i], result);
                }
                return result;
            }
        } else if (isFunctionReturn(context.container)) {
            if (context.property === "var") {
                const scopes: Array<Stream<AstNodeDescription>> = [];
                scopes.push(stream(this.getLocalInstanceVariablesInScope(context.container).map(v => {
                    if (v != undefined) {
                        const name = this.nameProvider.getName(v);
                        if (name != undefined) {
                            return this.descriptions.createDescription(v, name);
                        }
                    }
                    return undefined;
                })).filter(d => d != undefined) as Stream<AstNodeDescription>);
                let result = EMPTY_SCOPE;
                for (let i = scopes.length - 1; i >= 0; i--) {
                    result = this.createScope(scopes[i], result);
                }
                return result;
            }
        } else if (isFunctionArgument(context.container)) {
            if (context.property === "ref") {
                const scopes: Array<Stream<AstNodeDescription>> = [];
                scopes.push(stream(this.getLocalInstanceVariablesInScope(context.container).map(v => {
                    if (v != undefined) {
                        const name = this.nameProvider.getName(v);
                        if (name != undefined) {
                            return this.descriptions.createDescription(v, name);
                        }
                    }
                    return undefined;
                })).filter(d => d != undefined) as Stream<AstNodeDescription>);
                let result = EMPTY_SCOPE;
                for (let i = scopes.length - 1; i >= 0; i--) {
                    result = this.createScope(scopes[i], result);
                }
                return result;
            }
        } else if (isEnumValueExpr(context.container)) {
            console.log(`[EVExp] isEnumValue | ${context.property}`);
            if (context.property === "val") {
                console.log("[EVExp] isVal");
                const containerEnum: Enum | undefined = this._getEnumEntryValueType(context.container, context);
                console.log(`[EVExp] > ${containerEnum == undefined ? "undefined" : containerEnum.name}`);
                const scopes: Array<Stream<AstNodeDescription>> = [];
                if (containerEnum != undefined) {
                    console.log(`[EVExp] >> ${containerEnum.entries.map(e => e.name).join(",")}`);
                    scopes.push(stream(containerEnum.entries.map(v => {
                        if (v != undefined) {
                            console.log(`[EVExp] |> ${v.name}`);
                            const name = ModelModelingLanguageUtils.getFullyQualifiedEnumEntryName(v, v.name);
                            if (name != undefined) {
                                console.log(`[EVExp] |>|> ${name}`);
                                return this.descriptions.createDescription(v, name);
                            }
                        }
                        return undefined;
                    })).filter(d => d != undefined) as Stream<AstNodeDescription>);
                }
                let result = EMPTY_SCOPE;
                for (let i = scopes.length - 1; i >= 0; i--) {
                    result = this.createScope(scopes[i], result);
                }
                return result;
            }
        }
        console.log("[GetScope] Return super scope");
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


        const globalScope: Scope = super.getGlobalScope(referenceType, _context);

        const aliasDescriptions: AstNodeDescription[] = [];
        modl.imports.forEach(ip => {
            const importUri = URI.parse(ip.target);
            ip.aliases.forEach(ipa => {
                globalScope.getAllElements()
                    .filter(x => x.name == ipa.ref.$refText || x.name.startsWith(ipa.ref.$refText))
                    .filter(astNodeDesc => astNodeDesc.documentUri.path == importUri.path)
                    .forEach(targetAstNodeDescription => {
                        if (targetAstNodeDescription != undefined) {
                            const targetAstNode = this.getAstNodeByPath(targetAstNodeDescription);
                            if (targetAstNode != null) {
                                const updatedName = targetAstNodeDescription.name.replace(ipa.ref.$refText, ipa.alias);
                                aliasDescriptions.push(this.descriptions.createDescription(targetAstNode, updatedName));
                            } else {
                                console.warn(`[AliasResolution] TargetAstNode is null!`)
                            }
                        } else {
                            console.warn(`[AliasResolution] Could not resolve ${ipa.ref.$refText}!`)
                        }
                    });
            })
        })

        return this.createScope(aliasDescriptions, globalScope);
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
        if (node == undefined) {
            return scopedInstanceVariables;
        }
        if (!(isIFunction(node) || isIMacro(node) || isIInstance(node))) {
            if (node.$container == undefined) {
                return scopedInstanceVariables;
            } else {
                if (isFunctionLoop(node)) {
                    node.statements.forEach((statement, idx) => {
                        if (containerIdx == undefined || containerIdx < idx) {
                            if (isFunctionAssignment(statement)) {
                                scopedInstanceVariables.push(statement.var);
                            }
                        }
                    });
                    scopedInstanceVariables.push(node.var);
                } else if (isInstanceLoop(node)) {
                    node.statements.forEach((statement, idx) => {
                        if (containerIdx == undefined || containerIdx < idx) {
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
                if (containerIdx == undefined || idx < containerIdx) {
                    if (isFunctionAssignment(statement)) {
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
                if (nodeByPath != undefined && isEnum(nodeByPath)){
                    return nodeByPath;
                }
            }
        }
        return undefined;

        /* console.log("[EnumTypeResolution] Fallback to default")
         if (isAttribute(node.$container)) {
             if (node.$container.type.etype != undefined && node.$container.type.etype.ref != undefined) {
                 return node.$container.type.etype.ref;
             }
             return undefined;
         } else if (isMacroAttributeStatement(node.$container)) {
             if (node.$container.attr.ref != undefined && node.$container.attr.ref.type.etype != undefined && node.$container.attr.ref.type.etype.ref != undefined) {
                 return node.$container.attr.ref.type.etype.ref;
             }
             return undefined;
         } else if (isFunctionArgument(node.$container)) {
             if (isFunctionCall(node.$container.$container)) {
                 if (node.$container.$container.func.ref != undefined && node.$container.$containerIndex != undefined && node.$container.$container.func.ref.parameter.length >= node.$container.$containerIndex) {
                     const funcParamTypedVarRef: TypedVariable | undefined = node.$container.$container.func.ref.parameter.at(node.$container.$containerIndex);
                     if (funcParamTypedVarRef != undefined && funcParamTypedVarRef.typing.type != undefined && funcParamTypedVarRef.typing.type.ref != undefined && isEnum(funcParamTypedVarRef.typing.type.ref)) {
                         return funcParamTypedVarRef.typing.type.ref;
                     }
                 }
             } else if (isFunctionMacroCall(node.$container.$container)) {
                 if (node.$container.$container.macro.ref != undefined && node.$container.$containerIndex != undefined && node.$container.$container.macro.ref.parameter.length >= node.$container.$containerIndex) {
                     const macroParamTypedVarRef: TypedVariable | undefined = node.$container.$container.macro.ref.parameter.at(node.$container.$containerIndex);
                     if (macroParamTypedVarRef != undefined && macroParamTypedVarRef.typing.type != undefined && macroParamTypedVarRef.typing.type.ref != undefined && isEnum(macroParamTypedVarRef.typing.type.ref)) {
                         return macroParamTypedVarRef.typing.type.ref;
                     }
                 }
             }
             return undefined;
         } else if (isImplicitlyTypedValue(node.$container)) {
             if (node.$container.$container.var != undefined && node.$container.$container.var.ref != undefined && node.$container.$container.var.ref.typing.type != undefined && node.$container.$container.var.ref.typing.type.ref != undefined && isEnum(node.$container.$container.var.ref.typing.type.ref)) {
                 return node.$container.$container.var.ref.typing.type.ref;
             }
             return undefined;
         } else if (node.$container == undefined) {
             return undefined;
         } else {
             return this._getEnumEntryValueType(node.$container);
         }*/
    }
}