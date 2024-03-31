import * as React from 'react';
import {ModelServerEvaluationConstraint} from "./ModelServerEvaluationConstraint.js";
import "./ModelServerEvaluationConstraintList.css";
import {ModelServerEvaluationCtxt, useModelServerEvaluationContext} from "./ModelServerEvaluationContext.js";

export function ModelServerEvaluationConstraintList() {
    const evalContext: ModelServerEvaluationCtxt = useModelServerEvaluationContext();
    const constraintItems = evalContext.constraints.map((x, idx) => <ModelServerEvaluationConstraint constraint={x}
                                                                                                     key={`constraint-${idx}`}/>);

    return (
        <>
            <div className="ms-eval-constraint-list-wrapper">
                {constraintItems}
            </div>
        </>
    );
}