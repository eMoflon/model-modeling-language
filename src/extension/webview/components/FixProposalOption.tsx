import "./FixProposalOption.css";
import {
    FixMatch,
    FixProposal,
    FixProposalType,
    FixVariant
} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import React from "react";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {MatchInstance} from "./MatchInstance.js";
import {EditChainRequest, EditRequest} from "../../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";
import {useModelServerEvaluationContext} from "./ModelServerEvaluationContext.js";

export function FixProposalOption(props: { proposal: FixProposal; }) {
    let {proposal} = props;

    const evalContext = useModelServerEvaluationContext();

    const [proposalExpanded, setProposalExpanded] = React.useState(false);
    const [foldIcon, setFoldIcon] = React.useState("codicon codicon-chevron-right");

    const toggleExpand = () => {
        if (proposalExpanded) {
            setProposalExpanded(false);
            setFoldIcon("codicon codicon-chevron-right");
        } else {
            setProposalExpanded(true);
            setFoldIcon("codicon codicon-chevron-down");
        }
    }

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");

    let proposalTypeTag: string;
    if (proposal.type == FixProposalType.ENABLE_PATTERN) {
        proposalTypeTag = "Enable matches";
    } else if (proposal.type == FixProposalType.DISABLE_PATTERN) {
        proposalTypeTag = "Disable matches";
    } else {
        proposalTypeTag = "Unknown proposal type";
    }

    const executeFixVariant = (matchIdx: number, variantIdx: number) => {
        const selectedVariant: FixVariant | undefined = proposal.matches.at(matchIdx)?.variants.at(variantIdx);

        if (selectedVariant == undefined) {
            console.error(`Selected FixVariant out of range! Trying to select Variant ${variantIdx} for Match ${matchIdx}`);
        } else {
            console.log(JSON.stringify(selectedVariant))
            const repairStatements: EditRequest[] = selectedVariant.statements.filter(x => x.stmt.case == "edit").map(x => x.stmt.value as EditRequest);
            const chainRequest: EditChainRequest = new EditChainRequest({edits: repairStatements});
            evalContext.requestModelEdit(chainRequest);
        }
    }

    const executeFixVariantForAllMatches = (idx: number) => {
        let repairStatements: EditRequest[] = [];

        const matches: FixMatch[] = proposal.matches;

        for (const match of matches) {
            const selectedVariant: FixVariant | undefined = match.variants.at(idx);

            if (selectedVariant == undefined) {
                console.error(`Selected FixVariant out of range! Trying to select Variant ${idx}...`);
            } else {
                console.log(JSON.stringify(selectedVariant))
                repairStatements.push(...selectedVariant.statements
                    .filter(x => x.stmt.case == "edit")
                    .map(x => x.stmt.value as EditRequest));


            }
        }
        const chainRequest: EditChainRequest = new EditChainRequest({edits: repairStatements});
        evalContext.requestModelEdit(chainRequest);
    }

    const matchInstanceProvider = (match: FixMatch, idx: number) => {

        return <MatchInstance match={match}
                              key={`match-${idx}`} matchIdx={idx} selectVariantCb={executeFixVariant}
                              selectVariantForAllCb={executeFixVariantForAllMatches}/>
    }

    const matchInstances = proposal.matches.map((x, idx) => matchInstanceProvider(x, idx));

    return (
        <>
            <div className="ms-fix-proposal-opt-wrapper">
                <div className="ms-fix-proposal-opt-header">
                    <div className="ms-fix-proposal-opt-header-button-wrapper">
                        <VSCodeButton appearance="icon" onClick={toggleExpand}>
                            <i className={foldIcon} style={{color: iconColor}}></i>
                        </VSCodeButton>
                    </div>
                    <div className="ms-fix-proposal-opt-header-text-wrapper wrapper-column">
                        <div className="wrapper-row">
                            <div className="wrapper-column">
                                <VSCodeTag>{proposalTypeTag}</VSCodeTag>
                            </div>
                            <div className="ms-fix-proposal-opt-header-text wrapper-column">
                                <span>{proposal.patternName}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {proposalExpanded && (<div className="ms-fix-proposal-opt-content-wrapper">
                    <div className="ms-fix-proposal-opt-content-visualbox"/>
                    <div className="ms-fix-proposal-opt-content">
                        {matchInstances}
                    </div>
                </div>)}
            </div>
        </>
    );
}