import * as vscode from 'vscode';
import {TextDecoder, TextEncoder} from "util";

interface RawNotebook {
    cells: RawNotebookCell[];
}

interface RawNotebookCell {
    source: string[];
    cell_type: 'code' | 'markdown';
}

export class GMNotebookSerializer implements vscode.NotebookSerializer {
    async deserializeNotebook(
        content: Uint8Array,
        _token: vscode.CancellationToken
    ): Promise<vscode.NotebookData> {
        const contents = new TextDecoder().decode(content);

        let raw: RawNotebookCell[];
        try {
            raw = (<RawNotebook>JSON.parse(contents)).cells;
        } catch {
            raw = [];
        }

        const cells = raw.map(
            item =>
                new vscode.NotebookCellData(
                    item.cell_type === 'code'
                        ? vscode.NotebookCellKind.Code
                        : vscode.NotebookCellKind.Markup,
                    item.source.join('\n'),
                    item.cell_type === 'code' ? 'graph-manipulation-language' : 'markdown'
                )
        );

        return new vscode.NotebookData(cells);
    }

    async serializeNotebook(
        data: vscode.NotebookData,
        _token: vscode.CancellationToken
    ): Promise<Uint8Array> {
        let contents: RawNotebookCell[] = [];

        for (const cell of data.cells) {
            contents.push({
                cell_type: cell.kind === vscode.NotebookCellKind.Code ? 'code' : 'markdown',
                source: cell.value.split(/\r?\n/g)
            });
        }

        const notebookData: RawNotebook = {cells: contents}

        return new TextEncoder().encode(JSON.stringify(notebookData));
    }
}