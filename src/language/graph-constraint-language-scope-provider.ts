import {
    AstNodeDescription,
    DefaultScopeProvider,
    EMPTY_SCOPE,
    getContainerOfType,
    getDocument,
    MapScope,
    ReferenceInfo,
    Scope,
    Stream,
    URI
} from "langium";
import {
    AbstractElement,
    Attribute,
    Class,
    CReference,
    EnforceAnnotation,
    FixCreateNodeStatement,
    ForbidAnnotation,
    Interface,
    isAttribute,
    isClass,
    isCompactBindingStatement,
    isConstraintAssertion,
    isConstraintDocument,
    isConstraintPatternDeclaration,
    isCreateNodeAttributeAssignment,
    isCReference,
    isEnumValueExpr,
    isFixCreateEdgeStatement,
    isFixCreateNodeStatement,
    isFixDeleteEdgeStatement,
    isFixDeleteNodeStatement,
    isFixSetStatement,
    isInterface,
    isNodeConstraintAnnotation,
    isPattern,
    isPatternAttributeConstraint,
    isPatternObjectReference,
    isQualifiedValueExpr,
    isVariableValueExpr,
    Pattern,
    PatternObject,
    TypedVariable,
    UntypedVariable
} from "./generated/ast.js";
import {GraphConstraintLanguageServices} from "./graph-constraint-language-module.js";
import {ScopingUtils} from "./scoping-utils.js";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils.js";
import {ExprUtils} from "./expr-utils.js";

/**
 * The ScopeProvider searches scopes and is used to calculate custom scopes for individual
 * parameters that are not covered by the standard scoper.
 */
export class GraphConstraintLanguageScopeProvider extends DefaultScopeProvider {
    services: GraphConstraintLanguageServices;

    constructor(services: GraphConstraintLanguageServices) {
        super(services);
        this.services = services;
    }


