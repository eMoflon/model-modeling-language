import * as React from 'react';

//import {Constraint} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";

interface vscode {
    postMessage(message: any): void;
}

declare const vscode: vscode;

const requestConstraints = () => {
    console.log('button clicked')
    vscode.postMessage({command: 'updateConstraints'});
}

const ModelServerEvaluation = () => {
    const [debugText, setDebugText] = React.useState('');
    //const [constraints, setConstraints] = React.useState([] as Constraint[]);

    React.useEffect(() => {
        window.addEventListener('message', event => {
            const message = event.data; // The json data that the extension sent
            switch (message.command) {
                case 'updateView':
                    console.log("[ModelServerEvaluation] Received updateView");
                    if (message.success) {
                        console.log("[ModelServerEvaluation] Request was successful");
                        //setConstraints(message.data);
                        setDebugText(JSON.stringify(message.data));
                        console.log(message.data);
                    } else {
                        console.log("[ModelServerEvaluation] Request was NOT successful");
                        //setConstraints([]);
                        setDebugText(`Could not reach ModelServer!\n(Reason: ${message.data})`);
                        console.log(message.data);
                    }
                    break;
            }
        });
    },);

    return (
        <div>
            <h1>Functional Components Work!</h1>
            <button onClick={requestConstraints}>Get Constraints!</button>
            <p>{debugText}</p>
        </div>
    );
};

export default ModelServerEvaluation;