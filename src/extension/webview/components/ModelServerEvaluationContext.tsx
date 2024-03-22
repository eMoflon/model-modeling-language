import React, {createContext} from "react";

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
}

export const useModelServerEvaluationContext = () => {
    const cntxt = React.useContext(ModelServerEvaluationContext);
    if (cntxt === undefined) {
        throw new Error('useModelServerEvaluationContext must be inside a ModelServerEvaluationProvider');
    }
    return cntxt;
};

export const ModelServerEvaluationContext = createContext<ModelServerEvaluationCtxt | undefined>(undefined);