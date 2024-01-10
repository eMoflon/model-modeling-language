import {AstNodeDescription, DefaultScopeProvider, ReferenceInfo, Scope, Stream} from "langium";
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
        }

        return super.getScope(context);
    }
}