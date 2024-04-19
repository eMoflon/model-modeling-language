import {
    EdgeEntity,
    NodeBindingEntity,
    PatternEntity,
    PatternNodeEntity,
    SupportPatternInvocationEntity
} from "./gcl-entity-templates.js";
import {
    Constraint,
    ConstraintPatternDeclaration,
    isConstraintPatternDeclaration,
    isPatternExtensionAnnotation,
    isPatternObject,
    Pattern,
    PatternExtensionAnnotation,
    PatternObject,
    TypedVariable,
    UntypedVariable,
} from "../generated/ast.js";
import {v4 as uuid4} from "uuid";
import {GclPatternCollector, InternalPatternBlueprint} from "./gcl-pattern-collector.js";
import {GclReferenceStorage} from "./gcl-reference-storage.js";

export class GclInternalPatternBuilder {
    public static buildInternalBindPattern(varDec: ConstraintPatternDeclaration, patternCollector: GclPatternCollector): string {
        const constraint: Constraint = varDec.$container;
        const basePattern: Pattern = this.getBasePattern(varDec);
        const basePatternEntity: PatternEntity = patternCollector.patternEntityByPattern(basePattern);

        const internalPatternName: string = `GCLInternal_${constraint.name}_${varDec.var.name}`;
        const internalPatternId: string = uuid4();

        const {nodes, edges, nodeMapping} = this.copyPatternBase(basePatternEntity)


        const internalPattern: InternalPatternBlueprint = new InternalPatternBlueprint(internalPatternName, internalPatternId, nodes, edges);

        patternCollector.pushInternal(internalPattern, varDec, nodeMapping);

        return internalPatternId;
    }

    public static finalizeInternalBindPattern(referenceStorage: GclReferenceStorage, patternCollector: GclPatternCollector) {
        for (const internalPatternContainer of patternCollector.internalPatternCollection) {
            const bindAnnotation: PatternExtensionAnnotation = internalPatternContainer.variableDeclaration.annotations.filter(x => isPatternExtensionAnnotation(x)).map(x => x as PatternExtensionAnnotation).at(0)!;
            const positivePatternInvocations: SupportPatternInvocationEntity[] = this.buildBindPatternInvocations(internalPatternContainer.variableDeclaration, bindAnnotation, internalPatternContainer.nodeMapping, referenceStorage, patternCollector);
            const internalPattern: PatternEntity = internalPatternContainer.patternBlueprint.build(positivePatternInvocations, []);
            patternCollector.push(internalPattern);
        }
    }

