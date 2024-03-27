import React, {createContext} from "react";
import {EditChainRequest} from "../../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";

interface vscode {
    postMessage(message: any): void;
}

declare const vscode: vscode;

export class ModelServerEvaluationCtxt {
    private _evaluationCount: number;
    private _setEvaluationCount: React.Dispatch<React.SetStateAction<number>>;

    constructor() {
        [this._evaluationCount, this._setEvaluationCount] = React.useState(0);
    }

    get evaluationCount(): number {
        return this._evaluationCount;
    }

    incrementEvaluationCount(): void {
        this._setEvaluationCount(this._evaluationCount + 1);
    }

    requestConstraintEvaluation(): void {
        vscode.postMessage({command: 'updateConstraints'});
    }

    requestModelEdit(edit: EditChainRequest): void {
        vscode.postMessage({command: 'performModelRepair', data: edit.toJsonString()});
    }
}

export const useModelServerEvaluationContext = () => {
    const cntxt = React.useContext(ModelServerEvaluationContext);
    if (cntxt === undefined) {
        throw new Error('useModelServerEvaluationContext must be inside a ModelServerEvaluationProvider');
    }
    return cntxt;
};

export const ModelServerEvaluationContext = createContext<ModelServerEvaluationCtxt | undefined>(undefined);