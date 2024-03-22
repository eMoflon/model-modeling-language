import * as React from 'react';
import {ModelServerEvaluationSummary} from "./ModelServerEvaluationSummary.js";

import {Constraint, GetConstraintsResponse} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import {ModelServerEvaluationConstraintList} from "./ModelServerEvaluationConstraintList.js";
import {VSCodeDivider} from "@vscode/webview-ui-toolkit/react";
import {ModelServerEvaluationContext, ModelServerEvaluationCtxt} from "./ModelServerEvaluationContext.js";

const ModelServerEvaluation = () => {
    //const [debugText, setDebugText] = React.useState('');
    const [constraints, setConstraints] = React.useState([] as Constraint[]);
    const [loadState, setLoadState] = React.useState("notLoaded" as "notLoaded" | "loaded" | "loading" | "error");
    const [totalConstraints, setTotalConstraints] = React.useState(0);
    const [violatedConstraints, setViolatedConstraints] = React.useState(0);

    const setLoading = () => {
        setLoadState("loading");
    }

    const context = new ModelServerEvaluationCtxt();

    React.useEffect(() => {
        window.addEventListener('message', event => {
            const message = event.data; // The json data that the extension sent
            switch (message.command) {
                case 'updateView':
                    console.log("[ModelServerEvaluation] Received updateView");
                    if (message.success) {
                        console.log("[ModelServerEvaluation] Request was successful");
                        const deserializedMessage: GetConstraintsResponse = GetConstraintsResponse.fromJsonString(message.data);

                        setConstraints(deserializedMessage.constraints);
                        const constraints: Constraint[] = deserializedMessage.constraints;
                        //setDebugText(JSON.stringify(constraints));
                        console.log(message.data);

                        context.incrementEvaluationCount();

                        setTotalConstraints(constraints.length);
                        setViolatedConstraints(constraints.filter(x => x.violated).length);

                        setLoadState("loaded");
                    } else {
                        console.log("[ModelServerEvaluation] Request was NOT successful");
                        setConstraints([]);
                        //setDebugText(`Could not reach ModelServer!\n(Reason: ${message.data})`);
                        console.log(message.data);

                        setTotalConstraints(0);
                        setViolatedConstraints(0);

                        setLoadState("error");
                    }
                    break;
            }
        });
    },);

    return (
        <ModelServerEvaluationContext.Provider value={context}>
            <div>
                <ModelServerEvaluationSummary state={loadState} violatedConstraints={violatedConstraints}
                                              totalConstraints={totalConstraints} setLoading={setLoading}/>
                <VSCodeDivider/>
                {/*<p>{debugText}</p>*/}
                <ModelServerEvaluationConstraintList constraints={constraints}/>
            </div>
        </ModelServerEvaluationContext.Provider>
    );
};

export default ModelServerEvaluation;