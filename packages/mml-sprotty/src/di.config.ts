import './css/diagram.css';
import 'sprotty/css/sprotty.css';
import {Container, ContainerModule} from 'inversify';
import {
    CircularNodeView,
    CircularPort,
    configureModelElement,
    ConsoleLogger,
    DiagramServerProxy,
    labelEditUiModule,
    loadDefaultModules,
    LogLevel,
    overrideViewerOptions,
    RectangularNodeView,
    SCompartmentImpl,
    SCompartmentView,
    SEdgeImpl,
    SGraphImpl,
    SGraphView,
    SLabelImpl,
    SLabelView,
    SNodeImpl,
    SRoutingHandleImpl,
    SRoutingHandleView,
    TYPES
} from 'sprotty';
import {AttributeLabelView, ClassNodeView, NodeIdLabelView, NodeNameLabelView, PolylineArrowEdgeView} from "./views";
import {ElkFactory, ElkLayoutEngine, elkLayoutModule, ILayoutConfigurator} from "sprotty-elk";
import ElkConstructor from "elkjs/lib/elk.bundled"
import {ModelLayoutConfigurator} from "./ModelLayoutConfigurator";
import {ModelServerVSCodeDiagramServer} from "./ModelServerVSCodeDiagramServer";
import {editFeature} from "sprotty/lib/features/edit/model";
import {deletableFeature} from "sprotty/lib/features/edit/delete";
import {ModelNode} from "./model";

const elkFactory: ElkFactory = () => new ElkConstructor({
    algorithms: ['layered']
});

const modelServerVisModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log);

    bind(ModelServerVSCodeDiagramServer).toSelf().inSingletonScope();
    bind(TYPES.ModelSource).toService(ModelServerVSCodeDiagramServer);
    bind(DiagramServerProxy).toService(ModelServerVSCodeDiagramServer);

    bind(TYPES.IModelLayoutEngine).toService(ElkLayoutEngine);
    bind(ElkFactory).toConstantValue(elkFactory);
    bind(ModelLayoutConfigurator).toSelf().inSingletonScope();
    rebind(ILayoutConfigurator).to(ModelLayoutConfigurator).inSingletonScope();

    const context = {bind, unbind, isBound, rebind};
    configureModelElement(context, 'graph', SGraphImpl, SGraphView);
    configureModelElement(context, 'node', SNodeImpl, RectangularNodeView);
    configureModelElement(context, 'node:class', ModelNode, ClassNodeView);
    configureModelElement(context, 'comp:header', SCompartmentImpl, SCompartmentView);
    configureModelElement(context, 'comp:comp', SCompartmentImpl, SCompartmentView);
    configureModelElement(context, 'label', SLabelImpl, SLabelView);
    configureModelElement(context, 'label:name', SLabelImpl, NodeNameLabelView);
    configureModelElement(context, 'label:id', SLabelImpl, NodeIdLabelView);
    configureModelElement(context, 'label:attribute', SLabelImpl, AttributeLabelView);
    configureModelElement(context, 'label:xref', SLabelImpl, SLabelView);
    configureModelElement(context, 'edge', SEdgeImpl, PolylineArrowEdgeView, {disable: [editFeature, deletableFeature]});
    configureModelElement(context, 'port', CircularPort, CircularNodeView)
    //configureModelElement(context, 'html', HtmlRootImpl, HtmlRootView);
    //configureModelElement(context, 'pre-rendered', PreRenderedElementImpl, PreRenderedView);
    //configureModelElement(context, 'palette', SModelRootImpl, HtmlRootView);
    configureModelElement(context, 'routing-point', SRoutingHandleImpl, SRoutingHandleView);
    configureModelElement(context, 'volatile-routing-point', SRoutingHandleImpl, SRoutingHandleView);
});

export function createModelServerVizContainer(widgetId: string): Container {
    const container = new Container();
    loadDefaultModules(container, {exclude: [labelEditUiModule]});
    //container.load(edgeJunctionModule);
    //container.load(edgeIntersectionModule);
    container.load(elkLayoutModule, modelServerVisModule);
    overrideViewerOptions(container, {
        needsClientLayout: true,
        needsServerLayout: false,
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    });

    return container;
}