import {getDocument, LangiumDocument, URI, ValidationAcceptor, ValidationChecks} from 'langium';
import {GraphConstraintLanguageServices} from "./graph-constraint-language-module.js";
import {
    AbstractElement,
    Annotation,
    BinaryExpression,
    Class,
    CompactBindingStatement,
    Constraint,
    ConstraintAssertion,
    ConstraintDocument,
    CReference,
    DescriptionAnnotation,
    DisableDefaultNodeConstraintsAnnotation,
    isClass,
    isConstraint,
    isDescriptionAnnotation,
    isDisableDefaultNodeConstraintsAnnotation,
    isEnforceAnnotation,
    isForbidAnnotation,
    isIInstance,
    isNodeConstraintAnnotation,
    isPattern,
    isPatternObject,
    isTitleAnnotation,
    Model,
    ModelModelingLanguageAstType,
    NodeConstraintAnnotation,
    Pattern,
    PatternAttributeConstraint,
    PatternObject,
    PatternObjectReference,
    ReferencedModelStatement,
    TitleAnnotation,
    TypedVariable,
    VariableType
} from "./generated/ast.js";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils.js";
import {ExprType, ExprUtils} from "./expr-utils.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: GraphConstraintLanguageServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.GraphConstraintLanguageValidator;
    const checks: ValidationChecks<ModelModelingLanguageAstType> = {
        ConstraintDocument: [
            validator.checkUniquePatternNames,
            validator.checkUniqueConstraintNames
        ],
        Pattern: [
            validator.checkUniquePatternObjectNames,
            validator.checkUniqueAllowDuplicatesAnnotation,
            validator.checkNodeConstraintAnnotationValidity,
            validator.checkUniquePatternAlias
        ],
        CompactBindingStatement: [
            validator.checkCompactBindingTypeValidity,
            validator.checkBindedPatternObjectIsNotLocal
        ],
        PatternObject: [
            validator.checkPatternObjectVariableTypeValidity
        ],
        PatternObjectReference: [
            validator.checkPatternObjectReferenceTypeMatch
        ],
        ReferencedModelStatement: [
            validator.checkReferenceModelIsKnown,
            validator.checkReferenceModelIsSupported
        ],
        PatternAttributeConstraint: [
            validator.checkPatternAttributeConstraintType,
            //validator.checkPatternAttributeConstraintBinaryOperation
        ],
        BinaryExpression: [
            validator.checkBinaryExpressionValidity
        ],
        Annotation: [
            validator.checkAnnotationContextValidity
        ],
        Constraint: [
            validator.checkConstraintAnnotationValidity
        ],
        ConstraintAssertion: [
            validator.checkConstraintAssertionType
        ]
    };
    registry.register(checks, validator);
}

/**
 * Register issue codes, which are used to attach code actions.
 */
export namespace IssueCodes {
    export const CompactBindingTypeDoesNotMatch = "compact-binding-type-does-not-match";
    export const PatternObjectVariableHasPrimitiveType = "pattern-object-variable-has-primitive-type";
    export const PatternObjectVariableIsInterface = "pattern-object-variable-is-interface";
    export const PatternNameNotUnique = "pattern-name-not-unique";
    export const PatternObjectNameNotUnique = "pattern-object-name-not-unique";
    export const PatternObjectReferenceTypeDoesNotMatch = "pattern-object-reference-type-does-not-match";
    export const UnknownDocument = "unknown-document";
    export const UnsupportedDocument = "unsupported-document";
    export const BindedLocalPatternObject = "binded-local-pattern-object";
    export const AttributeConstraintYieldsNoBoolean = "attribute-constraint-yields-no-boolean";
    export const AttributeConstraintContainsUnsupportedOperation = "attribute-constraint-contains-unsupported-operation";
    export const InvalidBinaryExpression = "invalid-binary-expression";
    export const AllowDuplicatesAnnotationNotUnique = "allow-duplicates-annotation-not-unique";
    export const SelfAppliedNodeConstraint = "self-applied-node-constraint";
    export const DuplicateNodeConstraint = "duplicate-node-constraint";
    export const NodeConstraintWithoutAllowDuplicateAnnotation = "node-constraint-without-allow-duplicate-annotation";
    export const ImpossibleNodeConstraint = "impossible-node-constraint";
    export const UnnecessaryNodeConstraint = "unnecessary-node-constraint";
    export const InvalidAnnotationContext = "invalid-annotation-context";
    export const ConstraintAssertionYieldsNoBoolean = "constraint-assertion-yields-no-boolean";
    export const ConstraintNameNotUnique = "constraint-name-not-unique";
    export const JustificationCaseNameNotUnique = "justification-case-name-not-unique";
    export const PatternElementAliasNotUnique = "pattern-element-alias-name-not-unique";
    export const MultipleConstraintTitlesDefined = "multiple-constraint-titles-defined";
    export const MultipleConstraintDescriptionsDefined = "multiple-constraint-descriptions-defined";
}

