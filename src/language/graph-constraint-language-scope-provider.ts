import {AstNodeDescription, DefaultScopeProvider, EMPTY_SCOPE, ReferenceInfo, Scope, stream, Stream} from "langium";
import {
    AbstractElement,
    EnforceAnnotation,
    ForbidAnnotation,
    isClass,
    isCompactBindingStatement,
    isInterface,
    isPatternObjectReference,
    Pattern,
    PatternObject
} from "./generated/ast.js";
import {GraphConstraintLanguageServices} from "./graph-constraint-language-module.js";
import {ScopingUtils} from "./scoping-utils.js";

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
            const scopes: Array<Stream<AstNodeDescription>> = [];
            let validPatternObjects: Array<PatternObject> = [];
            const annotation: EnforceAnnotation | ForbidAnnotation = context.container.$container;
            if (context.property === "selfVar") {
                const annotatedPattern: Pattern = annotation.$container;
                validPatternObjects = annotatedPattern.objs;
            } else if (context.property === "otherVar") {
                if (annotation.pattern != undefined && annotation.pattern.ref != undefined) {
                    const referencesPattern: Pattern | undefined = annotation.pattern.ref;
                    validPatternObjects = referencesPattern.objs;
                }
            }
            scopes.push(stream(validPatternObjects).map(v => {
                if (v != undefined) {
                    return this.descriptions.createDescription(v.var, v.var.name);
                }
                return undefined;
            }).filter(d => d != undefined) as Stream<AstNodeDescription>);
            let result: Scope = EMPTY_SCOPE;
            for (let i = scopes.length - 1; i >= 0; i--) {
                result = this.createScope(scopes[i], result);
            }
            return result;
        } else if (isPatternObjectReference(context.container)) {
            const scopes: Array<Stream<AstNodeDescription>> = [];
            const patternObj: PatternObject = context.container.$container;
            if (context.property === "ref") {
                if (patternObj.var.typing.type != undefined && patternObj.var.typing.type.ref != undefined) {
                    const abstractEl: AbstractElement = patternObj.var.typing.type.ref;
                    if (isClass(abstractEl) || isInterface(abstractEl)) {
                        scopes.push(stream(ScopingUtils.getAllInheritedReferences(abstractEl)).map(v => {
                            if (v != undefined) {
                                return this.descriptions.createDescription(v, v.name);
                            }
                            return undefined;
                        }).filter(d => d != undefined) as Stream<AstNodeDescription>);
                    }
                }
            } else if (context.property === "patternObj") {
                const pattern: Pattern = patternObj.$container;
                scopes.push(stream(pattern.objs).map(v => {
                    if (v != undefined) {
                        return this.descriptions.createDescription(v.var, v.var.name);
                    }
                    return undefined;
                }).filter(d => d != undefined) as Stream<AstNodeDescription>);
            }
            let result: Scope = EMPTY_SCOPE;
            for (let i = scopes.length - 1; i >= 0; i--) {
                result = this.createScope(scopes[i], result);
            }
            return result;
        }

        return super.getScope(context);
    }
}