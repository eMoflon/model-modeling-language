import {
    AbstractElement,
    Attribute,
    BinaryExpression,
    CompactBindingStatement,
    Constraint,
    ConstraintAssertion,
    ConstraintDocument,
    ConstraintPatternDeclaration,
    CreateNodeAttributeAssignment,
    DescriptionAnnotation,
    EnforceAnnotation,
    EnumEntry,
    Expression,
    FixContainer,
    FixCreateEdgeStatement,
    FixCreateNodeStatement,
    FixDeleteEdgeStatement,
    FixDeleteNodeStatement,
    FixInfoStatement,
    FixSetStatement,
    ForbidAnnotation,
    isBinaryExpression,
    isConstraintPatternDeclaration,
    isDescriptionAnnotation,
    isDisableDefaultNodeConstraintsAnnotation,
    isDisableFixContainer,
    isEnableFixContainer,
    isEnforceAnnotation,
    isFixCreateEdgeStatement,
    isFixCreateNodeStatement,
    isFixDeleteEdgeStatement,
    isFixDeleteNodeStatement,
    isFixInfoStatement,
    isFixSetStatement,
    isForbidAnnotation,
    isNodeConstraintAnnotation,
    isPattern,
    isPatternObject,
    isTitleAnnotation,
    isUnaryExpression,
    isValueExpr,
    NodeConstraintAnnotation,
    Pattern,
    PatternAttributeConstraint,
    PatternObject,
    PatternObjectReference,
    TitleAnnotation,
    TypedVariable,
    UnaryExpression
} from "../generated/ast.js";
import {GclReferenceStorage} from "./gcl-reference-storage.js";
import {ModelModelingLanguageUtils} from "../model-modeling-language-utils.js";
import {ExprUtils} from "../expr-utils.js";

export class PatternEntity {
    readonly name: string;
    readonly patternId: string;
    readonly pac: SupportPatternInvocationEntity[] = [];
    readonly nac: SupportPatternInvocationEntity[] = [];
    readonly nodes: PatternNodeEntity[] = [];
    readonly constraints: AttributeConstraintEntity[] = [];
    readonly edges: EdgeEntity[] = [];
    readonly disableDefaultNodeConstraints: boolean;
    readonly nodeConstraints: NodeConstraintEntity[] = [];

    constructor(pattern: Pattern, resolver: GclReferenceStorage) {
        this.name = pattern.name;
        this.patternId = resolver.resolveNode(pattern);
        pattern.annotations.forEach(annotation => {
            if (isEnforceAnnotation(annotation)) {
                this.pac.push(new SupportPatternInvocationEntity(annotation, resolver));
            } else if (isForbidAnnotation(annotation)) {
                this.nac.push(new SupportPatternInvocationEntity(annotation, resolver));
            }
        })
        this.nodes = pattern.objs.map(x => new PatternNodeEntity(x, (x) => this.registerEdge(x), resolver));
        this.constraints = pattern.constraints.map(x => new AttributeConstraintEntity(x, resolver));
        this.disableDefaultNodeConstraints = pattern.annotations.filter(x => isDisableDefaultNodeConstraintsAnnotation(x)).length > 0;
        this.nodeConstraints = pattern.annotations.filter(x => isNodeConstraintAnnotation(x)).map(x => new NodeConstraintEntity(x as NodeConstraintAnnotation, resolver))
    }

    public registerEdge(edge: EdgeEntity) {
        this.edges.push(edge);
    }
}

export class SupportPatternInvocationEntity {
    readonly patternId: string;
    readonly bindings: NodeBindingEntity[] = [];


    constructor(patternInv: EnforceAnnotation | ForbidAnnotation, resolver: GclReferenceStorage) {
        this.patternId = resolver.resolve(patternInv.pattern);
        this.bindings = patternInv.binding.map(x => new NodeBindingEntity(x, resolver));
    }
}

export class NodeBindingEntity {
    readonly node1: string;
    readonly node2: string;

    constructor(binding: CompactBindingStatement, resolver: GclReferenceStorage) {
        if (binding.selfVar.ref != undefined && isPatternObject(binding.selfVar.ref.$container)) {
            this.node1 = resolver.resolveNode(binding.selfVar.ref.$container);
            binding.selfVar.ref.$container
        } else {
            this.node1 = "UNKNOWN"
        }
        if (binding.otherVar.ref != undefined && isPatternObject(binding.otherVar.ref.$container)) {
            this.node2 = resolver.resolveNode(binding.otherVar.ref.$container);
        } else {
            this.node2 = "UNKNOWN"
        }
    }
}

