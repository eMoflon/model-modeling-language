import {DefaultScopeProvider, ReferenceInfo, Scope} from "langium";
import {
    CreateNodeStatement,
    GMChainStatement,
    isCreateEdgeStatement,
    isCreateNodeStatement,
    isGMChainStatement,
    isTargetNode,
    UntypedVariable
} from "./generated/ast.js";
import {ScopingUtils} from "./scoping-utils.js";
import {GraphManipulationLanguageServices} from "./graph-manipulation-language-module.js";

/**
 * The ScopeProvider searches scopes and is used to calculate custom scopes for individual
 * parameters that are not covered by the standard scoper.
 */
export class GraphManipulationLanguageScopeProvider extends DefaultScopeProvider {
    services: GraphManipulationLanguageServices;

    constructor(services: GraphManipulationLanguageServices) {
        super(services);
        this.services = services;
    }


    override getScope(context: ReferenceInfo): Scope {
        if (isTargetNode(context.container)) {
            if (isCreateEdgeStatement(context.container.$container) && isGMChainStatement(context.container.$container.$container)) {
                const chainEnv: GMChainStatement = context.container.$container.$container;
                const tempVars: UntypedVariable[] = chainEnv.chain.filter(x => isCreateNodeStatement(x)).map(x => (x as CreateNodeStatement).nodeVar);
                return ScopingUtils.computeCustomScope(tempVars, this.descriptions, x => x.name, x => x, this.createScope);
            }
        }

        return super.getScope(context);
    }
}