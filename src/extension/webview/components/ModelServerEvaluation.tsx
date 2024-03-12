import * as React from 'react';
import {ModelServerEvaluationSummary} from "./ModelServerEvaluationSummary.js";

import {Constraint} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import {ModelServerEvaluationConstraintList} from "./ModelServerEvaluationConstraintList.js";
import {VSCodeDivider} from "@vscode/webview-ui-toolkit/react";

const ModelServerEvaluation = () => {
    //const [debugText, setDebugText] = React.useState('');
    const [constraints, setConstraints] = React.useState([] as Constraint[]);
    const [loadState, setLoadState] = React.useState("notLoaded" as "notLoaded" | "loaded" | "loading" | "error");
    const [totalConstraints, setTotalConstraints] = React.useState(0);
    const [violatedConstraints, setViolatedConstraints] = React.useState(0);

    const setLoading = () => {
        setLoadState("loading");
    }

    React.useEffect(() => {
        window.addEventListener('message', event => {
            const message = event.data; // The json data that the extension sent
            switch (message.command) {
                case 'updateView':
                    console.log("[ModelServerEvaluation] Received updateView");
                    if (message.success) {
                        console.log("[ModelServerEvaluation] Request was successful");
                        setConstraints(message.data);
                        const constraints: Constraint[] = message.data;
                        //setDebugText(JSON.stringify(constraints));
                        console.log(message.data);

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
        <div>
            <ModelServerEvaluationSummary state={loadState} violatedConstraints={violatedConstraints}
                                          totalConstraints={totalConstraints} setLoading={setLoading}/>
            <VSCodeDivider/>
            {/*<p>{debugText}</p>*/}
            <ModelServerEvaluationConstraintList constraints={constraints}/>
        </div>
    );
};

export default ModelServerEvaluation;