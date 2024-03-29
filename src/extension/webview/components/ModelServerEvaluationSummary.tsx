import {CircularSuccessIndicator} from "./CircularProgressIndicator.js";
import * as React from "react";
import "./ModelServerEvaluationSummary.css";
import {VSCodeButton} from "@vscode/webview-ui-toolkit/react";
import {ModelServerEvaluationCtxt, useModelServerEvaluationContext} from "./ModelServerEvaluationContext.js";

export function ModelServerEvaluationSummary() {

    const evalContext: ModelServerEvaluationCtxt = useModelServerEvaluationContext();

    const requestConstraints = () => {
        console.log('button clicked')
        evalContext.setLoadState('loading')
        evalContext.requestConstraintEvaluation();
    }

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const fulfilledConstraints: number = evalContext.totalConstraints - evalContext.violatedConstraints;
    const loading: boolean = evalContext.loadState == "loading";
    const loaded: boolean = evalContext.loadState == "loaded";
    const progress: number = loading || evalContext.totalConstraints == 0 ? 10 : Math.floor((fulfilledConstraints / evalContext.totalConstraints) * 100);
    let summaryText: string = "";
    let trackColor: string = computedStyle.getPropertyValue("--vscode-icon-foreground");
    let indicatorColor: string = computedStyle.getPropertyValue("--vscode-icon-foreground");
    if (evalContext.loadState == "notLoaded") {
        summaryText = "Constraints not yet evaluated!";
    } else if (evalContext.loadState == "loading") {
        summaryText = "Loading...";
        trackColor = computedStyle.getPropertyValue("--vscode-icon-foreground");
        indicatorColor = computedStyle.getPropertyValue("--vscode-focusBorder");
    } else if (evalContext.loadState == "loaded") {
        summaryText = `${fulfilledConstraints} of total ${evalContext.totalConstraints} constraints fulfilled!`
        trackColor = computedStyle.getPropertyValue("--vscode-statusBarItem-errorBackground");
        indicatorColor = computedStyle.getPropertyValue("--vscode-editorGutter-addedBackground");
    } else if (evalContext.loadState == "error") {
        summaryText = "Failed to evaluate constraints!"
        trackColor = computedStyle.getPropertyValue("--vscode-testing-iconQueued");
        indicatorColor = computedStyle.getPropertyValue("--vscode-testing-iconQueued");
    } else if (evalContext.loadState == "notConnected") {
        summaryText = "Could not connect to ModelServer! Is it running?";
        trackColor = computedStyle.getPropertyValue("--vscode-testing-iconQueued");
        indicatorColor = computedStyle.getPropertyValue("--vscode-testing-iconQueued");
    }

    return (
        <>
            <div className="ms-eval-summary-wrapper">
                <div className="ms-eval-summary-pi-wrapper">
                    <CircularSuccessIndicator progress={progress} size={100} trackWidth={10} indicatorWidth={10}
                                              label={""}
                                              trackColor={trackColor}
                                              indicatorColor={indicatorColor} labelColor={"white"} spinnerMode={loading}
                                              showLabel={loaded}/>
                </div>
                <div className="ms-eval-summary-title-wrapper">
                    <span className="ms-eval-summary-title">ModelServer Constraint Evaluation</span><br/>
                    <span className="ms-eval-summary-subtitle">{summaryText}</span>
                </div>
                <div className="ms-eval-summary-button-wrapper">
                    <VSCodeButton onClick={requestConstraints}>Evaluate Constraints</VSCodeButton>
                </div>
            </div>
        </>
    )
}