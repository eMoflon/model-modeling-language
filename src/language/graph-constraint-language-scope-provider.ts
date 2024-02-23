import {
    AstNodeDescription,
    DefaultScopeProvider,
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
    EnforceAnnotation,
    ForbidAnnotation,
    isAttribute,
    isClass,
    isCompactBindingStatement,
    isConstraintAssertion,
    isConstraintDocument,
    isConstraintPatternDeclaration,
    isEnumValueExpr,
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