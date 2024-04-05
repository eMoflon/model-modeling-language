import {getDocument, LangiumDocument, URI, ValidationAcceptor, ValidationChecks} from 'langium';
import {GraphConstraintLanguageServices} from "./graph-constraint-language-module.js";
import {
    AbstractElement,
    Annotation,
    Attribute,
    BinaryExpression,
    Class,
    CompactBindingStatement,
    Constraint,
    ConstraintAssertion,
    ConstraintDocument,
    CreateNodeAttributeAssignment,
    CReference,
    DescriptionAnnotation,
    DisableDefaultNodeConstraintsAnnotation,
    DisableFixContainer,
    EnableFixContainer,
    EnumValueExpr,
    FixCreateEdgeStatement,
    FixSetStatement,
    Interface,
    isAttribute,
    isClass,
    isConstraint,
    isConstraintPatternDeclaration,
    isDescriptionAnnotation,
    isDisableDefaultNodeConstraintsAnnotation,
    isEnforceAnnotation,
    isFixCreateEdgeStatement,
    isFixCreateNodeStatement,
    isFixDeleteEdgeStatement,
    isFixDeleteNodeStatement,
    isFixSetStatement,
    isForbidAnnotation,
    isIInstance,
    isNodeConstraintAnnotation,
    isPattern,
    isPatternBindAnnotation,
    isPatternObject,
    isTemplateLiteral,
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
import {ScopingUtils} from "./scoping-utils.js";

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
            validator.checkBinaryExpressionValidity,
        ],
        EnumValueExpr: [
            validator.checkEnumValueExpressionPermitted
        ],
        Annotation: [
            validator.checkAnnotationContextValidity
        ],
        Constraint: [
            validator.checkConstraintAnnotationValidity
        ],
        ConstraintAssertion: [
            validator.checkConstraintAssertionType
        ],
        FixSetStatement: [
            validator.checkFixSetTypes
        ],
        FixCreateEdgeStatement: [
            validator.checkFixCreateEdgeTargetType,
            validator.checkCreateEdgeStatementTempNodeIdDeclarationBeforeUsage
        ],
        CreateNodeAttributeAssignment: [
            validator.checkFixCreateNodeAttributeTypes
        ],
        DisableFixContainer: [
            validator.checkDisableFixContainerNotEmpty
        ],
        EnableFixContainer: [
            validator.checkEnableFixContainerEmptyOrBound,
            validator.checkEmptyEnableFixContainerStatements
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
    export const FixSetStatementTypeDoesNotMatch = "fix-set-statement-type-does-not-match";
    export const FixCreateEdgeStatementReferenceTypeDoesNotMatch = "fix-create-edge-statement-reference-type-does-not-match";
    export const FixCreateEdgeStatementReferencesTemporaryNodeIdBeforeDeclaration = "fix-create-edge-statement-references-temp-id-beforedeclaration";
    export const FixCreateNodeStatementAttributeTypeDoesNotMatch = "fix-create-node-statement-attribute-type-does-not-match";
    export const DisableFixContainerHasEmptyModifier = "disable-fix-container-has-empty-modifier";
    export const EnableFixContainerIsUnboundAndNotEmpty = "enable-fix-container-is-unbound-and-not-empty";
    export const InvalidFixStatementInEmptyFixContainer = "invalid-fix-statement-in-empty-fix-container";
    export const EnumValueExprNotPermittedInContainer = "enum-value-expr-not-permitted-in-container";
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
                const allowedAbstractElements: Set<(Class | Interface)> = ScopingUtils.getAllInheritedAbstractElements(varTypeClass);
                if (!allowedAbstractElements.has(refClass)) {
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

    checkEnumValueExpressionPermitted(expr: EnumValueExpr, accept: ValidationAcceptor) {
        const container = ExprUtils.getExprContainer(expr);
        if (isTemplateLiteral(container)) {
            accept('error', `EnumValues are not permitted inside ${container.$type}`, {
                node: expr,
                code: IssueCodes.EnumValueExprNotPermittedInContainer
            })
        }
    }

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
        } else if (isPatternBindAnnotation(annotation)) {
            if (!isConstraintPatternDeclaration(annotation.$container)) {
                accept('error', `This annotation can only be used for structures of type pattern declaration.`, {
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
            if (reportedElements.has(constraint.name.toLowerCase())) {
                accept('error', `${constraint.$type} has non-unique name '${constraint.name}' (case-insensitive).`, {
                    node: constraint,
                    property: 'name',
                    code: IssueCodes.ConstraintNameNotUnique
                })
            }
            reportedElements.add(constraint.name.toLowerCase());
        });
    }

    checkUniquePatternAlias(pattern: Pattern, accept: ValidationAcceptor) {
        const knownAlias: Set<string> = new Set();
        pattern.objs.forEach(node => {
            knownAlias.add(node.var.name);
        })

        pattern.objs.forEach(node => node.connections.forEach(edge => {
            if (edge.alias != undefined) {
                if (knownAlias.has(edge.alias)) {
                    accept('error', `The pattern already contains an edge, an attribute condition or a node with the alias: "${edge.alias}"`, {
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
                    accept('error', `The pattern already contains an edge, an attribute condition or a node with the alias: "${constraint.alias}"`, {
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

    checkFixSetTypes(fxSet: FixSetStatement, accept: ValidationAcceptor) {
        if (fxSet.val != undefined && fxSet.attr.ref != undefined) {
            const attr: Attribute = fxSet.attr.ref;
            if (attr.type.ptype != undefined && attr.type.etype == undefined) {
                // attribute has primitive type, not enum type
                if (attr.type.ptype == "bool" && !ExprUtils.isBoolExpression(fxSet.val)) {
                    // bool type but default value is not
                    accept('error', `Value does not match specified attribute type (${attr.type.ptype})`, {
                        node: fxSet,
                        property: 'val',
                        code: IssueCodes.FixSetStatementTypeDoesNotMatch
                    })
                } else if (attr.type.ptype == "string" && !ExprUtils.isStringExpression(fxSet.val)) {
                    // string type but default value is not
                    accept('error', `Value does not match specified attribute type (${attr.type.ptype})`, {
                        node: fxSet,
                        property: 'val',
                        code: IssueCodes.FixSetStatementTypeDoesNotMatch
                    })
                } else if (attr.type.ptype == "int" && !ExprUtils.isIntExpression(fxSet.val)) {
                    // int type but default value is not
                    accept('error', `Value does not match specified attribute type (${attr.type.ptype})`, {
                        node: fxSet,
                        property: 'val',
                        code: IssueCodes.FixSetStatementTypeDoesNotMatch
                    })
                } else if ((attr.type.ptype == "double" || attr.type.ptype == "float") && !ExprUtils.isNumberExpressionType(ExprUtils.evaluateExpressionType(fxSet.val))) {
                    // number type but default value is not
                    accept('error', `Value does not match specified attribute type (${attr.type.ptype})`, {
                        node: fxSet,
                        property: 'val',
                        code: IssueCodes.FixSetStatementTypeDoesNotMatch
                    })
                }
            } else if (attr.type.ptype == undefined && attr.type.etype != undefined && attr.type.etype.ref != undefined) {
                // attribute has enum type
                if (ExprUtils.isEnumValueExpression(fxSet.val) && fxSet.val.val != undefined && fxSet.val.val.ref != undefined) {
                    if (attr.type.etype.ref != fxSet.val.val.ref.$container) {
                        accept('error', `Value does not match specified attribute type (${ModelModelingLanguageUtils.getQualifiedClassName(attr.type.etype.ref, attr.type.etype.ref.name)})`, {
                            node: fxSet,
                            property: 'val',
                            code: IssueCodes.FixSetStatementTypeDoesNotMatch
                        })
                    }
                } else if (ExprUtils.isAttributeInvocationVariableExpr(fxSet.val)) {
                    // new value is another attribute
                    if (fxSet.val.val != undefined && fxSet.val.val.ref != undefined && isAttribute(fxSet.val.val.ref)) {
                        const attribute: Attribute = fxSet.val.val.ref as Attribute;
                        const attributeIsPrimitive: boolean = attribute.type.ptype != undefined && attribute.type.etype == undefined;
                        const attributeHasInvalidEnumType: boolean = attribute.type.ptype == undefined && attribute.type.etype != undefined && attribute.type.etype.ref != undefined && attribute.type.etype.ref != attr.type.etype.ref;
                        if (attributeIsPrimitive || attributeHasInvalidEnumType) {
                            accept('error', `Value does not match specified attribute type (${ModelModelingLanguageUtils.getQualifiedClassName(attr.type.etype.ref, attr.type.etype.ref.name)})`, {
                                node: fxSet,
                                property: 'val',
                                code: IssueCodes.FixSetStatementTypeDoesNotMatch
                            })
                        }
                    }
                } else {
                    // new value is no variable and no enum value
                    accept('error', `Value does not match specified attribute type (${ModelModelingLanguageUtils.getQualifiedClassName(attr.type.etype.ref, attr.type.etype.ref.name)})`, {
                        node: fxSet,
                        property: 'val',
                        code: IssueCodes.FixSetStatementTypeDoesNotMatch
                    })
                }
            }
        }
    }

    checkFixCreateEdgeTargetType(fxCreateEdge: FixCreateEdgeStatement, accept: ValidationAcceptor) {
        if (fxCreateEdge.reference != undefined && fxCreateEdge.reference.ref != undefined && fxCreateEdge.reference.ref.type.ref != undefined && fxCreateEdge.toNode != undefined && fxCreateEdge.toNode.ref != undefined && fxCreateEdge.toNode.ref.typing.type != undefined && fxCreateEdge.toNode.ref.typing.type.ref != undefined) {
            const reference: CReference = fxCreateEdge.reference.ref;
            const target: Class | Interface = fxCreateEdge.toNode.ref.typing.type.ref as Class | Interface;
            const providedSupertypes: Set<(Class | Interface)> = ScopingUtils.getAllInheritedAbstractElements(target);
            if (reference.type.ref != undefined && !providedSupertypes.has(reference.type.ref)) {
                accept('error', `${fxCreateEdge.toNode.ref.name} [type: ${target.name}] does not match reference [type: ${reference.type.ref.name}].`, {
                    node: fxCreateEdge,
                    property: 'toNode',
                    code: IssueCodes.FixCreateEdgeStatementReferenceTypeDoesNotMatch
                })
            }
        }
    }

    checkFixCreateNodeAttributeTypes(fxAttrAssign: CreateNodeAttributeAssignment, accept: ValidationAcceptor) {
        if (fxAttrAssign.val != undefined && fxAttrAssign.attr.ref != undefined) {
            const attr: Attribute = fxAttrAssign.attr.ref;
            if (attr.type.ptype != undefined && attr.type.etype == undefined) {
                // attribute has primitive type, not enum type
                if (attr.type.ptype == "bool" && !ExprUtils.isBoolExpression(fxAttrAssign.val)) {
                    // bool type but default value is not
                    accept('error', `Value does not match specified attribute type (${attr.type.ptype})`, {
                        node: fxAttrAssign,
                        property: 'val',
                        code: IssueCodes.FixCreateNodeStatementAttributeTypeDoesNotMatch
                    })
                } else if (attr.type.ptype == "string" && !ExprUtils.isStringExpression(fxAttrAssign.val)) {
                    // string type but default value is not
                    accept('error', `Value does not match specified attribute type (${attr.type.ptype})`, {
                        node: fxAttrAssign,
                        property: 'val',
                        code: IssueCodes.FixCreateNodeStatementAttributeTypeDoesNotMatch
                    })
                } else if (attr.type.ptype == "int" && !ExprUtils.isIntExpression(fxAttrAssign.val)) {
                    // int type but default value is not
                    accept('error', `Value does not match specified attribute type (${attr.type.ptype})`, {
                        node: fxAttrAssign,
                        property: 'val',
                        code: IssueCodes.FixCreateNodeStatementAttributeTypeDoesNotMatch
                    })
                } else if ((attr.type.ptype == "double" || attr.type.ptype == "float") && !ExprUtils.isNumberExpressionType(ExprUtils.evaluateExpressionType(fxAttrAssign.val))) {
                    // number type but default value is not
                    accept('error', `Value does not match specified attribute type (${attr.type.ptype})`, {
                        node: fxAttrAssign,
                        property: 'val',
                        code: IssueCodes.FixCreateNodeStatementAttributeTypeDoesNotMatch
                    })
                }
            } else if (attr.type.ptype == undefined && attr.type.etype != undefined && attr.type.etype.ref != undefined && !ExprUtils.isEnumValueExpression(fxAttrAssign.val)) {
                // attribute has enum type, not primitive type, but default value is no enum value
                accept('error', `Value does not match specified attribute type (${ModelModelingLanguageUtils.getQualifiedClassName(attr.type.etype.ref, attr.type.etype.ref.name)})`, {
                    node: fxAttrAssign,
                    property: 'val',
                    code: IssueCodes.FixCreateNodeStatementAttributeTypeDoesNotMatch
                })
            }
        }
    }

    checkDisableFixContainerNotEmpty(fxContainer: DisableFixContainer, accept: ValidationAcceptor) {
        if (fxContainer.emptyFix) {
            accept('error', `You may not use the Empty Keyword for Disable fixes!`, {
                node: fxContainer,
                property: 'emptyFix',
                code: IssueCodes.DisableFixContainerHasEmptyModifier
            })
        }
    }

    checkEnableFixContainerEmptyOrBound(fxContainer: EnableFixContainer, accept: ValidationAcceptor) {
        if (!fxContainer.emptyFix && fxContainer.fixStatements.length > 0) {
            accept('error', `Enable fixes can only be defined for bound patterns or empty matches!`, {
                node: fxContainer,
                keyword: 'enable',
                code: IssueCodes.EnableFixContainerIsUnboundAndNotEmpty
            })
        }
    }

    checkEmptyEnableFixContainerStatements(fxContainer: EnableFixContainer, accept: ValidationAcceptor) {
        if (fxContainer.emptyFix) {
            fxContainer.fixStatements.forEach((stmt, idx) => {
                if (isFixSetStatement(stmt)) {
                    accept('error', `The attributes of a node cannot be updated in empty enable fixes!`, {
                        node: stmt,
                        code: IssueCodes.InvalidFixStatementInEmptyFixContainer
                    })
                } else if (isFixDeleteEdgeStatement(stmt)) {
                    accept('error', `Edges cannot be deleted in empty enable fixes!`, {
                        node: stmt,
                        code: IssueCodes.InvalidFixStatementInEmptyFixContainer
                    })
                } else if (isFixDeleteNodeStatement(stmt)) {
                    accept('error', `Nodes cannot be deleted in empty enable fixes!`, {
                        node: stmt,
                        code: IssueCodes.InvalidFixStatementInEmptyFixContainer
                    })
                } else if (isFixCreateEdgeStatement(stmt)) {
                    if (stmt.fromNode != undefined && stmt.fromNode.ref != undefined && !isFixCreateNodeStatement(stmt.fromNode.ref.$container)) {
                        accept('error', `You cannot create edges between or to existing nodes in empty enable fixes!`, {
                            node: stmt,
                            property: 'fromNode',
                            code: IssueCodes.InvalidFixStatementInEmptyFixContainer
                        })
                    }
                    if (stmt.toNode != undefined && stmt.toNode.ref != undefined && !isFixCreateNodeStatement(stmt.toNode.ref.$container)) {
                        accept('error', `You cannot create edges between or to existing nodes in empty enable fixes!`, {
                            node: stmt,
                            property: 'toNode',
                            code: IssueCodes.InvalidFixStatementInEmptyFixContainer
                        })
                    }
                }
            })
        }
    }

    checkCreateEdgeStatementTempNodeIdDeclarationBeforeUsage(fxCreateEdge: FixCreateEdgeStatement, accept: ValidationAcceptor) {
        if (fxCreateEdge.fromNode != undefined && fxCreateEdge.fromNode.ref != undefined && isFixCreateNodeStatement(fxCreateEdge.fromNode.ref.$container)) {
            // fromNode uses temporary node id
            const createEdgeStatementIdx: number = fxCreateEdge.$containerIndex!;
            const createNodeStatementIdx: number = fxCreateEdge.fromNode.ref.$container.$containerIndex!;

            if (createEdgeStatementIdx < createNodeStatementIdx) {
                accept('error', `You cannot yet create an edge from this node, as the node will only be created later!`, {
                    node: fxCreateEdge,
                    property: 'fromNode',
                    code: IssueCodes.FixCreateEdgeStatementReferencesTemporaryNodeIdBeforeDeclaration
                })
            }
        }

        if (fxCreateEdge.toNode != undefined && fxCreateEdge.toNode.ref != undefined && isFixCreateNodeStatement(fxCreateEdge.toNode.ref.$container)) {
            // toNode uses temporary node id
            const createEdgeStatementIdx: number = fxCreateEdge.$containerIndex!;
            const createNodeStatementIdx: number = fxCreateEdge.toNode.ref.$container.$containerIndex!;

            if (createEdgeStatementIdx < createNodeStatementIdx) {
                accept('error', `You cannot yet create an edge to this node, as the node will only be created later!`, {
                    node: fxCreateEdge,
                    property: 'toNode',
                    code: IssueCodes.FixCreateEdgeStatementReferencesTemporaryNodeIdBeforeDeclaration
                })
            }
        }
    }
}
