import React from "react";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {
    FixProposalContainer,
    FixProposalContainerType
} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import "./FixProposalOptionContainer.css";
import "./Tooltips.css";
import {FixProposalOption} from "./FixProposalOption.js";


export function FixProposalOptionContainer(props: {
    fixProposalContainer: FixProposalContainer;
}) {
    let {fixProposalContainer} = props;

    const initialFoldState: boolean = fixProposalContainer.type == FixProposalContainerType.SINGLE_FIX;
    const initialFoldIconState: string = initialFoldState ? "codicon codicon-chevron-down" : "codicon codicon-chevron-right";

    const [proposalContainerExpanded, setProposalContainerExpanded] = React.useState(initialFoldState);
    const [foldIcon, setFoldIcon] = React.useState(initialFoldIconState);

    const toggleExpand = () => {
        if (proposalContainerExpanded) {
            setProposalContainerExpanded(false);
            setFoldIcon("codicon codicon-chevron-right");
        } else {
            setProposalContainerExpanded(true);
            setFoldIcon("codicon codicon-chevron-down");
        }
    }

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");

    let proposalContainerText: string;
    let proposalContainerTooltipText: string;
    if (fixProposalContainer.type == FixProposalContainerType.SINGLE_FIX) {
        proposalContainerText = "One fix available";
        proposalContainerTooltipText = "There is only one proposal that needs to be activated!";
    } else if (fixProposalContainer.type == FixProposalContainerType.FIX_ONE) {
        proposalContainerText = "Select one";
        proposalContainerTooltipText = "At least one element of this proposal must be activated!";
    } else if (fixProposalContainer.type == FixProposalContainerType.FIX_ALL) {
        proposalContainerText = "Select all";
        proposalContainerTooltipText = "All elements of this proposal must be activated!";
    } else if (fixProposalContainer.type == FixProposalContainerType.UNRESOLVABLE_CASE) {
        proposalContainerText = "Unresolvable";
        proposalContainerTooltipText = "It is not possible to solve this case!";
    } else {
        proposalContainerText = "Unknown combination option";
        proposalContainerTooltipText = "This fix combination is currently not supported!";
    }

    const containerProposalContainers = fixProposalContainer.proposalContainers.map((propContainer, idx) =>
        <FixProposalOptionContainer fixProposalContainer={propContainer} key={`container-${idx}`}/>)

    const containerProposals = fixProposalContainer.proposals.map((propsl, idx) => <FixProposalOption proposal={propsl}
                                                                                                      key={`proposal-${idx}`}/>)

    return (
        <>
            <div className="ms-fix-proposal-opt-container-wrapper">
                <div className="ms-fix-proposal-opt-container-header">
                    <div className="ms-fix-proposal-opt-container-header-button-wrapper">
                        <VSCodeButton appearance="icon" onClick={toggleExpand}>
                            <i className={foldIcon} style={{color: iconColor}}></i>
                        </VSCodeButton>
                    </div>
                    <div className="ms-fix-proposal-opt-container-header-text-wrapper tooltip">
                        <VSCodeTag>{proposalContainerText}</VSCodeTag>
                        <span className="tooltiptext">{proposalContainerTooltipText}</span>
                    </div>
                </div>
                {proposalContainerExpanded && (<div className="ms-fix-proposal-opt-container-content-wrapper">
                    <div className="ms-fix-proposal-opt-container-content-visualbox"/>
                    <div className="ms-fix-proposal-opt-container-content">
                        {containerProposalContainers}
                        {containerProposals}
                    </div>
                </div>)}
            </div>
        </>
    );
}
