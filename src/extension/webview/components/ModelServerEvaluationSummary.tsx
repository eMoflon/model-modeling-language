import {CircularSuccessIndicator} from "./CircularProgressIndicator.js";
import * as React from "react";
import "./ModelServerEvaluationSummary.css";
import {VSCodeButton} from "@vscode/webview-ui-toolkit/react";

interface vscode {
    postMessage(message: any): void;
}

declare const vscode: vscode;

const requestConstraints = () => {
    console.log('button clicked')
    vscode.postMessage({command: 'updateConstraints'});
}

export function ModelServerEvaluationSummary(props: {
    totalConstraints?: number | undefined;
    violatedConstraints?: number | undefined;
    state?: "loaded" | "loading" | "notLoaded" | "error" | undefined;
}) {
    let {
        totalConstraints = 0,
        violatedConstraints = 0,
        state = "noLoaded"
    } = props;

    const fulfilledConstraints: number = totalConstraints - violatedConstraints;
    const loading: boolean = state == "loading";
    const loaded: boolean = state == "loaded";
    const progress: number = loading || totalConstraints == 0 ? 10 : Math.floor((fulfilledConstraints / totalConstraints) * 100);
    let summaryText: string = "";
    let trackColor: string = "gray";
    let indicatorColor: string = "gray";
    if (state == "notLoaded") {
        summaryText = "Constraints not yet evaluated!";
    } else if (state == "loading") {
        summaryText = "Loading...";
        trackColor = "gray";
        indicatorColor = "blue";
    } else if (state == "loaded") {
        summaryText = `${fulfilledConstraints} of total ${totalConstraints} constraints fulfilled!`
        trackColor = "red";
        indicatorColor = "green";
    } else if (state == "error") {
        summaryText = "Failed to evaluate constraints!"
        trackColor = "orange";
        indicatorColor = "orange";
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