import React, {MouseEventHandler} from "react"
import {ConstraintAssertion} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import "./AssertionContainer.css";
import {FixProposalOptionContainer} from "./FixProposalOptionContainer.js";

export function AssertionContainer(props: { assertion: ConstraintAssertion }) {
    let {assertion} = props

    const [assertionExpanded, setAssertionExpanded] = React.useState(false);
    const [foldIcon, setFoldIcon] = React.useState("codicon codicon-chevron-right");

    const toggleExpand = () => {
        if (assertionExpanded) {
            setAssertionExpanded(false);
            setFoldIcon("codicon codicon-chevron-right");
        } else {
            setAssertionExpanded(true);
            setFoldIcon("codicon codicon-chevron-down");
        }
    }

    const proposalContainer = assertion.proposalContainer == undefined ? <span>No proposal container!</span> :
        <FixProposalOptionContainer fixProposalContainer={assertion.proposalContainer}/>;

    return (
        <>
            <div className="ms-assertion-container-wrapper">
                <AssertionContainerHeader assertionTerm={assertion.expression} assertionViolated={assertion.violated}
                                          foldIcon={foldIcon} onToggleFoldButton={toggleExpand}/>
                {assertionExpanded && (<div className="ms-assertion-container-content">
                    {proposalContainer}
                </div>)}
            </div>
        </>
    )
}


function AssertionContainerHeader(props: {
    assertionTerm: string;
    assertionViolated: boolean;
    foldIcon: string;
    onToggleFoldButton: MouseEventHandler;
}) {
    let {
        assertionTerm,
        assertionViolated,
        foldIcon,
        onToggleFoldButton
    } = props;

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");
    const assertionClass = assertionViolated ? "ms-assertion-container-header-violated" : "ms-assertion-container-header-fulfilled"

    return (
        <>
            <div className={`ms-assertion-container-header ${assertionClass}`}>
                <div className="ms-assertion-container-title-wrapper">
                    <div className="ms-assertion-container-title">
                        <VSCodeTag>Assertion</VSCodeTag>
                        <span className="ms-assertion-container-term">{assertionTerm}</span>
                    </div>
                </div>
                {assertionViolated && (<div className="ms-assertion-container-button-wrapper">
                    <VSCodeButton appearance="icon" onClick={onToggleFoldButton}>
                        <i className={foldIcon} style={{color: iconColor}}></i>
                    </VSCodeButton>
                </div>)}
            </div>
        </>
    )
}