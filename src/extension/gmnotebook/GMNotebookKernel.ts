import * as vscode from 'vscode';

import {GMInterpreter} from "./GMInterpreter.js";
import {ModelServerConnector} from "../model-server-connector.js";
import {ModelServerVisualServer} from "../model-server-visual-server.js";

export class GMNotebookKernel {
    readonly id = 'gm-kernel';
    public readonly label = 'Graph Manipulation Kernel';
    readonly supportedLanguages = ['graph-manipulation-language'];

    private _executionOrder = 0;
    private readonly _controller: vscode.NotebookController;

    private readonly _interpreter: GMInterpreter;

    constructor(modelServerConnector: ModelServerConnector, visualServer: ModelServerVisualServer) {

        this._controller = vscode.notebooks.createNotebookController(this.id,
            'gm-notebook',
            this.label);

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this._executeAll.bind(this);

        this._interpreter = new GMInterpreter(modelServerConnector, visualServer);
    }

    dispose(): void {
        this._controller.dispose();
    }

    private async _executeAll(cells: vscode.NotebookCell[]): Promise<void> {
        for (let cell of cells) {
            await this._doExecution(cell);
        }
    }

    private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);

        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());

        const text = cell.document.getText();
        await execution.clearOutput();
        const log = async (value: unknown) => {
            const stringValue = `${value}`;
            await execution.appendOutput(
                new vscode.NotebookCellOutput([vscode.NotebookCellOutputItem.text(stringValue)])
            );
        }

        try {
            await log(text) // TODO: REMOVE
            await log(`EXECUTION ORDER: ${execution.executionOrder}`)
            await this._interpreter.runInterpreter(text, {log})
                .then(x => execution.end(true, Date.now()))
                .catch(reason => {
                    throw new Error(reason)
                })
        } catch (err) {
            const errString = err instanceof Error ? err.message : String(err);
            await execution.appendOutput(
                new vscode.NotebookCellOutput([vscode.NotebookCellOutputItem.text(errString)])
            );
            execution.end(false, Date.now());
        }
    }
}