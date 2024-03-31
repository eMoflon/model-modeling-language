import {FixInfoStatement, FixVariant} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import React from "react";
import {
    EditCreateEdgeRequest,
    EditCreateNodeRequest,
    EditDeleteEdgeRequest,
    EditDeleteNodeRequest,
    EditRequest,
    EditSetAttributeRequest,
    Node
} from "../../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";
import {VSCodeButton, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {TemporaryIdRegistry} from "../utils/TemporaryIdRegistry.js";
import "./MatchFixVariant.css"

export function MatchFixVariant(props: {
    idx: number;
    variant: FixVariant;
    variantForEmptyMatch: boolean;
    selectVariantCb: Function;
    selectVariantForAllCb: Function;
}) {
    let {idx, variant, variantForEmptyMatch, selectVariantCb, selectVariantForAllCb} = props;

    const [fixVariantDetailsExpanded, setFixVariantDetailsExpanded] = React.useState(false);
    const [detailsIcon, setDetailsIcon] = React.useState("codicon codicon-diff-added");

    const toggleDetails = () => {
        if (fixVariantDetailsExpanded) {
            setFixVariantDetailsExpanded(false);
            setDetailsIcon("codicon codicon-diff-added");
        } else {
            setFixVariantDetailsExpanded(true);
            setDetailsIcon("codicon codicon-diff-removed");
        }
    }

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");

    const infoStatements: FixInfoStatement[] = variant.statements.filter(x => x.stmt.case == "infoStatement").map(x => x.stmt.value as FixInfoStatement);
    const infoStatementsAvailable: boolean = infoStatements.length > 0;

    const editStatements: EditRequest[] = variant.statements.filter(x => x.stmt.case == "edit").map(x => x.stmt.value as EditRequest);

    const variantTag: string = "Variant";

    return (
        <>
            <div className="ms-match-fix-variant-wrapper wrapper-column">
                <div className="ms-match-fix-variant-header-wrapper wrapper-row">
                    <div className="ms-match-fix-variant-header-tag wrapper-column">
                        <VSCodeTag>{variantTag}</VSCodeTag>
                    </div>
                    <div className="ms-match-fix-variant-header-title wrapper-column">
                        {variant.variantTitle}
                    </div>
                    <div className="ms-match-fix-variant-header-button-wrapper wrapper-column">
                        <div className="wrapper-row">
                            <VSCodeButton appearance="icon" onClick={() => selectVariantCb(idx)}>
                                <i className="codicon codicon-run" style={{color: iconColor}}></i>
                            </VSCodeButton>
                            {!variantForEmptyMatch && (
                                <VSCodeButton appearance="icon"
                                              onClick={() => selectVariantForAllCb(idx)}>
                                    <i className="codicon codicon-run-all" style={{color: iconColor}}></i>
                                </VSCodeButton>
                            )}
                            <VSCodeButton appearance="icon" onClick={toggleDetails}>
                                <i className={detailsIcon} style={{color: iconColor}}></i>
                            </VSCodeButton>
                        </div>
                    </div>
                </div>
                {infoStatementsAvailable && (
                    <div className="ms-match-fix-variant-content-info-statement-wrapper wrapper-row">
                        <InfoStatementContainer infoStatements={infoStatements}/>
                    </div>)}
                {fixVariantDetailsExpanded && (
                    <div className="ms-match-fix-variant-content-detail-wrapper wrapper-row">
                        <FixVariantDetails statements={editStatements}/>
                    </div>
                )}
            </div>
        </>
    );
}

function InfoStatementContainer(props: { infoStatements: FixInfoStatement[]; }) {
    let {infoStatements} = props;

    if (infoStatements.length <= 0) {
        return <span>No information found!</span>;
    } else if (infoStatements.length == 1) {
        const infoStatement: FixInfoStatement = infoStatements.at(0) as FixInfoStatement;

        return (
            <>
                <div className="ms-match-fix-variant-info-statement-wrapper wrapper-column">
                    <div className="wrapper-row">
                        <div className="wrapper-column">
                            <VSCodeTag>Info</VSCodeTag>
                        </div>
                        <div className="ms-match-fix-variant-info-statement-content-wrapper wrapper-column">
                            {infoStatement.msg}
                        </div>
                    </div>
                </div>
            </>
        )
    } else {
        const entries = infoStatements.map((x, idx) => <li key={`info-${idx}`}>{x.msg}</li>)

        return (
            <>
                <div className="wrapper-column">
                    <div className="wrapper-row">
                        <div className="wrapper-column">
                            <VSCodeTag>Info</VSCodeTag>
                        </div>
                        <div className="ms-match-fix-variant-info-statement-content-wrapper wrapper-column">
                            <ul>
                                {entries}
                            </ul>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

function FixVariantDetails(props: { statements: EditRequest[]; }) {
    let {statements} = props;

    const tempRegistry: TemporaryIdRegistry = new TemporaryIdRegistry();
    const entries = statements.map((x, idx) => <li key={`detail-${idx}`}>{getEditRequestAsString(x, tempRegistry)}</li>)

    return (
        <>
            <div className="wrapper-column">
                <div className="wrapper-row">
                    <div className="wrapper-column">
                        <VSCodeTag>Repair</VSCodeTag>
                    </div>
                    <div className="ms-match-fix-variant-details-content-wrapper wrapper-column">
                        <ul>
                            {entries}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    )
}

function getEditRequestAsString(request: EditRequest, registry: TemporaryIdRegistry): string {
    if (request.request.case == "createEdgeRequest") {
        const req: EditCreateEdgeRequest = request.request.value;
        return `Create new edge [${getNodeAsString(req.startNode, registry)}] -${req.referenceName}-> [${getNodeAsString(req.targetNode, registry)}]`;
    } else if (request.request.case == "deleteEdgeRequest") {
        const req: EditDeleteEdgeRequest = request.request.value;
        return `Delete edge [${getNodeAsString(req.startNode, registry)}] -${req.referenceName}-> [${getNodeAsString(req.targetNode, registry)}]`;
    } else if (request.request.case == "createNodeRequest") {
        const req: EditCreateNodeRequest = request.request.value;
        return `Create new node [${registry.getTemporaryName(req.tempId)}:${req.nodeType}] (${req.assignments.map(x => `${x.attributeName} = ${x.attributeValue}`).join(", ")})`;
    } else if (request.request.case == "deleteNodeRequest") {
        const req: EditDeleteNodeRequest = request.request.value;
        return `Delete node [${getNodeAsString(req.node, registry)}]`;
    } else if (request.request.case == "setAttributeRequest") {
        const req: EditSetAttributeRequest = request.request.value;
        return `Update node [${getNodeAsString(req.node, registry)}]:  ${req.attributeName} = ${req.attributeValue}`;
    }
    throw new Error(`Unsupported EditRequest case: ${request.request.case}`);
}

function getNodeAsString(node: Node | undefined, registry: TemporaryIdRegistry): string {
    if (node == undefined) {
        return "Unknown node!";
    } else if (node.nodeType.case == "nodeId") {
        return node.nodeType.value.toString();
    } else if (node.nodeType.case == "tempId") {
        return registry.getTemporaryName(node.nodeType.value);
    }
    throw new Error(`Unsupported nodeType: ${node.nodeType.case}`);
}