/**
 * Implementation of custom validations.
 */
export class GraphConstraintLanguageValidator {
    services: GraphConstraintLanguageServices;

    constructor(services: GraphConstraintLanguageServices) {
        this.services = services;
    }

    checkPatternObjectVariableTypeValidity(po: PatternObject, accept: ValidationAcceptor) {
        if (po.var.typing.dtype != undefined && po.var.typing.type == undefined) {
            accept('error', `You cannot use primitive types here!`, {
                node: po.var.typing,
                property: 'dtype',
                code: IssueCodes.PatternObjectVariableHasPrimitiveType
            })
        } else if (po.var.typing.dtype == undefined && po.var.typing.type != undefined && po.var.typing.type.ref != undefined) {
            const patternTypeElement: AbstractElement = po.var.typing.type.ref;
            if (isIInstance(patternTypeElement)) {
                accept('error', `You cannot define patterns using interfaces!'.`, {
                    node: po.var.typing,
                    property: 'type',
                    code: IssueCodes.PatternObjectVariableIsInterface
                })
            }
        }
    }

    checkCompactBindingTypeValidity(cbs: CompactBindingStatement, accept: ValidationAcceptor) {
        if (cbs.selfVar == undefined || cbs.otherVar == undefined) {
            return;
        }
        if (cbs.selfVar.ref != undefined && cbs.otherVar.ref != undefined) {
            const selfVarTyping: VariableType = cbs.selfVar.ref.typing;
            const otherVarTyping: VariableType = cbs.otherVar.ref.typing;
            if (selfVarTyping.type != undefined && otherVarTyping.type != undefined && selfVarTyping.type.ref != undefined && otherVarTyping.type.ref != undefined) {
                if (selfVarTyping.type.ref != otherVarTyping.type.ref) {
                    accept('error', `You cannot bind "${cbs.selfVar.ref.name}" [type: ${selfVarTyping.type.ref.name}] to "${cbs.otherVar.ref.name}" [type: ${otherVarTyping.type.ref.name}]`, {
                        node: cbs,
                        property: 'selfVar',
                        code: IssueCodes.CompactBindingTypeDoesNotMatch
                    })
                }
            }
        }
    }

    checkUniquePatternNames(cDoc: ConstraintDocument, accept: ValidationAcceptor): void {
        const reportedElements = new Set();
        cDoc.patterns.forEach(pattern => {
            if (reportedElements.has(pattern.name)) {
                accept('error', `${pattern.$type} has non-unique name '${pattern.name}'.`, {
                    node: pattern,
                    property: 'name',
                    code: IssueCodes.PatternNameNotUnique
                })
            }
            reportedElements.add(pattern.name);
        });
    }

    checkUniquePatternObjectNames(pattern: Pattern, accept: ValidationAcceptor): void {
        const reportedElements = new Set();
        pattern.objs.forEach(elmt => {
            if (reportedElements.has(elmt.var.name)) {
                accept('error', `${elmt.$type} has non-unique name '${elmt.var.name}'.`, {
                    node: elmt.var,
                    property: 'name',
                    code: IssueCodes.PatternObjectNameNotUnique
                })
            }
            reportedElements.add(elmt.var.name);
        });
    }

