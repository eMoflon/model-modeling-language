import {
    CompactBindingStatement,
    ConstraintDocument,
    EnforceAnnotation,
    ForbidAnnotation,
    isEnforceAnnotation,
    isForbidAnnotation,
    isPatternObject,
    Pattern,
    PatternObject,
    PatternObjectReference
} from "../generated/ast.js";
import {GclReferenceStorage} from "./gcl-reference-storage.js";

export class PatternEntity {
    readonly name: string;
    readonly patternId: string;
    readonly pac: SupportPatternInvocationEntity[] = [];
    readonly nac: SupportPatternInvocationEntity[] = [];
    readonly nodes: PatternNodeEntity[] = [];
    readonly constraints: AttributeConstraintEntity[] = [];
    readonly edges: EdgeEntity[] = [];

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

export class PatternNodeEntity {
    readonly nodeId: string;
    readonly name: string;
    readonly className: string;

    constructor(node: PatternObject, edgeRegister: (edge: EdgeEntity) => void, resolver: GclReferenceStorage) {
        this.nodeId = resolver.getNodeReferenceId(node);
        this.name = node.var.name;
        if (node.var.typing.type != undefined && node.var.typing.type.ref != undefined) {
            this.className = node.var.typing.type.ref.name;
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

}

export class ConstraintDocumentEntity {
    readonly patterns: PatternEntity[];

    constructor(constraintDoc: ConstraintDocument, resolver: GclReferenceStorage) {
        this.patterns = constraintDoc.patterns.map(x => new PatternEntity(x, resolver));
    }
}