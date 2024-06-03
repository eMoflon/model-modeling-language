import {SCompartment, SEdge, SLabel, SModelRoot, SNode} from "sprotty-protocol";
import {EdgeLayoutable} from "sprotty";
import {VisualizationEdge, VisualizationNode} from "./generated/de/nexus/modelserver/ModelServerVisualization_pb.js";

interface NodeAttribute {
    name: string;
    value: string;
}

interface ModelNodeSchema {
    highlight: boolean;
}

export class ModelServerVisualBuilder {
    public static createModelRoot(id: string, nodes: SNode[], edges: SEdge[]): SModelRoot {
        return <SModelRoot>{
            type: 'graph',
            id: id,
            children: [
                ...nodes,
                ...edges
            ]
        }
    }

    public static createNode(title: string, id: string, attributes: NodeAttribute[], highlight: boolean): SNode {
        const attributeElements = attributes.map((value, index) =>
            <SLabel>{
                type: 'label:attribute',
                id: `node-${id}-comp-comp-attr${index}`,
                text: `${value.name} = ${value.value}`
            });

        return <SNode & ModelNodeSchema>{
            type: 'node:class',
            id: `node-${id}`,
            layout: 'vbox',
            highlight: highlight,
            children: [
                <SCompartment>{
                    type: 'comp:header',
                    id: `node-${id}-comp-header`,
                    layout: 'hbox',
                    layoutOptions: {
                        hAlign: "center",
                        hGap: 10,
                        resizeContainer: true
                    },
                    children: [
                        <SLabel>{
                            type: 'label:id',
                            id: `node-${id}-comp-header-id`,
                            text: `${id}`,
                        },
                        <SLabel>{
                            type: 'label:name',
                            id: `node-${id}-comp-header-name`,
                            text: `${title}`
                        }
                    ]
                },
                <SCompartment>{
                    type: 'comp:comp',
                    id: `node-${id}-comp-comp`,
                    layout: 'vbox',
                    layoutOptions: {
                        hAlign: 'left',
                        paddingTop: 15,
                        resizeContainer: true
                    },
                    children: attributeElements
                }
            ]
        }
    }

    public static createEdge(edgeLabel: string, fromId: string, toId: string): SEdge {
        const edgeId = `${fromId}-${edgeLabel}-${toId}`;
        return <SEdge>{
            type: 'edge',
            id: `${edgeId}`,
            sourceId: `node-${fromId}`,
            targetId: `node-${toId}`,
            routerKind: 'manhattan',
            children: [
                <SLabel & EdgeLayoutable>{
                    type: 'label:xref',
                    id: `${edgeId}.label`,
                    text: `${edgeLabel}`,
                    edgePlacement: {
                        side: "on",
                        offset: 20,
                        position: 0.5,
                        rotate: false
                    }
                }
            ]
        }
    }

    public static mapVisualizationNode(visNode: VisualizationNode): SNode {
        const attributes: NodeAttribute[] = visNode.attributes.map(x => <NodeAttribute>{
            name: x.attributeName,
            value: x.attributeValue
        });
        const nodeName: string = `node${visNode.nodeId}:${visNode.nodeType}`;
        const nodeId: string = visNode.nodeId.toString();
        const highlightNode: boolean = visNode.options != undefined && visNode.options.highlight;
        return ModelServerVisualBuilder.createNode(nodeName, nodeId, attributes, highlightNode);
    }

    public static mapVisualizationEdge(visEdge: VisualizationEdge): SEdge {
        return ModelServerVisualBuilder.createEdge(visEdge.edgeName, visEdge.fromNodeId.toString(), visEdge.toNodeId.toString());
    }
}