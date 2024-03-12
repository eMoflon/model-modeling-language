import * as React from 'react';

import {Constraint} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import {CircularCodiconIcon} from "./CircularCodiconIcon.js";
import "./ModelServerEvaluationConstraint.css";

export function ModelServerEvaluationConstraint(props: { constraintKey: string, constraint: Constraint; }) {
    let {
        constraintKey,
        constraint
    } = props

    const iconColor: string = "white";
    const iconBackgroundColor: string = constraint.violated ? "red" : "green";
    const iconName: string = constraint.violated ? "close" : "check";

    return (
        <>
            <div key={constraintKey} className="ms-eval-constraint-wrapper">
                <div className="ms-eval-constraint-icon-wrapper">
                    <CircularCodiconIcon size={30} iconName={iconName} iconColor={iconColor}
                                         backgroundColor={iconBackgroundColor}/>
                </div>
                <div className="ms-eval-constraint-title-wrapper">
                    <span className="ms-eval-constraint-title">{constraint.title}</span>
                    <span className="ms-eval-constraint-description">{constraint.description}</span>
                </div>
            </div>
        </>
    );
};