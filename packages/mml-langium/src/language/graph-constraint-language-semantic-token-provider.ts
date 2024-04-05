import {AbstractSemanticTokenProvider, AstNode, SemanticTokenAcceptor} from "langium";
import {
    isBinaryExpression,
    isCompactBindingStatement,
    isConstraint,
    isConstraintAssertion,
    isConstraintPatternDeclaration,
    isCreateNodeAttributeAssignment,
    isDescriptionAnnotation,
    isDisableDefaultNodeConstraintsAnnotation,
    isDisableFixContainer,
    isEnableFixContainer,
    isEnforceAnnotation,
    isExpression,
    isFixCreateEdgeStatement,
    isFixCreateNodeStatement,
    isFixDeleteEdgeStatement,
    isFixDeleteNodeStatement,
    isFixInfoStatement,
    isFixSetStatement,
    isForbidAnnotation,
    isNodeConstraintAnnotation,
    isPattern,
    isPatternAttributeConstraint,
    isPatternBindAnnotation,
    isPatternObject,
    isPatternObjectReference,
    isQualifiedValueExpr,
    isTemplateLiteral,
    isTitleAnnotation,
    isTypedVariable,
    isUnaryExpression,
    isUntypedVariable,
    isVariableValueExpr
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
export class GraphConstraintLanguageSemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void | "prune" | undefined {
        if (isPattern(node)) {
            acceptor({node, keyword: "pattern", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "name", type: SemanticTokenTypes.class});
        } else if (isPatternObjectReference(node)) {
            acceptor({node, property: "ref", type: SemanticTokenTypes.property});
            if (node.alias != undefined) {
                acceptor({node, keyword: "-", type: SemanticTokenTypes.operator});
            }
            acceptor({node, keyword: "->", type: SemanticTokenTypes.operator});
            acceptor({node, property: "patternObj", type: SemanticTokenTypes.property});
        } else if (isPatternAttributeConstraint(node)) {
            acceptor({node, keyword: "#", type: SemanticTokenTypes.keyword});
            if (node.alias != undefined) {
                acceptor({node, keyword: ":", type: SemanticTokenTypes.operator});
            }
        } else if (isCompactBindingStatement(node)) {
            acceptor({node, property: "selfVar", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "=", type: SemanticTokenTypes.operator});
            acceptor({node, property: "otherVar", type: SemanticTokenTypes.property});
        } else if (isEnforceAnnotation(node)) {
            acceptor({node, keyword: "@Enforce", type: SemanticTokenTypes.decorator});
            acceptor({node, property: "pattern", type: SemanticTokenTypes.class});
        } else if (isForbidAnnotation(node)) {
            acceptor({node, keyword: "@Forbid", type: SemanticTokenTypes.decorator});
            acceptor({node, property: "pattern", type: SemanticTokenTypes.class});
        } else if (isDisableDefaultNodeConstraintsAnnotation(node)) {
            acceptor({node, keyword: "@DisableDefaultNodeConstraints", type: SemanticTokenTypes.decorator});
        } else if (isNodeConstraintAnnotation(node)) {
            acceptor({node, keyword: "@NodeConstraint", type: SemanticTokenTypes.decorator});
            acceptor({node, property: "node1", type: SemanticTokenTypes.class});
            acceptor({node, property: "node2", type: SemanticTokenTypes.class});
        } else if (isTitleAnnotation(node)) {
            acceptor({node, keyword: "@title", type: SemanticTokenTypes.decorator});
        } else if (isDescriptionAnnotation(node)) {
            acceptor({node, keyword: "@description", type: SemanticTokenTypes.decorator});
        } else if (isPatternBindAnnotation(node)) {
            acceptor({node, keyword: "@Bind", type: SemanticTokenTypes.decorator});
            acceptor({node, property: "pattern", type: SemanticTokenTypes.class});
        } else if (isTypedVariable(node)) {
            acceptor({node, property: "typing", type: SemanticTokenTypes.type});
            acceptor({node, property: "name", type: SemanticTokenTypes.property});
        } else if (isUntypedVariable(node)) {
            acceptor({node, property: "name", type: SemanticTokenTypes.property});
        } else if (isVariableValueExpr(node)) {
            acceptor({node, property: "val", type: SemanticTokenTypes.property});
        } else if (isPatternObject(node)) {
            if (node.local) {
                acceptor({node, keyword: "local", type: SemanticTokenTypes.modifier});
            }
        } else if (isBinaryExpression(node)) {
            acceptor({node, property: "operator", type: SemanticTokenTypes.operator});
        } else if (isUnaryExpression(node)) {
            acceptor({node, property: "operator", type: SemanticTokenTypes.operator});
        } else if (isQualifiedValueExpr(node)) {
            acceptor({node, property: "val", type: SemanticTokenTypes.property});
        } else if (isConstraint(node)) {
            acceptor({node, keyword: "constraint", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "name", type: SemanticTokenTypes.class});
        } else if (isConstraintPatternDeclaration(node)) {
            acceptor({node, keyword: "specification", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "pattern", type: SemanticTokenTypes.class});
        } else if (isConstraintAssertion(node)) {
            acceptor({node, keyword: "assert", type: SemanticTokenTypes.keyword});
        } else if (isEnableFixContainer(node)) {
            acceptor({node, keyword: "enable", type: SemanticTokenTypes.keyword});
            if (node.emptyFix) {
                acceptor({node, keyword: "empty", type: SemanticTokenTypes.keyword});
            }
        } else if (isDisableFixContainer(node)) {
            acceptor({node, keyword: "disable", type: SemanticTokenTypes.keyword});
            if (node.emptyFix) {
                acceptor({node, keyword: "empty", type: SemanticTokenTypes.keyword});
            }
        } else if (isFixInfoStatement(node)) {
            acceptor({node, keyword: "info", type: SemanticTokenTypes.keyword});
        } else if (isFixSetStatement(node)) {
            acceptor({node, keyword: "set", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "attr", type: SemanticTokenTypes.property});
            if (node.val != undefined) {
                acceptor({node, keyword: "=", type: SemanticTokenTypes.operator});
                acceptor({node, property: "val", type: SemanticTokenTypes.property});
            }
        } else if (isFixDeleteNodeStatement(node)) {
            acceptor({node, keyword: "delete", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "node", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "node", type: SemanticTokenTypes.property});
        } else if (isFixDeleteEdgeStatement(node)) {
            acceptor({node, keyword: "delete", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "edge", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "edge", type: SemanticTokenTypes.property});
        } else if (isFixCreateEdgeStatement(node)) {
            acceptor({node, keyword: "create", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "edge", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "fromNode", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "-", type: SemanticTokenTypes.operator});
            acceptor({node, property: "reference", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "->", type: SemanticTokenTypes.operator});
            acceptor({node, property: "toNode", type: SemanticTokenTypes.property});
        } else if (isFixCreateNodeStatement(node)) {
            acceptor({node, keyword: "create", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "node", type: SemanticTokenTypes.keyword});
        } else if (isCreateNodeAttributeAssignment(node)) {
            acceptor({node, property: "attr", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "=", type: SemanticTokenTypes.operator});
        } else if (isTemplateLiteral(node)) {
            acceptor({node, keyword: "'", type: SemanticTokenTypes.string});

            for (let i = 0; i < node.content.length; i++) {
                if (!isExpression(node.content[i])) {
                    acceptor({node, property: "content", index: i, type: SemanticTokenTypes.string});
                }
            }
        }
    }

}