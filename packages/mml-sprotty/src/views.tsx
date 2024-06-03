/** @jsx svg */
import {injectable} from 'inversify';
import {VNode} from 'snabbdom';
import {
    IView,
    PolylineEdgeView,
    RectangularNodeView,
    RenderingContext,
    SEdgeImpl,
    SLabelImpl,
    SLabelView,
    SPortImpl,
    svg
} from 'sprotty';
import {Point, toDegrees} from 'sprotty-protocol';
import {ModelNode} from "./model";

@injectable()
export class PolylineArrowEdgeView extends PolylineEdgeView {

    protected override renderAdditionals(edge: SEdgeImpl, segments: Point[], context: RenderingContext): VNode[] {
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        return [
            <path class-sprotty-edge-arrow={true} d='M 6,-3 L 0,0 L 6,3 Z'
                  transform={`rotate(${this.angle(p2, p1)} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`}/>
        ];
    }

    angle(x0: Point, x1: Point): number {
        return toDegrees(Math.atan2(x1.y - x0.y, x1.x - x0.x));
    }
}

@injectable()
export class TriangleButtonView implements IView {
    render(model: SPortImpl, context: RenderingContext): VNode {
        return <path class-sprotty-button={true} d='M 0,0 L 8,4 L 0,8 Z'/>;
    }
}

@injectable()
export class ClassNodeView extends RectangularNodeView {
    override render(node: Readonly<ModelNode>, context: RenderingContext): VNode {

        const rhombStr = "M 0,38  L " + node.bounds.width + ",38";

        const classNode: any = (<g class-node={true} class-sprotty-node-highlight={node.highlight}>
            <defs>
                <filter id="dropShadow">
                    <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.4"/>
                </filter>
            </defs>

            <rect class-sprotty-node={true} class-selected={node.selected} class-mouseover={node.hoverFeedback}
                  x={0} y={0} rx={5} ry={5}
                  width={Math.max(0, node.bounds.width)} height={Math.max(0, node.bounds.height)}/>
            {context.renderChildren(node)}
            {(node.children[1] && node.children[1].children.length > 0) ?
                <path class-sprotty-edge={true} d={rhombStr}></path> : ""}
        </g>);
        return classNode;
    }
}

@injectable()
export class NodeIdLabelView extends SLabelView {
    override render(labelNode: SLabelImpl, context: RenderingContext): VNode {
        const trueWidth = Math.max(0, labelNode.bounds.width);
        const trueHeight = Math.max(0, labelNode.bounds.height);
        const xOffset = 2;
        const yOffset = 2;
        const width = trueWidth + (2 * xOffset);
        const height = trueHeight;// + (2 * yOffset);

        const vnode: any = (
            <g
                class-selected={labelNode.selected}
                class-sprotty-label-node={true}
            >
                <rect x={-xOffset} y={-(height / 2)} rx={7} ry={7} width={width}
                      height={height}
                      data={`${trueWidth} | ${trueHeight} | ${width} | ${height}`}
                      class-sprotty-label-id-background={true}/>
                <text class-sprotty-label-id-foreground={true} x={0} y={2 * yOffset}>{labelNode.text}</text>
            </g>
        );
        return vnode;
    }
}

@injectable()
export class NodeNameLabelView extends SLabelView {
    override render(label: Readonly<SLabelImpl>, context: RenderingContext): VNode | undefined {
        return <text class-sprotty-label={true} class-sprotty-label-class-name={true}>{label.text}</text>;
    }
}


@injectable()
export class AttributeLabelView extends SLabelView {
    override render(labelNode: SLabelImpl, context: RenderingContext): VNode {
        const vnode: any = (
            <g
                class-selected={labelNode.selected}
                class-sprotty-label-node={true}
            >
                <text class-sprotty-label={true} x={0}>{labelNode.text}</text>
            </g>
        );
        return vnode;
    }
}