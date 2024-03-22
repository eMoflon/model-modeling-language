import "./FixProposalOption.css";
import {
    FixMatch,
    FixProposal,
    FixProposalType
} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import React, {useEffect} from "react";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {MatchInstance} from "./MatchInstance.js";
import {FixProposalOptionContext, FixProposalOptionCtxt} from "./FixProposalOptionContext.js";
import {MatchInstanceCntxt, MatchInstanceContext} from "./MatchInstanceContext.js";

export function FixProposalOption(props: { proposal: FixProposal; notifyFixedProposalOption: Function; }) {
    let {proposal, notifyFixedProposalOption} = props;

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

    const matchInstanceProvider = (match: FixMatch, idx: number) => {

        return <MatchInstanceContext.Provider value={new MatchInstanceCntxt()}>
            <MatchInstance match={match}
                           key={`match-${idx}`}/>
        </MatchInstanceContext.Provider>
    }

    const matchInstances = proposal.matches.map((x, idx) => matchInstanceProvider(x, idx));

    const context = new FixProposalOptionCtxt(proposal.matches.length);

    useEffect(() => {
        if (context.fixProposalFixed) {
            if (proposalExpanded) {
                toggleExpand();
            }
            notifyFixedProposalOption();
        }
    }, [context.remainingMatches])

    return (
        <>
            <div className="ms-fix-proposal-opt-wrapper">
                <div className="ms-fix-proposal-opt-header">
                    <div className="ms-fix-proposal-opt-header-button-wrapper">
                        <VSCodeButton appearance="icon" onClick={toggleExpand} disabled={context.fixProposalFixed}>
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
                        <FixProposalOptionContext.Provider value={context}>
                            {matchInstances}
                        </FixProposalOptionContext.Provider>
                    </div>
                </div>)}
            </div>
        </>
    );
}