export class NodeConstraintEntity {
    readonly node1Id: string;
    readonly node2Id: string;
    readonly operator: string;


    constructor(annotation: NodeConstraintAnnotation, resolver: GclReferenceStorage) {
        const node1 = annotation.node1.ref;
        const node2 = annotation.node2.ref;

        if (node1 == undefined || node2 == undefined || !isPatternObject(node1.$container) || !isPatternObject(node2.$container)) {
            throw new Error("Could not access NodeConstrain pattern object reference!");
        }

        this.operator = annotation.operator;
        this.node1Id = resolver.getNodeReferenceId(node1.$container);
        this.node2Id = resolver.getNodeReferenceId(node2.$container);
    }
}

export class PatternNodeEntity {
    readonly nodeId: string;
    readonly name: string;
    readonly fqname: string;
    readonly local: boolean;

    constructor(node: PatternObject, edgeRegister: (edge: EdgeEntity) => void, resolver: GclReferenceStorage) {
        this.nodeId = resolver.getNodeReferenceId(node);
        this.name = node.var.name;
        this.local = node.local;
        if (node.var.typing.type != undefined && node.var.typing.type.ref != undefined) {
            const abstractElement: AbstractElement = node.var.typing.type.ref;
            this.fqname = ModelModelingLanguageUtils.getQualifiedClassName(abstractElement, abstractElement.name);
        } else {
            throw new Error("Could not resolve EClass name");
        }
        node.connections.forEach(edge => edgeRegister(new EdgeEntity(edge, resolver)));
    }
}

export class EdgeEntity {
    readonly fromId: string;
    readonly toId: string;
    readonly referenceName: string;
    readonly alias: string | undefined;

    constructor(nodeRef: PatternObjectReference, resolver: GclReferenceStorage) {
        this.fromId = resolver.getNodeReferenceId(nodeRef.$container);
        this.alias = nodeRef.alias;
        if (nodeRef.ref.ref != undefined && nodeRef.patternObj.ref != undefined && isPatternObject(nodeRef.patternObj.ref.$container)) {
            this.referenceName = nodeRef.ref.ref.name;
            this.toId = resolver.resolveNode(nodeRef.patternObj.ref.$container);
        } else {
            throw new Error("Could not resolve EReference name");
        }
    }
}

export class AttributeConstraintEntity {
    readonly expr: ExpressionEntity;
    readonly alias: string | undefined;


    constructor(ac: PatternAttributeConstraint, resolver: GclReferenceStorage) {
        this.expr = new ExpressionEntity(BinaryExpressionEntity.generateChild(ac.expr, resolver));
        this.alias = ac.alias;
    }
}

export class BinaryExpressionEntity {
    readonly left: ExpressionEntity;
    readonly right: ExpressionEntity;
    readonly operator: string;


    constructor(bexpr: BinaryExpression, resolver: GclReferenceStorage) {
        this.operator = bexpr.operator;
        this.left = new ExpressionEntity(BinaryExpressionEntity.generateChild(bexpr.left, resolver));
        this.right = new ExpressionEntity(BinaryExpressionEntity.generateChild(bexpr.right, resolver));
    }

    public static generateChild(expr: Expression, resolver: GclReferenceStorage): PrimaryExpressionEntity | BinaryExpressionEntity | UnaryExpressionEntity {
        if (isBinaryExpression(expr)) {
            return new BinaryExpressionEntity(expr, resolver);
        }
        if (isUnaryExpression(expr)) {
            return new UnaryExpressionEntity(expr, resolver);
        }
        if (isValueExpr(expr)) {
            return new PrimaryExpressionEntity(expr.value, resolver);
        }
        if (ExprUtils.isPatternInvocationVariableExpr(expr) && expr.val.ref != undefined) {
            if (isConstraintPatternDeclaration(expr.val.ref.$container)) {
                return new PrimaryExpressionEntity(expr.val.ref.name, resolver, "", "", resolver.resolve(expr.val), false, false, true);
            } else {
                throw new Error(`PatternInvocationVariable "${expr.val.$refText}" contained in unsupported container "${expr.val.ref.$container.$type}"`);
            }
        }
        if (ExprUtils.isEnumValueExpression(expr) && expr.val.ref != undefined) {
            const enumLit: EnumEntry = expr.val.ref;
            return new PrimaryExpressionEntity(enumLit.name, resolver, "", "", "", false, true);
        }
        if (ExprUtils.isAttributeInvocationVariableExpr(expr) && expr.val.ref != undefined && isPattern(ExprUtils.getExprContainer(expr).$container)) {
            const attr: Attribute = expr.val.ref as Attribute
            const patternConstraint: PatternAttributeConstraint = ExprUtils.getExprContainer(expr) as PatternAttributeConstraint;
            const separatedAttributeAccess: string[] = expr.val.$refText.split(".");
            if (separatedAttributeAccess.length != 2) {
                throw new Error(`Broke AttributeInvocation "${expr.val.$refText}" but received ${separatedAttributeAccess.length} parts!`)
            }
            const patternObjName: string = separatedAttributeAccess.at(0) as string;
            const node: PatternObject | undefined = patternConstraint.$container.objs.filter(x => x.var.name == patternObjName).find(x => x != undefined);
            if (node == undefined) {
                throw new Error(`Unknown pattern node "${patternObjName}"`);
            }
            return new PrimaryExpressionEntity("", resolver, ModelModelingLanguageUtils.getQualifiedClassName(attr.$container, attr.$container.name), attr.name, resolver.getNodeReferenceId(node), true, false);
        }
        throw new Error(`Missing serializer in BinaryExpressionEntity.generateChild() -> ${expr.$type}`);
    }
}

