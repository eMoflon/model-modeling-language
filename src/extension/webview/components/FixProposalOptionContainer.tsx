import React from "react";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {
    FixProposalContainer,
    FixProposalContainerType
} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import "./FixProposalOptionContainer.css"
import {FixProposalOption} from "./FixProposalOption.js";


export function FixProposalOptionContainer(props: {
    fixProposalContainer: FixProposalContainer;
    notifyFixedContainerOption: Function;
}) {
    let {fixProposalContainer, notifyFixedContainerOption} = props;

    const [proposalContainerExpanded, setProposalContainerExpanded] = React.useState(false);
    const [foldIcon, setFoldIcon] = React.useState("codicon codicon-chevron-right");
    const [fixHandled, setFixHandled] = React.useState(false);
    const [fixedProposals, setFixedProposals] = React.useState(0);
    const [fixedContainers, setFixedContainers] = React.useState(0);

    const toggleExpand = () => {
        if (proposalContainerExpanded) {
            setProposalContainerExpanded(false);
            setFoldIcon("codicon codicon-chevron-right");
        } else {
            setProposalContainerExpanded(true);
            setFoldIcon("codicon codicon-chevron-down");
        }
    }

    const containerFulfilled = (fProposals: number, fContainers: number) => {
        if (fixProposalContainer.type == FixProposalContainerType.SINGLE_FIX) {
            return fProposals == fixProposalContainer.proposals.length;
        } else if (fixProposalContainer.type == FixProposalContainerType.FIX_ONE) {
            return fProposals >= 1 || fContainers >= 1;
        } else if (fixProposalContainer.type == FixProposalContainerType.FIX_ALL) {
            return fProposals == fixProposalContainer.proposals.length && fContainers == fixProposalContainer.proposalContainers.length;
        }
        return false;
    }

    const incrementFixedProposals = () => {
        setFixedProposals(fixedProposals + 1);
        if (!fixHandled && containerFulfilled(fixedProposals + 1, fixedContainers)) {
            handleContainerFulfillment();
        }
    }

    const incrementFixedContainers = () => {
        setFixedContainers(fixedContainers + 1);
        if (!fixHandled && containerFulfilled(fixedProposals, fixedContainers + 1)) {
            handleContainerFulfillment();
        }
    }

    const handleContainerFulfillment = () => {
        notifyFixedContainerOption();
        if (proposalContainerExpanded) {
            toggleExpand();
        }
        setFixHandled(true);
    }

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");

    let proposalContainerText: string;
    if (fixProposalContainer.type == FixProposalContainerType.SINGLE_FIX) {
        proposalContainerText = "One fix available";
    } else if (fixProposalContainer.type == FixProposalContainerType.FIX_ONE) {
        proposalContainerText = "Select one";
    } else if (fixProposalContainer.type == FixProposalContainerType.FIX_ALL) {
        proposalContainerText = "Select all";
    } else if (fixProposalContainer.type == FixProposalContainerType.UNRESOLVABLE_CASE) {
        proposalContainerText = "Unresolvable";
    } else {
        proposalContainerText = "Unknown combination option";
    }

    const containerProposalContainers = fixProposalContainer.proposalContainers.map((propContainer, idx) =>
        <FixProposalOptionContainer fixProposalContainer={propContainer} key={`container-${idx}`}
                                    notifyFixedContainerOption={incrementFixedContainers}/>)

    const containerProposals = fixProposalContainer.proposals.map((propsl, idx) => <FixProposalOption proposal={propsl}
                                                                                                      key={`proposal-${idx}`}
                                                                                                      notifyFixedProposalOption={incrementFixedProposals}/>)

    return (
        <>
            <div className="ms-fix-proposal-opt-container-wrapper">
                <div className="ms-fix-proposal-opt-container-header">
                    <div className="ms-fix-proposal-opt-container-header-button-wrapper">
                        <VSCodeButton appearance="icon" onClick={toggleExpand} disabled={fixHandled}>
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
                        {containerProposals}
                    </div>
                </div>)}
            </div>
        </>
    );
}