    checkPatternObjectReferenceTypeMatch(pRef: PatternObjectReference, accept: ValidationAcceptor) {
        const selectedRef: CReference | undefined = pRef.ref.ref;
        const selectedPatternObjVar: TypedVariable | undefined = pRef.patternObj.ref;
        if (selectedRef != undefined && selectedPatternObjVar != undefined) {
            const refClass: Class | undefined = selectedRef.type.ref;
            const patternObjVarType: VariableType = selectedPatternObjVar.typing;
            if (refClass != undefined && patternObjVarType.type != undefined && patternObjVarType.type.ref != undefined && isClass(patternObjVarType.type.ref)) {
                const varTypeClass: Class = patternObjVarType.type.ref;
                if (varTypeClass != refClass) {
                    accept('error', `${selectedPatternObjVar.name} [type: ${varTypeClass.name}] does not match reference [type: ${refClass.name}].`, {
                        node: pRef,
                        property: 'patternObj',
                        code: IssueCodes.PatternObjectReferenceTypeDoesNotMatch
                    })
                }
            }
        }
    }

    checkReferenceModelIsKnown(refModel: ReferencedModelStatement, accept: ValidationAcceptor) {
        const documentUri: URI = getDocument(refModel).uri;
        const importedDocURI: URI | undefined = ModelModelingLanguageUtils.resolveRelativeModelImport(refModel.path, documentUri);
        if (importedDocURI == undefined || !this.services.shared.workspace.LangiumDocuments.hasDocument(importedDocURI)) {
            accept('error', `Document currently not managed by langium services`, {
                node: refModel,
                property: 'path',
                code: IssueCodes.UnknownDocument
            })
        }
    }

    checkReferenceModelIsSupported(refModel: ReferencedModelStatement, accept: ValidationAcceptor) {
        const documentUri: URI = getDocument(refModel).uri;
        const importedDocURI: URI | undefined = ModelModelingLanguageUtils.resolveRelativeModelImport(refModel.path, documentUri);
        if (importedDocURI != undefined && this.services.shared.workspace.LangiumDocuments.hasDocument(importedDocURI)) {
            const importedDocument: LangiumDocument = this.services.shared.workspace.LangiumDocuments.getOrCreateDocument(importedDocURI);
            const importedRoot: Model = importedDocument.parseResult.value as Model;
            if (importedRoot.packages.length > 1) {
                accept('error', `GCL does not currently support MML files that define multiple top-level packages!`, {
                    node: refModel,
                    property: 'path',
                    code: IssueCodes.UnsupportedDocument
                })
            }
            if (importedRoot.imports.length > 0) {
                accept('error', `GCL currently does not support MML files containing imports!`, {
                    node: refModel,
                    property: 'path',
                    code: IssueCodes.UnsupportedDocument
                })
            }
        }
    }

    checkBindedPatternObjectIsNotLocal(cbs: CompactBindingStatement, accept: ValidationAcceptor) {
        if (cbs.otherVar != undefined && cbs.otherVar.ref != undefined && isPatternObject(cbs.otherVar.ref.$container) && cbs.otherVar.ref.$container.local) {
            accept('error', `Local pattern objects cannot be bound`, {
                node: cbs,
                property: 'otherVar',
                code: IssueCodes.BindedLocalPatternObject
            })
        }
    }

    checkPatternAttributeConstraintType(ac: PatternAttributeConstraint, accept: ValidationAcceptor) {
        const constraintType: ExprType = ExprUtils.evaluateExpressionType(ac.expr);
        if (constraintType != ExprType.BOOLEAN) {
            accept('error', `Attribute constraints must yield boolean expressions (not: ${ExprType.toMMLType(constraintType) ?? "UNKNOWN"})!`, {
                node: ac,
                property: 'expr',
                code: IssueCodes.AttributeConstraintYieldsNoBoolean
            })
        }
    }

    /*checkPatternAttributeConstraintBinaryOperation(ac: PatternAttributeConstraint, accept: ValidationAcceptor) {
        if (isBinaryExpression(ac.expr)) {
            if (ac.expr.operator != "==" && ac.expr.operator != "!=" && ac.expr.operator != "<" && ac.expr.operator != "<=" && ac.expr.operator != ">" && ac.expr.operator != ">=") {
                accept('error', `Attribute constraints must use relational operator on top-level binary expressions (not: "${ac.expr.operator}")!`, {
                    node: ac,
                    property: 'expr',
                    code: IssueCodes.AttributeConstraintContainsUnsupportedOperation
                })
            }
        }
    }*/