    override getScope(context: ReferenceInfo): Scope {
        if (isCompactBindingStatement(context.container)) {
            let validPatternObjects: Array<PatternObject> = [];
            const annotation: EnforceAnnotation | ForbidAnnotation = context.container.$container;
            if (context.property === "selfVar" && isPattern(annotation.$container)) {
                const annotatedPattern: Pattern = annotation.$container;
                validPatternObjects = annotatedPattern.objs;
            } else if (context.property === "otherVar") {
                if (annotation.pattern != undefined && annotation.pattern.ref != undefined) {
                    const referencesPattern: Pattern | undefined = annotation.pattern.ref;
                    validPatternObjects = referencesPattern.objs;
                }
            }
            return ScopingUtils.computeCustomScope(validPatternObjects, this.descriptions, x => x.var.name, x => x.var, this.createScope);
        } else if (isPatternObjectReference(context.container)) {
            const scopes: Array<Stream<AstNodeDescription>> = [];
            const patternObj: PatternObject = context.container.$container;
            if (context.property === "ref") {
                if (patternObj.var.typing.type != undefined && patternObj.var.typing.type.ref != undefined) {
                    const abstractEl: AbstractElement = patternObj.var.typing.type.ref;
                    if (isClass(abstractEl) || isInterface(abstractEl)) {
                        scopes.push(ScopingUtils.createScopeElementStream(ScopingUtils.getAllInheritedReferences(abstractEl), this.descriptions, x => x.name, x => x));
                    }
                }
            } else if (context.property === "patternObj") {
                const pattern: Pattern = patternObj.$container;
                scopes.push(ScopingUtils.createScopeElementStream(pattern.objs, this.descriptions, x => x.var.name, x => x.var));
            }
            return ScopingUtils.buildScopeFromAstNodeDesc(scopes, this.createScope);
        } else if (isQualifiedValueExpr(context.container)) {
            const scopes: Array<Stream<AstNodeDescription>> = [];
            const exprContainer = ExprUtils.getExprContainer(context.container);
            if (isPatternAttributeConstraint(exprContainer) && isPattern(exprContainer.$container)) {
                const pattern: Pattern = exprContainer.$container;
                if (context.property === "val") {
                    pattern.objs.forEach(patternObject => {
                        const abstractEl: AbstractElement | undefined = patternObject.var.typing.type?.ref;
                        if (abstractEl != undefined && (isClass(abstractEl) || isInterface(abstractEl))) {
                            scopes.push(ScopingUtils.createScopeElementStream(ScopingUtils.getAllInheritedAttributes(abstractEl), this.descriptions, x => `${patternObject.var.name}.${x.name}`, x => x));
                        }
                    });
                }
            }
            return ScopingUtils.buildScopeFromAstNodeDesc(scopes, this.createScope);
        } else if (isEnumValueExpr(context.container)) {
            return this.getGlobalScope("EnumEntry", context);
        } else if (isNodeConstraintAnnotation(context.container) && isPattern(context.container.$container)) {
            const patternObjs: PatternObject[] = context.container.$container.objs;
            return ScopingUtils.computeCustomScope(patternObjs, this.descriptions, x => x.var.name, x => x.var, this.createScope);
        } else if (isConstraintPatternDeclaration(context.container)) {
            const pattern: Pattern[] = context.container.$container.$container.patterns;
            return ScopingUtils.computeCustomScope(pattern, this.descriptions, x => x.name, x => x, this.createScope);
        } else if (isVariableValueExpr(context.container)) {
            const scopes: Array<Stream<AstNodeDescription>> = [];
            const exprContainer = ExprUtils.getExprContainer(context.container);
            if (isConstraintAssertion(exprContainer)) {
                const patternDeclarations: UntypedVariable[] = exprContainer.$container.patternDeclarations.flatMap(x => x.var);
                scopes.push(ScopingUtils.createScopeElementStream(patternDeclarations, this.descriptions, x => x.name, x => x));
            }
            return ScopingUtils.buildScopeFromAstNodeDesc(scopes, this.createScope);
        } else if (isFixSetStatement(context.container)) {
            const patternDeclaration = context.container.$container.$container;
            const scopes: Array<Stream<AstNodeDescription>> = [];
            if (patternDeclaration.pattern.ref != undefined) {
                if (context.property == "attr") {
                    const pattern = patternDeclaration.pattern.ref;
                    pattern.objs.forEach(obj => {
                        const refClass: AbstractElement | undefined = obj.var.typing.type?.ref;
                        if (refClass != undefined && (isClass(refClass) || isInterface(refClass))) {
                            const attrs: Attribute[] = refClass.body.filter(x => isAttribute(x)).map(x => x as Attribute);
                            scopes.push(ScopingUtils.createScopeElementStream(attrs, this.descriptions, x => obj.var.name + "." + x.name, x => x));
                        }
                    })
                }
            }
            return ScopingUtils.buildScopeFromAstNodeDesc(scopes, this.createScope);
        } else if (isFixDeleteNodeStatement(context.container)) {
            const patternDeclaration = context.container.$container.$container;
            if (patternDeclaration.pattern.ref != undefined) {
                const pattern = patternDeclaration.pattern.ref;
                if (context.property == 'node') {
                    return ScopingUtils.computeCustomScope(pattern.objs, this.descriptions, x => x.var.name, x => x.var, this.createScope);
                }
            }
            return EMPTY_SCOPE;
        } else if (isFixDeleteEdgeStatement(context.container)) {
            const patternDeclaration = context.container.$container.$container;

            if (patternDeclaration.pattern.ref != undefined) {
                const pattern = patternDeclaration.pattern.ref;
                if (context.property == 'edge') {
                    const aliasedEdges = pattern.objs.flatMap(x => x.connections).filter(x => x.alias != undefined);
                    return ScopingUtils.computeCustomScope(aliasedEdges, this.descriptions, x => x.alias, x => x, this.createScope);
                }
            }
            return EMPTY_SCOPE;
        } else if (isFixCreateEdgeStatement(context.container)) {
            const patternDeclaration = context.container.$container.$container;

            if (patternDeclaration.pattern.ref != undefined) {
                const pattern = patternDeclaration.pattern.ref;
                if (context.property == 'fromNode') {
                    const patternObjVars: TypedVariable[] = pattern.objs.map(x => x.var);
                    const createdNodeVars: TypedVariable[] = context.container.$container.fixStatements.filter(x => isFixCreateNodeStatement(x)).map(x => (x as FixCreateNodeStatement).nodeVar);
                    const varsInScope: TypedVariable[] = patternObjVars.concat(createdNodeVars);
                    return ScopingUtils.computeCustomScope(varsInScope, this.descriptions, x => x.name, x => x, this.createScope);
                } else if (context.property == 'toNode') {
                    const patternObjVars: TypedVariable[] = pattern.objs.map(x => x.var);
                    const createdNodeVars: TypedVariable[] = context.container.$container.fixStatements.filter(x => isFixCreateNodeStatement(x)).map(x => (x as FixCreateNodeStatement).nodeVar);
                    const varsInScope: TypedVariable[] = patternObjVars.concat(createdNodeVars);
                    return ScopingUtils.computeCustomScope(varsInScope, this.descriptions, x => x.name, x => x, this.createScope);
                } else if (context.property == 'reference' && context.container.fromNode.ref != undefined) {
                    const outgoingNode: PatternObject = context.container.fromNode.ref.$container as PatternObject;
                    if (outgoingNode.var.typing.type != undefined && outgoingNode.var.typing.type.ref != undefined) {
                        const outgoingTypeAbstractElement: AbstractElement = outgoingNode.var.typing.type.ref;
                        if (isInterface(outgoingTypeAbstractElement) || isClass(outgoingTypeAbstractElement)) {
                            const outgoingReferences: CReference[] = (outgoingTypeAbstractElement as Class | Interface).body.filter(x => isCReference(x)).map(x => x as CReference);
                            return ScopingUtils.computeCustomScope(outgoingReferences, this.descriptions, x => x.name, x => x, this.createScope);
                        }
                    }
                }
            }
            return EMPTY_SCOPE;
        } else if (isCreateNodeAttributeAssignment(context.container)) {
            const nodeTyping = context.container.$container.nodeVar.typing;
            if (nodeTyping.type != undefined && nodeTyping.type.ref != undefined && (isClass(nodeTyping.type.ref) || isInterface(nodeTyping.type.ref))) {
                const nodeDef: Class | Interface = nodeTyping.type.ref as Class | Interface;
                if (context.property == 'attr') {
                    const attributes: Attribute[] = nodeDef.body.filter(x => isAttribute(x)).map(x => x as Attribute);
                    return ScopingUtils.computeCustomScope(attributes, this.descriptions, x => x.name, x => x, this.createScope);
                }
            }
            return EMPTY_SCOPE;
        }

        return super.getScope(context);
    }

    protected override getGlobalScope(referenceType: string, _context: ReferenceInfo): Scope {
        const cDoc = getContainerOfType(_context.container, isConstraintDocument);
        if (!cDoc) {
            return super.getGlobalScope(referenceType, _context);
        }

        const localDocumentUri: URI = getDocument(cDoc).uri;
        const localUriSet: Set<string> = new Set([localDocumentUri.toString()]);
        const localDocScope: Scope = new MapScope(this.indexManager.allElements(referenceType, localUriSet));

        if (cDoc.model != undefined) {
            const mappedRelativeRefDocUri: URI | undefined = ModelModelingLanguageUtils.resolveRelativeModelImport(cDoc.model.path, localDocumentUri)
            if (mappedRelativeRefDocUri != undefined) {
                const importedUriSet: Set<string> = new Set([mappedRelativeRefDocUri.toString()]);
                const importedDocScope: Scope = new MapScope(this.indexManager.allElements(referenceType, importedUriSet));

                return this.createScope([...importedDocScope.getAllElements()], localDocScope);
            }
        }
        return localDocScope;
    }
}