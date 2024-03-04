import {AbstractSemanticTokenProvider, AstNode, SemanticTokenAcceptor} from "langium";
import {
    isCreateEdgeStatement,
    isCreateNodeAttributeAssignment,
    isCreateNodeStatement,
    isDeleteEdgeStatement,
    isDeleteNodeStatement,
    isGMChainStatement,
    isSetAttributeStatement,
    isTargetNode,
    isUntypedVariable
} from "./generated/ast.js";
import {SemanticTokenTypes} from "vscode-languageserver";

/**
 * The SemanticTokenProvider deals with semantic highlighting. While syntax highlighting can
 * be done on token level by TextMate, semantic highlighting allows even more granular and
 * type specific options.
 *
 * For this purpose, a SemanticTokenType is defined for each component of each language
 * element, which is returned to the frontend by the Language Server. Based on these
 * types, the UI determines the color to be displayed.
 *
 * IMPORTANT: It is not possible to assign specific colors at this point. The final design is
 * exclusively determined by the UI.
 */
export class GraphManipulationLanguageSemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void | "prune" | undefined {
        if (isTargetNode(node)) {
            if (node.nodeId != undefined) {
                acceptor({node, property: "nodeId", type: SemanticTokenTypes.property});
            }
            if (node.tempNodeVar != undefined) {
                acceptor({node, property: "tempNodeVar", type: SemanticTokenTypes.operator});
            }
        } else if (isGMChainStatement(node)) {
            acceptor({node, keyword: "chain", type: SemanticTokenTypes.keyword});
        } else if (isSetAttributeStatement(node)) {
            acceptor({node, keyword: "set", type: SemanticTokenTypes.keyword});
        } else if (isCreateNodeStatement(node)) {
            acceptor({node, keyword: "create", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "node", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "nodeType", type: SemanticTokenTypes.class});
        } else if (isCreateEdgeStatement(node)) {
            acceptor({node, keyword: "create", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "edge", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "-", type: SemanticTokenTypes.operator});
            acceptor({node, keyword: "->", type: SemanticTokenTypes.operator});
        } else if (isCreateNodeAttributeAssignment(node)) {
            acceptor({node, property: "attr", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "=", type: SemanticTokenTypes.operator});
        } else if (isDeleteNodeStatement(node)) {
            acceptor({node, keyword: "delete", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "node", type: SemanticTokenTypes.keyword});
        } else if (isDeleteEdgeStatement(node)) {
            acceptor({node, keyword: "delete", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "edge", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "-", type: SemanticTokenTypes.operator});
            acceptor({node, keyword: "->", type: SemanticTokenTypes.operator});
        } else if (isUntypedVariable(node)) {
            acceptor({node, property: "name", type: SemanticTokenTypes.operator});
        }
    }

}