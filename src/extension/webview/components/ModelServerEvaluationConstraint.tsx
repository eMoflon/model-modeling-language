import * as React from 'react';
import {MouseEventHandler} from 'react';

import {Constraint} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import {CircularCodiconIcon} from "./CircularCodiconIcon.js";
import "./ModelServerEvaluationConstraint.css";
import {VSCodeButton} from "@vscode/webview-ui-toolkit/react";

export function ModelServerEvaluationConstraint(props: { constraint: Constraint; }) {
    let {
        constraint
    } = props

    const [constraintExpanded, setConstraintExpanded] = React.useState(false);
    const [foldIcon, setFoldIcon] = React.useState("codicon codicon-unfold");

    const toggleExpand = () => {
        if (constraintExpanded) {
            setConstraintExpanded(false);
            setFoldIcon("codicon codicon-unfold");
        } else {
            setConstraintExpanded(true);
            setFoldIcon("codicon codicon-fold");
        }
    }

    return (
        <>
            <div className="ms-eval-constraint-wrapper">
                <ModelServerEvaluationConstraintHeader constraintTitle={constraint.title}
                                                       constraintDescription={constraint.description}
                                                       constraintViolated={constraint.violated}
                                                       foldIcon={foldIcon}
                                                       onToggleFoldButton={toggleExpand}/>
                {constraintExpanded && (
                    <div className="ms-eval-constraint-content">
                        Test Content (unwrapped)
                    </div>
                )}
            </div>
        </>
    );
};

function ModelServerEvaluationConstraintHeader(props: {
    constraintTitle: string;
    constraintDescription: string;
    constraintViolated: boolean;
    foldIcon: string;
    onToggleFoldButton: MouseEventHandler;
}) {
    let {
        constraintTitle,
        constraintDescription,
        constraintViolated,
        foldIcon,
        onToggleFoldButton
    } = props

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");
    const iconBackgroundColor: string = constraintViolated ? computedStyle.getPropertyValue("--vscode-statusBarItem-errorBackground") : computedStyle.getPropertyValue("--vscode-editorGutter-addedBackground");
    const iconName: string = constraintViolated ? "close" : "check";

    return (
        <>
            <div className="ms-eval-constraint-header">
                <div className="ms-eval-constraint-icon-wrapper">
                    <CircularCodiconIcon size={30} iconName={iconName} iconColor={iconColor}
                                         backgroundColor={iconBackgroundColor}/>
                </div>
                <div className="ms-eval-constraint-title-wrapper">
                    <span className="ms-eval-constraint-title">{constraintTitle}</span>
                    <span className="ms-eval-constraint-description">{constraintDescription}</span>
                </div>
                <div className="ms-eval-constraint-button-wrapper">
                    <VSCodeButton appearance="icon" onClick={onToggleFoldButton}>
                        <i className={foldIcon} style={{color: iconColor}}></i>
                    </VSCodeButton>
                </div>
            </div>
        </>
    );
}