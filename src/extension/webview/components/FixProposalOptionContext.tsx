import React, {createContext, useState} from "react";

export class FixProposalOptionCtxt {
    private _totalMatches: number;
    private _remainingMatches: number;
    private _setRemainingMatches: React.Dispatch<React.SetStateAction<number>>;
    private _usedTotalVariantIdx: number;
    private _setUsedTotalVariantIdx: React.Dispatch<React.SetStateAction<number>>;

    constructor(numOfMatches: number) {
        this._totalMatches = numOfMatches;
        [this._remainingMatches, this._setRemainingMatches] = useState(numOfMatches);
        [this._usedTotalVariantIdx, this._setUsedTotalVariantIdx] = useState(-1);
    }

    get remainingMatches(): number {
        return this._remainingMatches;
    }

    get fixProposalFixed(): boolean {
        return this._remainingMatches == 0 && this._totalMatches != 0;
    }

    decrementRemainingMatches(): void {
        if (this._remainingMatches == 0) {
            throw new Error("Tried to decrement remainingMatches below zero!");
        }
        this._setRemainingMatches(this._remainingMatches - 1);
    }

    get usedTotalVariantIdx(): number {
        return this._usedTotalVariantIdx;
    }

    get setUsedTotalVariantIdx(): React.Dispatch<React.SetStateAction<number>> {
        return this._setUsedTotalVariantIdx;
    }
}

export const useFixProposalOptionContext = () => {
    const cntxt = React.useContext(FixProposalOptionContext);
    if (cntxt === undefined) {
        throw new Error('useFixProposalOptionContext must be inside a FixProposalOptionProvider');
    }
    return cntxt;
};

export const FixProposalOptionContext = createContext<FixProposalOptionCtxt | undefined>(undefined);