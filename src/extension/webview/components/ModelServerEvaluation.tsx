import * as React from 'react';
import {ModelServerEvaluationSummary} from "./ModelServerEvaluationSummary.js";

import {Constraint, GetConstraintsResponse} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import {ModelServerEvaluationConstraintList} from "./ModelServerEvaluationConstraintList.js";
import {VSCodeDivider} from "@vscode/webview-ui-toolkit/react";
import {
    ModelServerEvaluationContext,
    ModelServerEvaluationCtxt,
    useModelServerEvaluationContext
} from "./ModelServerEvaluationContext.js";

export function ModelServerEvaluationWrapper() {
    const context = new ModelServerEvaluationCtxt();

    return (<ModelServerEvaluationContext.Provider value={context}>
        <ModelServerEvaluation/>
    </ModelServerEvaluationContext.Provider>)
}

function ModelServerEvaluation() {
    const evalContext: ModelServerEvaluationCtxt = useModelServerEvaluationContext();

    const handleMessage = (event: MessageEvent) => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'updateView':
                console.log("[ModelServerEvaluation] Received updateView");
                if (message.success) {
                    console.log("[ModelServerEvaluation] Request was successful");
                    const deserializedMessage: GetConstraintsResponse = GetConstraintsResponse.fromJsonString(message.data);

                    evalContext.setConstraints(deserializedMessage.constraints);
                    const constraints: Constraint[] = deserializedMessage.constraints;
                    //setDebugText(JSON.stringify(constraints));
                    console.log(message.data);

                    evalContext.setTotalConstraints(constraints.length);
                    evalContext.setViolatedConstraints(constraints.filter(x => x.violated).length);

                    evalContext.setLoadState("loaded");
                } else {
                    console.log("[ModelServerEvaluation] Request was NOT successful");
                    evalContext.setConstraints([]);
                    //setDebugText(`Could not reach ModelServer!\n(Reason: ${message.data})`);
                    console.log(message.data);

                    evalContext.setTotalConstraints(0);
                    evalContext.setViolatedConstraints(0);

                    const data: { cause: { code: string } } = JSON.parse(message.data);

                    if (data.cause && data.cause.code == "ECONNREFUSED") {
                        evalContext.setLoadState("notConnected");
                    } else {
                        evalContext.setLoadState("error");
                    }
                }
                break;
            case 'modelRepairPerformed':
                if (message.success) {
                    evalContext.requestConstraintEvaluation();
                } else {
                    evalContext.setConstraints([]);
                    evalContext.setTotalConstraints(0);
                    evalContext.setViolatedConstraints(0);
                    evalContext.setLoadState("error");
                }
        }
    }

    React.useEffect(() => {
        window.addEventListener('message', handleMessage, false);
    }, []);

    return (
        <div>
            <ModelServerEvaluationSummary/>
            <VSCodeDivider/>
            {/*<p>{debugText}</p>*/}
            <ModelServerEvaluationConstraintList/>
        </div>
    );
};

export default ModelServerEvaluation;