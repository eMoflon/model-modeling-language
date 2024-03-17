import "./FixProposalOption.css";
import {FixProposal, FixProposalType} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import React from "react";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";

export function FixProposalOption(props: { proposal: FixProposal; }) {
    let {proposal} = props;

    const [proposalExpanded, setProposalExpanded] = React.useState(false);
    const [foldIcon, setFoldIcon] = React.useState("codicon codicon-chevron-down");

    const toggleExpand = () => {
        if (proposalExpanded) {
            setProposalExpanded(false);
            setFoldIcon("codicon codicon-chevron-down");
        } else {
            setProposalExpanded(true);
            setFoldIcon("codicon codicon-chevron-up");
        }
    }

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");

    let proposalTypeTag: string;
    const proposalType: string = proposal.type.toString();
    if (proposalType == FixProposalType[FixProposalType.ENABLE_PATTERN]) {
        proposalTypeTag = "Enable matches";
    } else if (proposalType == FixProposalType[FixProposalType.DISABLE_PATTERN]) {
        proposalTypeTag = "Disable matches";
    } else {
        proposalTypeTag = "Unknown proposal type";
    }

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
                        {JSON.stringify(proposal.matches)}
                    </div>
                </div>)}
            </div>
        </>
    );
}