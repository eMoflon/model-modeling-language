import "./MatchInstance.css"
import "./CommonWrappers.css"
import {FixMatch, FixVariant} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import React, {useEffect} from "react";
import {VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {FixProposalOptionCtxt, useFixProposalOptionContext} from "./FixProposalOptionContext.js";
import {MatchInstanceCntxt, useMatchInstanceContext} from "./MatchInstanceContext.js";
import {MatchFixVariant} from "./MatchFixVariant.js";

export function MatchInstance(props: { match: FixMatch; }) {
    let {match} = props;

    const fixPropContext: FixProposalOptionCtxt = useFixProposalOptionContext();
    const matchContext: MatchInstanceCntxt = useMatchInstanceContext();

    const executeFixVariant = (idx: number) => {
        if (!matchContext.matchFixed) {
            matchContext.setMatchFixed(true);
            matchContext.setSelectedFixVariant(idx);

            const selectedVariant: FixVariant | undefined = match.variants.at(idx);


            if (selectedVariant == undefined) {
                console.error(`Selected FixVariant out of range! Selected ${idx} out of range (0,${match.variants.length - 1})`)
            } else {
                console.log(JSON.stringify(selectedVariant))
                fixPropContext.decrementRemainingMatches();
            }
        }
    }

    useEffect(() => {
        if (fixPropContext.usedTotalVariantIdx >= 0 && !matchContext.matchFixed) {
            executeFixVariant(fixPropContext.usedTotalVariantIdx)
        }
    }, [fixPropContext.usedTotalVariantIdx])

    const matchVariants = match.variants.map((x, idx) => <MatchFixVariant idx={idx} key={`variant-${idx}`}
                                                                          variant={x}
                                                                          selectVariantCb={executeFixVariant}/>);
    const matchHasVariants: boolean = matchVariants.length > 0;

    return (
        <>
            <div className="ms-match-instance-wrapper wrapper-column">
                <div className="ms-match-instance-header wrapper-row">
                    <div className="ms-match-instance-header-tag-wrapper wrapper-column">
                        <VSCodeTag>Match</VSCodeTag>
                    </div>
                    <div className="ms-match-instance-header-text-wrapper wrapper-column">
                        WIP - Match Beschreibung ???
                    </div>
                </div>
                {!matchContext.matchFixed && matchHasVariants && (<div className="wrapper-row">
                    <div className="ms-match-instance-content-visualbox wrapper-column"/>
                    <div className="ms-match-instance-content wrapper-column">
                        {matchVariants}
                    </div>
                </div>)}
            </div>
        </>
    );
}
