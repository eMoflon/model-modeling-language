import {LayoutOptions} from 'elkjs/lib/elk-api';
import {DefaultLayoutConfigurator} from "sprotty-elk";
import {SGraph, SModelIndex, SNode, SPort} from "sprotty-protocol";

export class ModelLayoutConfigurator extends DefaultLayoutConfigurator {
    protected override graphOptions(sgraph: SGraph, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.algorithm': 'org.eclipse.elk.layered',
            'org.eclipse.elk.direction': "DOWN",
            'org.eclipse.elk.spacing.nodeNode': '30.0',
            'org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers': '30.0',
            //"org.eclipse.elk.edgeLabels.placement": "HEAD", // place labels near the edge "target"
            //"org.eclipse.elk.spacing.edgeLabel": "20", // add spacing between edges and label
            //"org.eclipse.elk.edgeLabels.inline": "true", // edge label is placed directly on its edge
            //"org.eclipse.elk.layered.edgeLabels.sideSelection": "SMART_DOWN", // deciding on edge label sides
        };
    }

    protected override nodeOptions(snode: SNode, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.portAlignment.default': 'CENTER',
            'org.eclipse.elk.portConstraints': 'FIXED_SIDE'
        };
    }

    protected override portOptions(sport: SPort, index: SModelIndex): LayoutOptions {
        return {
            'org.eclipse.elk.port.side': 'EAST',
            'org.eclipse.elk.port.borderOffset': '3.0'
        };
    }


}