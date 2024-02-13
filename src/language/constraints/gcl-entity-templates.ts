import {
    AbstractElement,
    Attribute,
    BinaryExpression,
    CompactBindingStatement,
    ConstraintDocument,
    EnforceAnnotation,
    EnumEntry,
    Expression,
    ForbidAnnotation,
    isBinaryExpression,
    isDisableDefaultNodeConstraintsAnnotation,
    isEnforceAnnotation,
    isForbidAnnotation,
    isNodeConstraintAnnotation,
    isPattern,
    isPatternObject,
    isUnaryExpression,
    isValueExpr,
    NodeConstraintAnnotation,
    Pattern,
    PatternAttributeConstraint,
    PatternObject,
    PatternObjectReference,
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


    constructor(value: number | boolean | string, resolver: GclReferenceStorage, containerFQName: string = "", elementName: string = "", nodeId: string = "", isAttribute: boolean = false, isEnumLiteral: boolean = false) {
        this.value = value;
        this.valueType = typeof value;
        this.className = containerFQName;
        this.elementName = elementName;
        this.nodeId = nodeId;
        this.isAttribute = isAttribute;
        this.isEnumLiteral = isEnumLiteral;
    }
}

export class ConstraintDocumentEntity {
    readonly patterns: PatternEntity[];
    readonly packageName: string;

    constructor(constraintDoc: ConstraintDocument, packageName: string, resolver: GclReferenceStorage) {
        this.patterns = constraintDoc.patterns.map(x => new PatternEntity(x, resolver));
        this.packageName = packageName;
    }
}