    private static buildBindPatternInvocations(varDec: ConstraintPatternDeclaration, bindAnnotation: PatternExtensionAnnotation, nodeIdMap: Map<string, string>, referenceStorage: GclReferenceStorage, patternCollector: GclPatternCollector): SupportPatternInvocationEntity[] {
        const patternInvocations: SupportPatternInvocationEntity[] = [];
        const basePatternNodeBindings: NodeBindingEntity[] = [...nodeIdMap.entries()].map(x => ({
            node1: x[1],
            node2: x[0]
        } as NodeBindingEntity))

        const basePattern: Pattern = this.getBasePattern(varDec);

        const basePatternInvocation: SupportPatternInvocationEntity = {
            patternId: referenceStorage.getNodeReferenceId(basePattern),
            bindings: basePatternNodeBindings
        };
        patternInvocations.push(basePatternInvocation);

        if (bindAnnotation.basePattern == undefined || bindAnnotation.basePattern.ref == undefined || !isConstraintPatternDeclaration(bindAnnotation.basePattern.ref.$container)) {
            throw new Error("Could not build BindPatternInvocations - failed to resolve extendedPatternDeclaration");
        }


        const extendedPatternDeclarationVar: UntypedVariable = bindAnnotation.basePattern.ref!;
        const extendedPatternDeclaration: ConstraintPatternDeclaration = extendedPatternDeclarationVar.$container as ConstraintPatternDeclaration;

        if (extendedPatternDeclaration.pattern == undefined || extendedPatternDeclaration.pattern.ref == undefined) {
            throw new Error("Could not build BindPatternInvocations - failed to resolve extendedPattern");
        }
        const extendedPattern: Pattern = extendedPatternDeclaration.pattern.ref;

        const nodeBindings: NodeBindingEntity[] = [];

        const extendedPatternIsInternal: boolean = patternCollector.hasInternalPatternByDeclaration(extendedPatternDeclaration);

        for (const bindElement of bindAnnotation.binding) {
            if (bindElement.selfVar.ref == undefined || !isPatternObject(bindElement.selfVar.ref.$container)) {
                throw new Error("Could not build BindPatternInvocations - failed to resolve selfVar");
            }
            const selfNodeVar: TypedVariable = bindElement.selfVar.ref!;
            const selfNodeElement: PatternObject = selfNodeVar.$container as PatternObject;
            const selfNodeId: string = referenceStorage.getNodeReferenceId(selfNodeElement);
            const mappedSelfNodeId: string = nodeIdMap.get(selfNodeId)!;

            if (bindElement.otherVar.ref == undefined || !isPatternObject(bindElement.otherVar.ref.$container)) {
                throw new Error("Could not build BindPatternInvocations - failed to resolve otherVar");
            }

            if (extendedPatternIsInternal) {
                const otherNodeIdMap = patternCollector.internalPatternEntityByDeclaration(extendedPatternDeclaration).nodeMapping;

                const otherNodeVar: TypedVariable = bindElement.otherVar.ref!;
                const otherNodeElement: PatternObject = otherNodeVar.$container as PatternObject;
                const otherNodeId: string = referenceStorage.getNodeReferenceId(otherNodeElement);
                const mappedOtherNodeId: string = otherNodeIdMap.get(otherNodeId)!;

                const nodeBind: NodeBindingEntity = {
                    node1: mappedSelfNodeId,
                    node2: mappedOtherNodeId
                };

                nodeBindings.push(nodeBind);
            } else {
                const otherNodeVar: TypedVariable = bindElement.otherVar.ref!;
                const otherNodeElement: PatternObject = otherNodeVar.$container as PatternObject;
                const otherNodeId: string = referenceStorage.getNodeReferenceId(otherNodeElement);

                const nodeBind: NodeBindingEntity = {
                    node1: mappedSelfNodeId,
                    node2: otherNodeId
                };

                nodeBindings.push(nodeBind);
            }
        }

        if (extendedPatternIsInternal) {
            const extendingInternalPatternId = patternCollector.internalPatternEntityByDeclaration(extendedPatternDeclaration).patternBlueprint.patternId;

            const newInvocation: SupportPatternInvocationEntity = {
                patternId: extendingInternalPatternId,
                bindings: nodeBindings
            }
            patternInvocations.push(newInvocation);
        } else {
            const newInvocation: SupportPatternInvocationEntity = {
                patternId: referenceStorage.getNodeReferenceId(extendedPattern),
                bindings: nodeBindings
            }
            patternInvocations.push(newInvocation);
        }

        return patternInvocations;
    }

    private static copyPatternBase(patternEntity: PatternEntity) {
        const nodeIdMapping: Map<string, string> = new Map<string, string>();
        const newNodes: PatternNodeEntity[] = [];
        const newEdges: EdgeEntity[] = [];
        patternEntity.nodes.forEach(node => {
            const newId: string = uuid4();
            nodeIdMapping.set(node.nodeId, newId);
            const newNode: PatternNodeEntity = {
                name: node.name,
                fqname: node.fqname,
                local: false,
                nodeId: newId
            };
            newNodes.push(newNode);
        });

        patternEntity.edges.forEach(edge => {
            if (edge.alias != undefined) {
                const newEdge: EdgeEntity = {
                    referenceName: edge.referenceName,
                    alias: edge.alias,
                    fromId: nodeIdMapping.get(edge.fromId)!,
                    toId: nodeIdMapping.get(edge.toId)!
                }
                newEdges.push(newEdge);
            }
        });

        return {nodes: newNodes, edges: newEdges, nodeMapping: nodeIdMapping};
    }

    private static getBasePattern(varDec: ConstraintPatternDeclaration) {
        if (varDec.pattern != undefined && varDec.pattern.ref != undefined) {
            return varDec.pattern.ref;
        } else {
            throw new Error("Unable to resolve ConstraintPatternDeclaration base pattern!");
        }
    }

    public static getExtendedPatternDeclaration(varDec: ConstraintPatternDeclaration) {
        if (varDec.annotations == undefined || varDec.annotations.length == 0) {
            return undefined;
        }
        const pExtendingAnnotations: PatternExtensionAnnotation[] = varDec.annotations.filter(x => isPatternExtensionAnnotation(x)).map(x => x as PatternExtensionAnnotation);

        if (pExtendingAnnotations.length == 0) {
            return undefined;
        }

        const pExtension: PatternExtensionAnnotation = pExtendingAnnotations[0];


        if (pExtension.basePattern != undefined && pExtension.basePattern.ref != undefined && isConstraintPatternDeclaration(pExtension.basePattern.ref.$container)) {
            return pExtension.basePattern.ref.$container;
        }

        return undefined;

    }
}