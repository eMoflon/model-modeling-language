import React, {createContext} from "react";
import {EditChainRequest} from "../../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";
import {Constraint} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";

interface vscode {
    postMessage(message: any): void;
}

declare const vscode: vscode;

export class ModelServerEvaluationCtxt {
    private _evaluationCount: number;
    private _setEvaluationCount: React.Dispatch<React.SetStateAction<number>>;

    private _constraints: Constraint[];
    private _setConstraints: React.Dispatch<React.SetStateAction<Constraint[]>>;
    private _loadState: "notLoaded" | "loaded" | "loading" | "error";
    private _setLoadState: React.Dispatch<React.SetStateAction<"notLoaded" | "loaded" | "loading" | "error">>;
    private _totalConstraints: number;
    private _setTotalConstraints: React.Dispatch<React.SetStateAction<number>>;
    private _violatedConstraints: number;
    private _setViolatedConstraints: React.Dispatch<React.SetStateAction<number>>;


    constructor() {
        [this._evaluationCount, this._setEvaluationCount] = React.useState(0);
        [this._constraints, this._setConstraints] = React.useState([] as Constraint[]);
        [this._loadState, this._setLoadState] = React.useState("notLoaded" as "notLoaded" | "loaded" | "loading" | "error");
        [this._totalConstraints, this._setTotalConstraints] = React.useState(0);
        [this._violatedConstraints, this._setViolatedConstraints] = React.useState(0);
    }

    get evaluationCount(): number {
        return this._evaluationCount;
    }


    get constraints(): Constraint[] {
        return this._constraints;
    }

    get setConstraints(): React.Dispatch<React.SetStateAction<Constraint[]>> {
        return this._setConstraints;
    }

    get loadState(): "notLoaded" | "loaded" | "loading" | "error" {
        return this._loadState;
    }

    get setLoadState(): React.Dispatch<React.SetStateAction<"notLoaded" | "loaded" | "loading" | "error">> {
        return this._setLoadState;
    }

    get totalConstraints(): number {
        return this._totalConstraints;
    }

    get setTotalConstraints(): React.Dispatch<React.SetStateAction<number>> {
        return this._setTotalConstraints;
    }

    get violatedConstraints(): number {
        return this._violatedConstraints;
    }

    get setViolatedConstraints(): React.Dispatch<React.SetStateAction<number>> {
        return this._setViolatedConstraints;
    }

    incrementEvaluationCount(): void {
        this._setEvaluationCount(this._evaluationCount + 1);
    }

    requestConstraintEvaluation(): void {
        vscode.postMessage({command: 'updateConstraints'});
    }

    requestModelEdit(edit: EditChainRequest): void {
        this.setLoadState('loading');
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