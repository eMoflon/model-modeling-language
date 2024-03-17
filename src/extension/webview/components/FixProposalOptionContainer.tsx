import React from "react";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {
    FixProposalContainer,
    FixProposalContainerType
} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import "./FixProposalOptionContainer.css"


export function FixProposalOptionContainer(props: { fixProposalContainer: FixProposalContainer; }) {
    let {fixProposalContainer} = props;

    const [proposalContainerExpanded, setProposalContainerExpanded] = React.useState(false);
    const [foldIcon, setFoldIcon] = React.useState("codicon codicon-chevron-down");

    const toggleExpand = () => {
        if (proposalContainerExpanded) {
            setProposalContainerExpanded(false);
            setFoldIcon("codicon codicon-chevron-down");
        } else {
            setProposalContainerExpanded(true);
            setFoldIcon("codicon codicon-chevron-up");
        }
    }

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");

    let proposalContainerText: string;
    const fixProposalContainerType: string = fixProposalContainer.type.toString();
    if (fixProposalContainerType == FixProposalContainerType[FixProposalContainerType.SINGLE_FIX]) {
        proposalContainerText = "One fix available";
    } else if (fixProposalContainerType == FixProposalContainerType[FixProposalContainerType.FIX_ONE]) {
        proposalContainerText = "Select one";
    } else if (fixProposalContainerType == FixProposalContainerType[FixProposalContainerType.FIX_ALL]) {
        proposalContainerText = "Select all";
    } else if (fixProposalContainerType == FixProposalContainerType[FixProposalContainerType.UNRESOLVABLE_CASE]) {
        proposalContainerText = "Unresolvable";
    } else {
        proposalContainerText = "Unknown combination option";
    }

    const containerProposalContainers = fixProposalContainer.proposalContainers.map((propContainer, idx) =>
        <FixProposalOptionContainer fixProposalContainer={propContainer} key={`container-${idx}`}/>)

    return (
        <>
            <div className="ms-fix-proposal-opt-container-wrapper">
                <div className="ms-fix-proposal-opt-container-header">
                    <div className="ms-fix-proposal-opt-container-header-button-wrapper">
                        <VSCodeButton appearance="icon" onClick={toggleExpand}>
                            <i className={foldIcon} style={{color: iconColor}}></i>
                        </VSCodeButton>
                    </div>
                    <div className="ms-fix-proposal-opt-container-header-text-wrapper">
                        <VSCodeTag>{proposalContainerText}</VSCodeTag>
                    </div>
                </div>
                {proposalContainerExpanded && (<div className="ms-fix-proposal-opt-container-content-wrapper">
                    <div className="ms-fix-proposal-opt-container-content-visualbox"/>
                    <div className="ms-fix-proposal-opt-container-content">
                        {containerProposalContainers}
                        {JSON.stringify(fixProposalContainer.proposals)}
                    </div>
                </div>)}
            </div>
        </>
    );
}