export class UnaryExpressionEntity {
    readonly expr: ExpressionEntity;
    readonly operator: string;

    constructor(uexpr: UnaryExpression, resolver: GclReferenceStorage) {
        this.operator = uexpr.operator;
        this.expr = new ExpressionEntity(BinaryExpressionEntity.generateChild(uexpr.expr, resolver));
    }
}

export class ExpressionEntity {
    readonly expr: PrimaryExpressionEntity | BinaryExpressionEntity | UnaryExpressionEntity;
    readonly isBinary: boolean;
    readonly isUnary: boolean;

    constructor(expr: PrimaryExpressionEntity | BinaryExpressionEntity | UnaryExpressionEntity) {
        this.expr = expr;
        this.isUnary = expr instanceof UnaryExpressionEntity;
        this.isBinary = expr instanceof BinaryExpressionEntity;
    }
}

export class PrimaryExpressionEntity {
    readonly value: number | boolean | string;
    readonly valueType: string;
    readonly className: string;
    readonly elementName: string;
    readonly nodeId: string;
    readonly isAttribute: boolean;
    readonly isEnumLiteral: boolean;
    readonly isPatternDeclarationReference: boolean;

    constructor(value: number | boolean | string, resolver: GclReferenceStorage, containerFQName: string = "", elementName: string = "", nodeId: string = "", isAttribute: boolean = false, isEnumLiteral: boolean = false, isPatternDeclarationReference: boolean = false) {
        this.value = value;
        this.valueType = typeof value;
        this.className = containerFQName;
        this.elementName = elementName;
        this.nodeId = nodeId;
        this.isAttribute = isAttribute;
        this.isEnumLiteral = isEnumLiteral;
        this.isPatternDeclarationReference = isPatternDeclarationReference;
    }
}

export class ConstraintEntity {
    readonly title: string;
    readonly description: string;
    readonly name: string;
    readonly patternDeclarations: ConstraintPatternDeclarationEntity[];
    readonly assertions: ConstraintAssertionEntity[];


    constructor(constraint: Constraint, resolver: GclReferenceStorage) {
        this.name = constraint.name;

        const titleAnnotations: TitleAnnotation[] = constraint.annotations.filter(x => isTitleAnnotation(x)).map(x => x as TitleAnnotation);
        const descriptionAnnotations: DescriptionAnnotation[] = constraint.annotations.filter(x => isDescriptionAnnotation(x)).map(x => x as DescriptionAnnotation);

        this.title = titleAnnotations.at(0)?.value ?? constraint.name;
        this.description = descriptionAnnotations.map(x => x.value).join("\n");

        this.patternDeclarations = constraint.patternDeclarations.map(x => new ConstraintPatternDeclarationEntity(x, resolver));
        this.assertions = constraint.assertions.map(x => new ConstraintAssertionEntity(x, resolver));
    }
}

export class ConstraintPatternDeclarationEntity {
    readonly patternId: string;
    readonly declarationId: string;
    readonly name: string;
    readonly fixContainer: FixContainerEntity[];


    constructor(pDeclaration: ConstraintPatternDeclaration, resolver: GclReferenceStorage) {
        this.name = pDeclaration.var.name;
        this.patternId = resolver.resolve(pDeclaration.pattern);
        this.declarationId = resolver.getNodeReferenceId(pDeclaration);
        this.fixContainer = pDeclaration.fixContainers.map(x => new FixContainerEntity(x, resolver));
    }
}

