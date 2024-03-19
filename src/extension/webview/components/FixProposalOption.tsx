import "./FixProposalOption.css";
import {FixProposal, FixProposalType} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import React from "react";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {MatchInstance} from "./MatchInstance.js";

export function FixProposalOption(props: { proposal: FixProposal; }) {
    let {proposal} = props;

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

    const executeFixVariantForAllMatches = (idx: number) => {
        console.log(`Execute variant (${idx}) for all matches!`);
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

    const matchInstances = proposal.matches.map((x, idx) => <MatchInstance match={x}
                                                                           selectVariantForAllMatchesCb={executeFixVariantForAllMatches}
                                                                           key={`match-${idx}`}/>);

    return (
        <>
            <div className="ms-fix-proposal-opt-wrapper">
                <div className="ms-fix-proposal-opt-header">
                    <div className="ms-fix-proposal-opt-header-button-wrapper">
                        <VSCodeButton appearance="icon" onClick={toggleExpand}>
                            <i className={foldIcon} style={{color: iconColor}}></i>
                        </VSCodeButton>
                    </div>
                    <div className="ms-fix-proposal-opt-header-text-wrapper">
                        <div className="ms-fix-proposal-opt-header-text">
                            <VSCodeTag>{proposalTypeTag}</VSCodeTag>
                            <span>{proposal.patternName}</span>
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