    checkBinaryExpressionValidity(bexpr: BinaryExpression, accept: ValidationAcceptor) {
        if (bexpr.operator == '&&' || bexpr.operator == '||') {
            const lType: ExprType = ExprUtils.evaluateExpressionType(bexpr.left);
            const rType: ExprType = ExprUtils.evaluateExpressionType(bexpr.right);

            if (lType != ExprType.BOOLEAN) {
                accept('error', `Boolean operator "${bexpr.operator}" requires boolean expression (not: "${ExprType.toMMLType(lType)}")`, {
                    node: bexpr,
                    property: 'left',
                    code: IssueCodes.InvalidBinaryExpression
                })
            }
            if (rType != ExprType.BOOLEAN) {
                accept('error', `Boolean operator "${bexpr.operator}" requires boolean expression (not: "${ExprType.toMMLType(rType)}")`, {
                    node: bexpr,
                    property: 'right',
                    code: IssueCodes.InvalidBinaryExpression
                })
            }
        } else if (bexpr.operator == '==' || bexpr.operator == '!=') {
            const lType: ExprType = ExprUtils.evaluateExpressionType(bexpr.left);
            const rType: ExprType = ExprUtils.evaluateExpressionType(bexpr.right);

            if (lType != rType && !(ExprUtils.isNumberExpressionType(lType) && ExprUtils.isNumberExpressionType(rType))) {
                accept('error', `Comparison requires expressions of equal type (not: "${ExprType.toMMLType(lType)}" and "${ExprType.toMMLType(rType)}")`, {
                    node: bexpr,
                    code: IssueCodes.InvalidBinaryExpression
                })
            }
        } else if (bexpr.operator == '<' || bexpr.operator == '<=' || bexpr.operator == '>' || bexpr.operator == '>=') {
            const lType: ExprType = ExprUtils.evaluateExpressionType(bexpr.left);
            const rType: ExprType = ExprUtils.evaluateExpressionType(bexpr.right);

            if (!ExprUtils.isNumberExpressionType(lType)) {
                accept('error', `Comparison operator "${bexpr.operator}" requires numeric expressions (not: "${ExprType.toMMLType(lType)}")`, {
                    node: bexpr,
                    property: 'left',
                    code: IssueCodes.InvalidBinaryExpression
                })
            }
            if (!ExprUtils.isNumberExpressionType(rType)) {
                accept('error', `Comparison operator "${bexpr.operator}" requires numeric expressions (not: "${ExprType.toMMLType(rType)}")`, {
                    node: bexpr,
                    property: 'right',
                    code: IssueCodes.InvalidBinaryExpression
                })
            }
        } else if (bexpr.operator == '-' || bexpr.operator == '/') {
            const lType: ExprType = ExprUtils.evaluateExpressionType(bexpr.left);
            const rType: ExprType = ExprUtils.evaluateExpressionType(bexpr.right);

            if (!ExprUtils.isNumberExpressionType(lType)) {
                accept('error', `Arithmetic operator "${bexpr.operator}" requires numeric expressions (not: "${ExprType.toMMLType(lType)}")`, {
                    node: bexpr,
                    property: 'left',
                    code: IssueCodes.InvalidBinaryExpression
                })
            }
            if (!ExprUtils.isNumberExpressionType(rType)) {
                accept('error', `Arithmetic operator "${bexpr.operator}" requires numeric expressions (not: "${ExprType.toMMLType(rType)}")`, {
                    node: bexpr,
                    property: 'right',
                    code: IssueCodes.InvalidBinaryExpression
                })
            }
        } else if (bexpr.operator == '+' || bexpr.operator == '*') {
            const lType: ExprType = ExprUtils.evaluateExpressionType(bexpr.left);
            const rType: ExprType = ExprUtils.evaluateExpressionType(bexpr.right);

            const lNumeric: boolean = ExprUtils.isNumberExpressionType(lType);
            const rNumeric: boolean = ExprUtils.isNumberExpressionType(rType);

            if (!lNumeric || !rNumeric) {
                if (lNumeric && rType != ExprType.STRING) {
                    accept('error', `Arithmetic operator "${bexpr.operator}" requires numeric or string expressions (not: "${ExprType.toMMLType(rType)}")`, {
                        node: bexpr,
                        property: 'right',
                        code: IssueCodes.InvalidBinaryExpression
                    })
                }
                if (rNumeric && lType != ExprType.STRING) {
                    accept('error', `Arithmetic operator "${bexpr.operator}" requires numeric or string expressions (not: "${ExprType.toMMLType(lType)}")`, {
                        node: bexpr,
                        property: 'left',
                        code: IssueCodes.InvalidBinaryExpression
                    })
                }
            }
        }
    }