export class FixContainerEntity {
    readonly isEnableContainer: boolean;
    readonly fixTitle: string;
    readonly statements: FixStatementEntity[];


    constructor(fixContainer: FixContainer, resolver: GclReferenceStorage) {
        this.isEnableContainer = isEnableFixContainer(fixContainer) && !isDisableFixContainer(fixContainer)
        this.fixTitle = fixContainer.fixTitle ?? `QuickFix ${fixContainer.$containerIndex ?? "UNKNOWN"}`;
        this.statements = fixContainer.fixStatements.map(x => {
            if (isFixInfoStatement(x)) {
                return new FixInfoStatementEntity(x);
            } else if (isFixCreateNodeStatement(x)) {
                return new FixCreateNodeEntity(x, resolver);
            } else if (isFixCreateEdgeStatement(x)) {
                return new FixCreateEdgeEntity(x, resolver);
            } else if (isFixDeleteNodeStatement(x)) {
                return new FixDeleteNodeEntity(x);
            } else if (isFixDeleteEdgeStatement(x)) {
                return new FixDeleteEdgeEntity(x);
            } else if (isFixSetStatement(x)) {
                return new FixSetStatementEntity(x, resolver);
            }
            return undefined;
        }).filter(x => x != undefined)
            .map(x => x as FixStatementEntity);
    }
}

interface FixStatementEntity {
    readonly type: string;
}

export class FixInfoStatementEntity implements FixStatementEntity {
    readonly msg: string;
    readonly type: string;

    constructor(infoStmt: FixInfoStatement) {
        this.msg = infoStmt.msg;
        this.type = "INFO";
    }
}

export class FixSetStatementEntity implements FixStatementEntity {
    readonly type: string;
    readonly patternNodeName: string;
    readonly attributeName: string;
    readonly customizationRequired: boolean;
    readonly attributeValue: PrimaryExpressionEntity | undefined;

    constructor(setStmt: FixSetStatement, resolver: GclReferenceStorage) {
        this.type = "SET";
        const splitted = setStmt.attr.$refText.split(".");
        if (setStmt.attr.ref == undefined || splitted.length != 2) {
            throw new Error("Invalid FixSetStatement attribute!");
        }
        this.patternNodeName = splitted.at(0) as string;
        this.attributeName = splitted.at(1) as string;

        this.customizationRequired = setStmt.val == undefined;

        if (setStmt.val != undefined) {
            if (ExprUtils.isEnumValueExpression(setStmt.val) && setStmt.val.val.ref != undefined) {
                this.attributeValue = new PrimaryExpressionEntity(setStmt.val.val.ref.name, resolver);
            } else if (isValueExpr(setStmt.val)) {
                this.attributeValue = new PrimaryExpressionEntity(setStmt.val.value, resolver);
            } else {
                throw new Error(`Unable to assign attribute value: ${setStmt.attr.$refText}`);
            }
        }
    }
}

export class FixDeleteEdgeEntity implements FixStatementEntity {
    readonly fromPatternNodeName: string;
    readonly toPatternNodeName: string;
    readonly referenceName: string;
    readonly type: string;


    constructor(delEdgeStmt: FixDeleteEdgeStatement) {
        if (delEdgeStmt.edge.ref != undefined && delEdgeStmt.edge.ref.ref != undefined && delEdgeStmt.edge.ref.ref.ref != undefined && delEdgeStmt.edge.ref.patternObj.ref != undefined) {
            this.referenceName = delEdgeStmt.edge.ref.ref.ref.name;
            this.fromPatternNodeName = delEdgeStmt.edge.ref.$container.var.name;
            this.toPatternNodeName = delEdgeStmt.edge.ref.patternObj.ref.name;
            this.type = "DELETE_EDGE";
        } else {
            throw new Error("Unable to resolve FixDeleteEdgeStatement edge reference!");
        }
    }
}

export class FixDeleteNodeEntity implements FixStatementEntity {
    readonly nodeAlias: string;
    readonly type: string;

    constructor(delNodeStmt: FixDeleteNodeStatement) {
        if (delNodeStmt.node.ref != undefined) {
            this.nodeAlias = delNodeStmt.node.ref.name;
            this.type = "DELETE_EDGE";
        } else {
            throw new Error("Unable to resolve FixDeleteEdgeStatement edge reference!");
        }
    }
}

