import {VscodeDiagramServer} from "sprotty-vscode-webview";
import {ComputedBoundsAction, IModelLayoutEngine, SModelRoot} from "sprotty-protocol";
import {inject, optional} from "inversify";
import {TYPES} from "sprotty/lib/base/types";
import {SetModelAction, UpdateModelAction} from "sprotty-protocol/lib/actions";

export class ModelServerVSCodeDiagramServer extends VscodeDiagramServer {
    @inject(TYPES.IModelLayoutEngine) @optional() protected layoutEngine?: IModelLayoutEngine;

    protected override handleComputedBounds(action: ComputedBoundsAction): boolean {
        this.logger.log(this, "HandleCustomComputedBounds");
        if (this.viewerOptions.needsServerLayout) {
            return true;
        } else {
            const root = this.currentRoot;
            this.computedBoundsApplicator.apply(root, action);

            if (this.layoutEngine !== undefined) {
                const layoutResult: SModelRoot | Promise<SModelRoot> = this.layoutEngine.layout(root);
                this.applyLayoutToRoot(layoutResult);
            } else {
                this.handleProcessedNewRoot(root);
            }
            return false;
        }
    }

    private applyLayoutToRoot(layoutResult: SModelRoot | Promise<SModelRoot>) {
        if (layoutResult instanceof Promise) {
            layoutResult.then(value => this.handleProcessedNewRoot(value)).catch(reason => this.logger.error(this, reason));
        } else if (layoutResult !== undefined) {
            this.handleProcessedNewRoot(layoutResult);
        }
    }

    private handleProcessedNewRoot(root: SModelRoot) {
        if (root.type === this.lastSubmittedModelType) {
            this.actionDispatcher.dispatch(UpdateModelAction.create(root));
        } else {
            this.actionDispatcher.dispatch(SetModelAction.create(root));
        }
        this.lastSubmittedModelType = root.type;
    }
}