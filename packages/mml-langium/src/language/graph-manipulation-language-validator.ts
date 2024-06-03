import {ValidationAcceptor, ValidationChecks} from 'langium';
import {
    CreateNodeStatement,
    GMChainStatement,
    isCreateNodeStatement,
    isGMChainStatement,
    ModelModelingLanguageAstType,
    TargetNode,
    UntypedVariable
} from "./generated/ast.js";
import {GraphManipulationLanguageServices} from "./graph-manipulation-language-module.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: GraphManipulationLanguageServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.GraphManipulationLanguageValidator;
    const checks: ValidationChecks<ModelModelingLanguageAstType> = {
        TargetNode: [
            validator.checkTemporaryNodeVariableInsideChain,
            validator.checkTemporaryNodeVariableReferenceBeforeDefinition,
        ],
        GMChainStatement: [
            validator.checkUniqueTemporaryNodeVariableNamesInChain
        ]
    };
    registry.register(checks, validator);
}

/**
 * Register issue codes, which are used to attach code actions.
 */
export namespace IssueCodes {
    export const TemporaryNodeVariableOutsideChain = "temporary-node-variable-outside-chain";
    export const TemporaryNodeVariableUsageBeforeDefinition = "temporary-node-variable-usage-before-definition";
    export const TemporaryNodeVariableNameNotUnique = "temporary-node-variable-name-not-unique";
}

/**
 * Implementation of custom validations.
 */
export class GraphManipulationLanguageValidator {
    services: GraphManipulationLanguageServices;

    constructor(services: GraphManipulationLanguageServices) {
        this.services = services;
    }

    checkTemporaryNodeVariableInsideChain(tn: TargetNode, accept: ValidationAcceptor) {
        if (!isGMChainStatement(tn.$container.$container) && tn.nodeId == undefined && tn.tempNodeVar != undefined) {
            accept('error', `You cannot use temporary NodeVariables outside chains!`, {
                node: tn,
                property: 'tempNodeVar',
                code: IssueCodes.TemporaryNodeVariableOutsideChain
            })
        }
    }

    checkTemporaryNodeVariableReferenceBeforeDefinition(tn: TargetNode, accept: ValidationAcceptor) {
        if (tn.nodeId == undefined && tn.tempNodeVar != undefined && tn.tempNodeVar.ref != undefined) {
            const referencedVariable: UntypedVariable = tn.tempNodeVar.ref;
            if (isCreateNodeStatement(referencedVariable.$container)) {
                const referencedDefinition: CreateNodeStatement = referencedVariable.$container;
                const definitionIdx: number | undefined = referencedDefinition.$containerIndex;
                const usageIdx: number | undefined = tn.$container.$containerIndex;
                if (definitionIdx != undefined && usageIdx != undefined && usageIdx < definitionIdx) {
                    accept('error', `Referencing NodeVariable before initialization!`, {
                        node: tn,
                        property: 'tempNodeVar',
                        code: IssueCodes.TemporaryNodeVariableUsageBeforeDefinition
                    })
                }
            } else {
                throw new Error(`Unexpectedly encountered reference to node of type ${referencedVariable.$container.$type}`);
            }
        }
    }

    checkUniqueTemporaryNodeVariableNamesInChain(cn: GMChainStatement, accept: ValidationAcceptor) {
        const knownNames: Set<string> = new Set();
        cn.chain.filter(x => isCreateNodeStatement(x)).map(x => x as CreateNodeStatement).forEach(stmt => {
            if (knownNames.has(stmt.nodeVar.name)) {
                accept('error', `NodeVariableName not unique inside chain!`, {
                    node: stmt,
                    property: 'nodeVar',
                    code: IssueCodes.TemporaryNodeVariableNameNotUnique
                })
            } else {
                knownNames.add(stmt.nodeVar.name);
            }
        });
    }

}