export class FixCreateEdgeEntity implements FixStatementEntity {
    readonly fromPatternNodeName: string;
    readonly fromNameIsTemp: boolean;
    readonly toPatternNodeName: string;
    readonly toNameIsTemp: boolean;
    readonly referenceName: string;
    readonly type: string;

    constructor(creEdgeStmt: FixCreateEdgeStatement, resolver: GclReferenceStorage) {
        this.type = "CREATE_EDGE";
        if (creEdgeStmt.fromNode.ref == undefined || creEdgeStmt.toNode.ref == undefined) {
            throw new Error("Unable to resolve FixCreateEdgeStatement node!");
        } else if (creEdgeStmt.reference.ref == undefined) {
            throw new Error("Unable to resolve FixCreateEdgeStatement reference!");
        }

        this.referenceName = creEdgeStmt.reference.ref.name;

        const fromVar: TypedVariable = creEdgeStmt.fromNode.ref;
        const toVar: TypedVariable = creEdgeStmt.toNode.ref;
        if (isFixCreateNodeStatement(fromVar.$container)) {
            this.fromPatternNodeName = resolver.resolveNode(fromVar);
            this.fromNameIsTemp = true;
        } else if (isPatternObject(fromVar.$container)) {
            this.fromPatternNodeName = fromVar.name
            this.fromNameIsTemp = false;
        } else {
            throw new Error("Invalid TypedVariable container -> fromVar");
        }

        if (isFixCreateNodeStatement(toVar.$container)) {
            this.toPatternNodeName = resolver.resolveNode(toVar);
            this.toNameIsTemp = true;
        } else if (isPatternObject(toVar.$container)) {
            this.toPatternNodeName = toVar.name
            this.toNameIsTemp = false;
        } else {
            throw new Error("Invalid TypedVariable container -> toVar");
        }
    }
}

export class FixCreateNodeEntity implements FixStatementEntity {
    readonly tempNodeName: string;
    readonly nodeType: string;
    readonly attributeAssignments: CreateNodeAttributeAssignmentEntity[];
    readonly type: string;

    constructor(creNodeStmt: FixCreateNodeStatement, resolver: GclReferenceStorage) {
        this.type = "CREATE_NODE";
        this.tempNodeName = resolver.resolveNode(creNodeStmt.nodeVar);
        if (creNodeStmt.nodeVar.typing.type != undefined && creNodeStmt.nodeVar.typing.type.ref != undefined) {
            const abstractElement: AbstractElement = creNodeStmt.nodeVar.typing.type.ref;
            this.nodeType = ModelModelingLanguageUtils.getQualifiedClassName(abstractElement, abstractElement.name);
        } else {
            throw new Error("Could not resolve EClass name");
        }
        this.attributeAssignments = creNodeStmt.assignments.map(x => new CreateNodeAttributeAssignmentEntity(x, resolver));
    }
}

export class CreateNodeAttributeAssignmentEntity {
    readonly attributeName: string;
    readonly attributeValue: PrimaryExpressionEntity;

    constructor(assignment: CreateNodeAttributeAssignment, resolver: GclReferenceStorage) {
        if (assignment.attr.ref != undefined) {
            this.attributeName = assignment.attr.ref.name;
            if (ExprUtils.isEnumValueExpression(assignment.val) && assignment.val.val.ref != undefined) {
                this.attributeValue = new PrimaryExpressionEntity(assignment.val.val.ref.name, resolver);
            } else if (isValueExpr(assignment.val)) {
                this.attributeValue = new PrimaryExpressionEntity(assignment.val.value, resolver);
            } else {
                throw new Error(`Unable to assign attribute value: ${assignment.attr.$refText}`);
            }
        } else {
            throw new Error(`Unable to resolve attribute: ${assignment.attr.$refText}`);
        }
    }
}

export class ConstraintAssertionEntity {
    readonly expr: ExpressionEntity;

    constructor(assertion: ConstraintAssertion, resolver: GclReferenceStorage) {
        this.expr = new ExpressionEntity(BinaryExpressionEntity.generateChild(assertion.expr, resolver));
    }
}

export class ConstraintDocumentEntity {
    readonly patterns: PatternEntity[];
    readonly constraints: ConstraintEntity[];
    readonly packageName: string;

    constructor(constraintDoc: ConstraintDocument, packageName: string, resolver: GclReferenceStorage) {
        this.patterns = constraintDoc.patterns.map(x => new PatternEntity(x, resolver));
        this.constraints = constraintDoc.constraints.map(x => new ConstraintEntity(x, resolver))
        this.packageName = packageName;
    }
}