import React, {createContext} from "react";

export class MatchInstanceCntxt {
    private _matchFixed: boolean;
    private _setMatchFixed: React.Dispatch<React.SetStateAction<boolean>>;
    private _selectedFixVariant: number;
    private _setSelectedFixVariant: React.Dispatch<React.SetStateAction<number>>;


    constructor() {
        [this._matchFixed, this._setMatchFixed] = React.useState(false);
        [this._selectedFixVariant, this._setSelectedFixVariant] = React.useState(-1);
    }


    get matchFixed(): boolean {
        return this._matchFixed;
    }

    get setMatchFixed(): React.Dispatch<React.SetStateAction<boolean>> {
        return this._setMatchFixed;
    }

    get selectedFixVariant(): number {
        return this._selectedFixVariant;
    }

    get setSelectedFixVariant(): React.Dispatch<React.SetStateAction<number>> {
        return this._setSelectedFixVariant;
    }
}

export const useMatchInstanceContext = () => {
    const cntxt = React.useContext(MatchInstanceContext);
    if (cntxt === undefined) {
        throw new Error('useMatchInstanceContext must be inside a MatchInstanceProvider');
    }
    return cntxt;
};

export const MatchInstanceContext = createContext<MatchInstanceCntxt | undefined>(undefined);