    checkUniqueAllowDuplicatesAnnotation(pattern: Pattern, accept: ValidationAcceptor) {
        const allowDuplicateAnnotations: DisableDefaultNodeConstraintsAnnotation[] = pattern.annotations.filter(x => isDisableDefaultNodeConstraintsAnnotation(x)).map(x => x as DisableDefaultNodeConstraintsAnnotation);
        if (allowDuplicateAnnotations.length > 1) {
            allowDuplicateAnnotations.forEach(x => {
                accept('error', `This annotation can only be present once per pattern!`, {
                    node: x,
                    code: IssueCodes.AllowDuplicatesAnnotationNotUnique
                })
            })
        }
    }

    checkNodeConstraintAnnotationValidity(pattern: Pattern, accept: ValidationAcceptor) {
        const lookupTable: Map<string, Set<string>> = new Map<string, Set<string>>();
        const allowDuplicateAnnotations: DisableDefaultNodeConstraintsAnnotation[] = pattern.annotations.filter(x => isDisableDefaultNodeConstraintsAnnotation(x)).map(x => x as DisableDefaultNodeConstraintsAnnotation);
        const nodeConstraintAnnotations: NodeConstraintAnnotation[] = pattern.annotations.filter(x => isNodeConstraintAnnotation(x)).map(x => x as NodeConstraintAnnotation);

        if (allowDuplicateAnnotations.length == 0 && nodeConstraintAnnotations.length > 0) {
            nodeConstraintAnnotations.forEach(annotation => {
                accept('error', `Node constraints require the @DisableDefaultNodeConstraints annotation!`, {
                    node: annotation,
                    code: IssueCodes.NodeConstraintWithoutAllowDuplicateAnnotation
                })
            })
        } else {
            nodeConstraintAnnotations.forEach(annotation => {
                if (annotation.node1 == undefined || annotation.node2 == undefined) {
                    return;
                }

                const node1: TypedVariable | undefined = annotation.node1.ref;
                const node2: TypedVariable | undefined = annotation.node2.ref;

                if (node1 == undefined || node2 == undefined) {
                    return;
                }

                if (node1 == node2) {
                    accept('error', `You cannot create NodeConstraints between a single node!`, {
                        node: annotation,
                        code: IssueCodes.SelfAppliedNodeConstraint
                    })
                } else if (!ExprUtils.getVariableTyping(node1).equals(ExprUtils.getVariableTyping(node2))) {
                    if (annotation.operator == "!=") {
                        accept('info', `This constraint is unnecessary because the nodes have different types!`, {
                            node: annotation,
                            code: IssueCodes.UnnecessaryNodeConstraint
                        })
                    } else if (annotation.operator == "==") {
                        accept('error', `This constraint cannot be fulfilled because the nodes have different types!`, {
                            node: annotation,
                            code: IssueCodes.ImpossibleNodeConstraint
                        })
                    }
                } else {
                    const ordered1 = node1.name > node2.name ? node1.name : node2.name;
                    const ordered2 = node1.name > node2.name ? node2.name : node1.name;

                    const subSet = lookupTable.get(ordered1);

                    if (subSet != undefined) {
                        if (subSet.has(ordered2)) {
                            accept('error', `This node constraint already exists (with the same or opposite operator)!`, {
                                node: annotation,
                                code: IssueCodes.DuplicateNodeConstraint
                            })
                        } else {
                            subSet.add(ordered2);
                        }
                    } else {
                        lookupTable.set(ordered1, new Set<string>([ordered2]));
                    }
                }
            });
        }
    }

