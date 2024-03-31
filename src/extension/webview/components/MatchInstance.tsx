import "./MatchInstance.css"
import "./CommonWrappers.css"
import {FixMatch, FixVariant, MatchNode} from "../../generated/de/nexus/modelserver/ModelServerConstraints_pb.js";
import React from "react";
import {VSCodeButton, VSCodeDivider, VSCodeTag} from "@vscode/webview-ui-toolkit/react";
import {MatchFixVariant} from "./MatchFixVariant.js";

export function MatchInstance(props: {
    match: FixMatch; matchIdx: number; selectVariantCb: Function;
    selectVariantForAllCb: Function;
}) {
    let {match, matchIdx, selectVariantCb, selectVariantForAllCb} = props;

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

    const innerSelectVariantCb = (variantIdx: number) => {
        return selectVariantCb(matchIdx, variantIdx);
    }

    const variantProvider = (variant: FixVariant, idx: number, maxIdx: number) => {
        return (
            <>
                <MatchFixVariant idx={idx} key={`variant-${idx}`}
                                 variant={variant} variantForEmptyMatch={match.emptyMatch}
                                 selectVariantCb={innerSelectVariantCb} selectVariantForAllCb={selectVariantForAllCb}/>
                {idx < maxIdx && (
                    <VSCodeDivider className="ms-match-instance-variant-divider" key={`variant-divider-${idx}`}/>)}
            </>
        )
    }

    const matchVariants = match.variants.map((x, idx) => variantProvider(x, idx, match.variants.length - 1));
    const matchHasVariants: boolean = matchVariants.length > 0;

    const matchTagText: string = match.emptyMatch ? "Empty Match" : "Match";

    return (
        <>
            <div className="ms-match-instance-wrapper wrapper-column">
                <div className="ms-match-instance-header wrapper-row">
                    <div className="ms-match-instance-header-tag-wrapper wrapper-column">
                        <VSCodeTag>{matchTagText}</VSCodeTag>
                    </div>
                    <div className="ms-match-instance-header-text-wrapper wrapper-column">
                    </div>
                    <div className="ms-match-instance-header-button-wrapper wrapper-column">
                        {!match.emptyMatch && (
                            <VSCodeButton appearance="icon" onClick={toggleDetails}>
                                <i className={detailsIcon} style={{color: iconColor}}></i>
                            </VSCodeButton>
                        )}
                    </div>
                </div>
                <div className="wrapper-row">
                    <div className="ms-match-instance-content-visualbox wrapper-column"/>
                    <div className="ms-match-instance-content-wrapper wrapper-column">
                        {matchDetailsExpanded && (
                            <div className="ms-match-instance-content-match-desc-wrapper wrapper-row">
                                <MatchDescription nodes={match.nodes}/>
                            </div>
                        )}
                        {matchHasVariants && (
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

    const rows = nodes.map((x, idx) => <MatchNodeDescription node={x} key={`row-${idx}`} idx={idx}/>);

    return (
        <>
            <div className="wrapper-column">
                {rows}
            </div>
        </>
    );
}

function MatchNodeDescription(props: { node: MatchNode; idx: number }) {
    let {node, idx} = props;

    return (
        <>
            <span key={`desc-${idx}`}
                  className="ms-match-instance-content-match-desc-node wrapper-row">{node.nodeName} <i
                className={"codicon codicon-arrow-right ms-match-instance-content-match-desc-node-arrow"}></i> [{node.nodeId}:{node.nodeType}]({node.nodeAttributes.map(x => `${x.attributeName} = ${x.attributeValue}`).join(", ")})</span>
        </>
    );
}
