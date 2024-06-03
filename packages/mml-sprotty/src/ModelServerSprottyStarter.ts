import "reflect-metadata";
import 'sprotty-vscode-webview/css/sprotty-vscode.css';
import {SprottyDiagramIdentifier, SprottyStarter} from "sprotty-vscode-webview";
import {Container} from 'inversify';
import {createModelServerVizContainer} from "./di.config";
import {VsCodeApi, VsCodeMessenger} from "sprotty-vscode-webview/lib/services";
import {VscodeDiagramWidget, VscodeDiagramWidgetFactory} from "sprotty-vscode-webview/lib/vscode-diagram-widget";
import {KeyTool} from "sprotty";
import {DisabledKeyTool} from "sprotty-vscode-webview/lib/disabled-keytool";

export class ModelServerSprottyStarter extends SprottyStarter {


    constructor() {
        super();
        console.log("Init Starter...")
        window.addEventListener('message', (event: { data: unknown }) => {
            console.log(JSON.stringify(event.data));
        });
    }

    protected createContainer(diagramIdentifier: SprottyDiagramIdentifier): Container {
        return createModelServerVizContainer(diagramIdentifier.clientId);
    }


    protected override addVscodeBindings(container: Container, diagramIdentifier: SprottyDiagramIdentifier) {
        container.bind(VsCodeApi).toConstantValue(this.vscodeApi);
        container.bind(VsCodeMessenger).toConstantValue(this.messenger);
        container.bind(VscodeDiagramWidget).toSelf().inSingletonScope();
        container.bind(VscodeDiagramWidgetFactory).toFactory(context => {
            return () => context.container.get<VscodeDiagramWidget>(VscodeDiagramWidget);
        });
        container.bind(SprottyDiagramIdentifier).toConstantValue(diagramIdentifier);
        container.rebind(KeyTool).to(DisabledKeyTool);
    }
}

new ModelServerSprottyStarter().start();