    checkAnnotationContextValidity(annotation: Annotation, accept: ValidationAcceptor) {
        if (isEnforceAnnotation(annotation)) {
            if (!isPattern(annotation.$container)) {
                accept('error', `This annotation can only be used for structures of type pattern.`, {
                    node: annotation,
                    code: IssueCodes.InvalidAnnotationContext
                })
            }
        } else if (isForbidAnnotation(annotation)) {
            if (!isPattern(annotation.$container)) {
                accept('error', `This annotation can only be used for structures of type pattern.`, {
                    node: annotation,
                    code: IssueCodes.InvalidAnnotationContext
                })
            }
        } else if (isDisableDefaultNodeConstraintsAnnotation(annotation)) {
            if (!isPattern(annotation.$container)) {
                accept('error', `This annotation can only be used for structures of type pattern.`, {
                    node: annotation,
                    code: IssueCodes.InvalidAnnotationContext
                })
            }
        } else if (isNodeConstraintAnnotation(annotation)) {
            if (!isPattern(annotation.$container)) {
                accept('error', `This annotation can only be used for structures of type pattern.`, {
                    node: annotation,
                    code: IssueCodes.InvalidAnnotationContext
                })
            }
        } else if (isTitleAnnotation(annotation)) {
            if (!isConstraint(annotation.$container)) {
                accept('error', `This annotation can only be used for structures of type constraint.`, {
                    node: annotation,
                    code: IssueCodes.InvalidAnnotationContext
                })
            }
        } else if (isDescriptionAnnotation(annotation)) {
            if (!isConstraint(annotation.$container)) {
                accept('error', `This annotation can only be used for structures of type constraint.`, {
                    node: annotation,
                    code: IssueCodes.InvalidAnnotationContext
                })
            }
        }
    }

    checkConstraintAssertionType(ca: ConstraintAssertion, accept: ValidationAcceptor) {
        const assertionType: ExprType = ExprUtils.evaluateExpressionType(ca.expr);
        if (assertionType != ExprType.BOOLEAN) {
            accept('error', `Assertions constraints must yield boolean expressions (not: ${ExprType.toMMLType(assertionType) ?? "UNKNOWN"})!`, {
                node: ca,
                property: 'expr',
                code: IssueCodes.ConstraintAssertionYieldsNoBoolean
            })
        }
    }

    checkUniqueConstraintNames(cDoc: ConstraintDocument, accept: ValidationAcceptor) {
        const reportedElements = new Set();
        cDoc.constraints.forEach(constraint => {
            if (reportedElements.has(constraint.name)) {
                accept('error', `${constraint.$type} has non-unique name '${constraint.name}'.`, {
                    node: constraint,
                    property: 'name',
                    code: IssueCodes.ConstraintNameNotUnique
                })
            }
            reportedElements.add(constraint.name);
        });
    }

    checkUniquePatternAlias(pattern: Pattern, accept: ValidationAcceptor) {
        const knownAlias: Set<string> = new Set();
        pattern.objs.forEach(node => node.connections.forEach(edge => {
            if (edge.alias != undefined) {
                if (knownAlias.has(edge.alias)) {
                    accept('error', `The pattern already contains an edge or an attribute condition with the alias: "${edge.alias}"`, {
                        node: edge,
                        property: 'alias',
                        code: IssueCodes.PatternElementAliasNotUnique
                    })
                }
                knownAlias.add(edge.alias);
            }
        }));
        pattern.constraints.forEach(constraint => {
            if (constraint.alias != undefined) {
                if (knownAlias.has(constraint.alias)) {
                    accept('error', `The pattern already contains an edge or an attribute condition with the alias: "${constraint.alias}"`, {
                        node: constraint,
                        property: 'alias',
                        code: IssueCodes.PatternElementAliasNotUnique
                    })
                }
                knownAlias.add(constraint.alias);
            }
        });
    }

    checkConstraintAnnotationValidity(constraint: Constraint, accept: ValidationAcceptor) {
        const titleAnnotations: TitleAnnotation[] = constraint.annotations.filter(x => isTitleAnnotation(x)).map(x => x as TitleAnnotation);
        const descriptionAnnotations: DescriptionAnnotation[] = constraint.annotations.filter(x => isDescriptionAnnotation(x)).map(x => x as DescriptionAnnotation);

        if (titleAnnotations.length > 1) {
            titleAnnotations.forEach(anno =>
                accept('error', `There can only be a maximum of one title annotation!`, {
                    node: anno,
                    code: IssueCodes.MultipleConstraintTitlesDefined
                }))
        }

        if (descriptionAnnotations.length > 1) {
            descriptionAnnotations.forEach(anno =>
                accept('info', `Several constraint description annotations have been defined! These will be combined into one description during the evaluation.`, {
                    node: anno,
                    code: IssueCodes.MultipleConstraintDescriptionsDefined
                }))
        }
    }
}
