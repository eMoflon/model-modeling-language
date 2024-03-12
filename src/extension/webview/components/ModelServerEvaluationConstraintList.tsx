import * as React from 'react';

import {Constraint} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import {ModelServerEvaluationConstraint} from "./ModelServerEvaluationConstraint.js";
import "./ModelServerEvaluationConstraintList.css";

export function ModelServerEvaluationConstraintList(props: { constraints?: Constraint[] | undefined; }) {
    let {
        constraints = []
    } = props

    const constraintItems = constraints.map((x, idx) => <ModelServerEvaluationConstraint constraint={x}
                                                                                         constraintKey={`constraint-${idx}`}/>);

    return (
        <>
            <div className="ms-eval-constraint-list-wrapper">
                {constraintItems}
            </div>
        </>
    );
}