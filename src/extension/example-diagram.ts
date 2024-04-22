import {SCompartment, SEdge, SLabel, SModelRoot, SNode, SPort} from "sprotty-protocol";
import {EdgeLayoutable} from "sprotty";

export function getTestModel(): SModelRoot {
    return <SModelRoot>{
        type: 'graph',
        id: 'root',
        children: [
            {
                type: 'node',
                id: 'chd1',
                children: [
                    <SLabel>{
                        type: 'label',
                        id: 'chd1.label',
                        text: "Node 1"
                    }
                ],
                layout: 'stack',
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddingLeft: 10.0,
                    paddingRight: 10.0
                }
            } as SNode,
            {
                type: 'node',
                id: 'chd2',
                children: [
                    <SLabel>{
                        type: 'label',
                        id: 'chd2.label',
                        text: "Node 2"
                    }
                ],
                layout: 'stack',
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddingLeft: 10.0,
                    paddingRight: 10.0
                }
            } as SNode,
            {
                type: 'node',
                id: 'chd3',
                children: [
                    <SLabel>{
                        type: 'label',
                        id: 'chd3.label',
                        text: "Node 3"
                    },
                    <SPort>{
                        type: 'port',
                        id: 'chd3.prt1'
                    }
                ],
                layout: 'stack',
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddingLeft: 10.0,
                    paddingRight: 10.0
                }
            } as SNode,
            {
                type: 'node',
                id: 'chd4',
                children: [
                    <SLabel>{
                        type: 'label',
                        id: 'chd4.label',
                        text: "Node 4"
                    },
                    <SPort>{
                        type: 'port',
                        id: 'chd4.prt1'
                    },
                    <SPort>{
                        type: 'port',
                        id: 'chd4.prt2'
                    }
                ],
                layout: 'stack',
                layoutOptions: {
                    paddingTop: 10.0,
                    paddingBottom: 10.0,
                    paddingLeft: 10.0,
                    paddingRight: 10.0
                }
            } as SNode,
            createEdge("edge1", "Edge1", "chd2", "chd3"),
            createEdge("edge2", "Edge2", "chd3.prt1", "chd4.prt2"),
        ]
    }
}


export function getTestClass(): SModelRoot {
    return <SModelRoot>{
        type: 'graph',
        id: 'model-root',
        children: [
            createClass("TestClass 1", "cls1", [{name: "attr1", value: "1234"}, {
                name: "attribute 2",
                value: "\"Test Value\""
            }])
        ]
    }
}

export function getTestClass2(): SModelRoot {
    return <SModelRoot>{
        type: 'graph',
        id: 'model-root',
        children: [
            createClass("TestClass 1", "cls1", [{name: "attr1", value: "1234"}, {
                name: "attribute 2",
                value: "\"Test Value\""
            }]),
            createClass("TestClass 2", "cls2", [{name: "attr1", value: "1234"}, {
                name: "attribute 2",
                value: "\"Test Value\""
            }]),
            createClass("TestClass 3", "cls3", [{name: "attr1", value: "1234"}, {
                name: "attribute 2",
                value: "\"Test Value\""
            }]),
            createClass("TestClass 4", "cls4", [{name: "attr1", value: "1234"}, {
                name: "attribute 2",
                value: "\"Test Value\""
            }]),
            createEdge("edg1", "Edge1", "cls1", "cls2"),
            createEdge("edg2", "Edge2", "cls1", "cls3"),
            createEdge("edg3", "Edge3", "cls1", "cls4"),
            createEdge("edg4", "Edge4", "cls2", "cls4"),
        ]
    }
}

interface NodeAttribute {
    name: string;
    value: string;
}

function createClass(title: string, id: string, attributes: NodeAttribute[]) {
    const attributeElements = attributes.map((value, index) =>
        <SLabel>{
            type: 'label:attribute',
            id: `${id}-comp-comp-attr${index}`,
            text: `${value.name} = ${value.value}`
        });

    return <SNode>{
        type: 'node:class',
        id: `${id}`,
        layout: 'vbox',
        children: [
            <SCompartment>{
                type: 'comp:header',
                id: `${id}-comp-header`,
                layout: 'hbox',
                children: [
                    <SLabel>{
                        type: 'label:name',
                        id: `${id}-comp-header-name`,
                        text: `${title}`
                    }
                ]
            },
            <SCompartment>{
                type: 'comp:comp',
                id: `${id}-comp-comp`,
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

function createEdge(edgeId: string, edgeLabel: string, fromId: string, toId: string) {
    return <SEdge>{
        type: 'edge',
        id: `${edgeId}`,
        sourceId: `${fromId}`,
        targetId: `${toId}`,
        children: [
            <SLabel & EdgeLayoutable>{
                type: 'label:xref',
                id: `${edgeId}.label`,
                text: `${edgeLabel}`,
                edgePlacement: {
                    side: "on",
                    offset: -2,
                    position: 0,
                    rotate: false
                }
            }
        ]
    }
}