import "./MatchInstance.css"
import "./CommonWrappers.css"
import {FixMatch, FixVariant, MatchNode} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import React, {useEffect} from "react";
import {VSCodeButton, VSCodeDivider, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {FixProposalOptionCtxt, useFixProposalOptionContext} from "./FixProposalOptionContext.js";
import {MatchInstanceCntxt, useMatchInstanceContext} from "./MatchInstanceContext.js";
import {MatchFixVariant} from "./MatchFixVariant.js";
import {ModelServerEvaluationCtxt, useModelServerEvaluationContext} from "./ModelServerEvaluationContext.js";
import {EditChainRequest, EditRequest} from "../../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";

export function MatchInstance(props: { match: FixMatch; }) {
    let {match} = props;

    const fixPropContext: FixProposalOptionCtxt = useFixProposalOptionContext();
    const matchContext: MatchInstanceCntxt = useMatchInstanceContext();
    const evalContext: ModelServerEvaluationCtxt = useModelServerEvaluationContext();

    const [matchDetailsExpanded, setMatchDetailsExpanded] = React.useState(false);
    const [detailsIcon, setDetailsIcon] = React.useState("codicon codicon-diff-added");

    const computedStyle: CSSStyleDeclaration = getComputedStyle(document.documentElement);

    const iconColor: string = computedStyle.getPropertyValue("--button-primary-foreground");

    const toggleDetails = () => {
        if (matchDetailsExpanded) {
            setMatchDetailsExpanded(false);
            setDetailsIcon("codicon codicon-diff-added");
        } else {
            setMatchDetailsExpanded(true);
            setDetailsIcon("codicon codicon-diff-removed");
        }
    }

    const executeFixVariant = (idx: number) => {
        if (!matchContext.matchFixed) {
            matchContext.setMatchFixed(true);
            matchContext.setSelectedFixVariant(idx);

            const selectedVariant: FixVariant | undefined = match.variants.at(idx);


            if (selectedVariant == undefined) {
                console.error(`Selected FixVariant out of range! Selected ${idx} out of range (0,${match.variants.length - 1})`)
            } else {
                console.log(JSON.stringify(selectedVariant))
                const repairStatements: EditRequest[] = selectedVariant.statements.filter(x => x.stmt.case == "edit").map(x => x.stmt.value as EditRequest);
                const chainRequest: EditChainRequest = new EditChainRequest({edits: repairStatements});
                evalContext.requestModelEdit(chainRequest);
                fixPropContext.decrementRemainingMatches();
            }
        }
    }

    useEffect(() => {
        if (fixPropContext.usedTotalVariantIdx >= 0 && !matchContext.matchFixed) {
            executeFixVariant(fixPropContext.usedTotalVariantIdx)
        }
    }, [fixPropContext.usedTotalVariantIdx])

    const variantProvider = (variant: FixVariant, idx: number, maxIdx: number) => {
        return (
            <>
                <MatchFixVariant idx={idx} key={`variant-${idx}`}
                                 variant={variant}
                                 selectVariantCb={executeFixVariant}/>
                {idx < maxIdx && (<VSCodeDivider className="ms-match-instance-variant-divider"/>)}
            </>
        )
    }

    const matchVariants = match.variants.map((x, idx) => variantProvider(x, idx, match.variants.length - 1));
    const matchHasVariants: boolean = matchVariants.length > 0;

    return (
        <>
            <div className="ms-match-instance-wrapper wrapper-column">
                <div className="ms-match-instance-header wrapper-row">
                    <div className="ms-match-instance-header-tag-wrapper wrapper-column">
                        <VSCodeTag>Match</VSCodeTag>
                    </div>
                    <div className="ms-match-instance-header-text-wrapper wrapper-column">
                    </div>
                    <div className="ms-match-instance-header-button-wrapper wrapper-column">
                        <VSCodeButton appearance="icon" onClick={toggleDetails}>
                            <i className={detailsIcon} style={{color: iconColor}}></i>
                        </VSCodeButton>
                    </div>
                </div>
                <div className="wrapper-row">
                    <div className="ms-match-instance-content-visualbox wrapper-column"/>
                    <div className="ms-match-instance-content-wrapper wrapper-column">
                        {!matchContext.matchFixed && matchDetailsExpanded && (
                            <div className="ms-match-instance-content-match-desc-wrapper wrapper-row">
                                <MatchDescription nodes={match.nodes}/>
                            </div>
                        )}
                        {!matchContext.matchFixed && matchHasVariants && (
                            <div className="ms-match-instance-content-row wrapper-row">
                                <div className="ms-match-instance-content wrapper-column">
                                    {matchVariants}
                                </div>
                            </div>)}
                    </div>
                </div>
            </div>
        </>
    );
}

export function MatchDescription(props: { nodes: MatchNode[]; }) {
    let {nodes} = props;

    const rows = nodes.map((x, idx) => <MatchNodeDescription node={x} key={`row-${idx}`}/>);

    return (
        <>
            <div className="wrapper-column">
                {rows}
            </div>
        </>
    );
}

function MatchNodeDescription(props: { node: MatchNode; }) {
    let {node} = props;

    return (
        <>
            <span
                className="ms-match-instance-content-match-desc-node wrapper-row">{node.nodeName} <i
                className={"codicon codicon-arrow-right ms-match-instance-content-match-desc-node-arrow"}></i> [{node.nodeId}:{node.nodeType}]({node.nodeAttributes.map(x => `${x.attributeName} = ${x.attributeValue}`).join(", ")})</span>
        </>
    );
}
