import {AbstractSemanticTokenProvider, AstNode, SemanticTokenAcceptor} from "langium";
import {
    EnumEntry,
    isAttribute,
    isBinaryExpression,
    isBoolExpr,
    isClass,
    isCReference,
    isEnum,
    isEnumEntry,
    isFunctionAssignment,
    isFunctionCall,
    isFunctionLoop,
    isFunctionMacroCall,
    isFunctionReturn,
    isIFunction,
    isIInstance,
    isIMacro,
    isImport,
    isInstanceLoop,
    isInterface,
    isMacroAssignStatement,
    isMacroAttributeStatement,
    isMacroInstance,
    isMultiplicity,
    isNumberExpr,
    isOppositeAnnotation,
    isPackage,
    isStringExpr,
    isTypedVariable
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
export class ModelModelingLanguageSemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void | "prune" | undefined {
        if (isClass(node)) {
            acceptor({node, keyword: "abstract", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "class", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "name", type: SemanticTokenTypes.class});
            acceptor({node, property: "extendedClasses", type: SemanticTokenTypes.class});
            acceptor({node, property: "implementedInterfaces", type: SemanticTokenTypes.interface});
        } else if (isOppositeAnnotation(node)) {
            acceptor({node, keyword: "@opposite", type: SemanticTokenTypes.decorator})
            acceptor({node, property: "reference", type: SemanticTokenTypes.property})
        } else if (isPackage(node)) {
            acceptor({node, keyword: "package", type: SemanticTokenTypes.keyword})
            acceptor({node, property: "name", type: SemanticTokenTypes.namespace})
        } else if (isImport(node)) {
            acceptor({node, keyword: "import", type: SemanticTokenTypes.keyword})
            acceptor({node, property: "target", type: SemanticTokenTypes.string})
            acceptor({node, keyword: "using", type: SemanticTokenTypes.keyword})
            acceptor({node, keyword: "as", type: SemanticTokenTypes.keyword})
        } else if (isInterface(node)) {
            acceptor({node, keyword: "abstract", type: SemanticTokenTypes.keyword})
            acceptor({node, keyword: "interface", type: SemanticTokenTypes.keyword})
            acceptor({node, property: "name", type: SemanticTokenTypes.interface})
            acceptor({node, property: "extendedInterfaces", type: SemanticTokenTypes.interface})
        } else if (isAttribute((node))) {
            acceptor({node, keyword: "attribute", type: SemanticTokenTypes.keyword})
            acceptor({node, property: "type", type: SemanticTokenTypes.type})
            acceptor({node, property: "name", type: SemanticTokenTypes.property})
            acceptor({node, property: "modifiers", type: SemanticTokenTypes.modifier})
            acceptor({node, keyword: "=", type: SemanticTokenTypes.operator})
        } else if (isEnum(node)) {
            acceptor({node, keyword: "enum", type: SemanticTokenTypes.keyword})
            acceptor({node, property: "name", type: SemanticTokenTypes.enum})
        } else if (isEnumEntry(node)) {
            acceptor({node, property: "name", type: SemanticTokenTypes.enumMember})
            acceptor({node, keyword: "=", type: SemanticTokenTypes.operator})
            if ((node as EnumEntry).value != undefined) {
                if (isStringExpr(node.value)) {
                    acceptor({node, property: "value", type: SemanticTokenTypes.string})
                } else if (isNumberExpr(node.value)) {
                    acceptor({node, property: "value", type: SemanticTokenTypes.number})
                }
            }
        } else if (isCReference(node)) {
            acceptor({node, keyword: "reference", type: SemanticTokenTypes.keyword})
            acceptor({node, property: "type", type: SemanticTokenTypes.type})
            acceptor({node, property: "name", type: SemanticTokenTypes.property})
            acceptor({node, property: "modifiers", type: SemanticTokenTypes.modifier})
        } else if (isMultiplicity(node)) {
            if (node.mult != undefined) {
                if (node.mult.n_0 || node.mult.n) {
                    acceptor({node, property: "mult", type: SemanticTokenTypes.string})
                } else {
                    acceptor({node, property: "mult", type: SemanticTokenTypes.number})
                }
            }
            if (node.upperMult != undefined) {
                if (node.upperMult.n_0 || node.upperMult.n) {
                    acceptor({node, property: "upperMult", type: SemanticTokenTypes.string})
                } else {
                    acceptor({node, property: "upperMult", type: SemanticTokenTypes.number})
                }
            }
        } else if (isTypedVariable(node)) {
            acceptor({node, property: "typing", type: SemanticTokenTypes.type});
            acceptor({node, property: "name", type: SemanticTokenTypes.property});
        } else if (isIMacro(node)) {
            acceptor({node, keyword: "macro", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "name", type: SemanticTokenTypes.function});
        } else if (isMacroInstance(node)) {
            if (node.iVar != undefined) {
                acceptor({node, property: "iVar", type: SemanticTokenTypes.property});
            }
        } else if (isMacroAttributeStatement(node)) {
            acceptor({node, property: "attr", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "=", type: SemanticTokenTypes.operator});
            acceptor({node, property: "value", type: SemanticTokenTypes.property});
        } else if (isMacroAssignStatement(node)) {
            acceptor({node, property: "cref", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "->", type: SemanticTokenTypes.operator});
            acceptor({node, property: "instance", type: SemanticTokenTypes.property});
        } else if (isIFunction(node)) {
            acceptor({node, keyword: "function", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "name", type: SemanticTokenTypes.function});
            if (node.typing != undefined) {
                acceptor({node, keyword: "returns", type: SemanticTokenTypes.keyword});
                acceptor({node, property: "typing", type: SemanticTokenTypes.property});
            }
        } else if (isFunctionCall(node)) {
            acceptor({node, property: "func", type: SemanticTokenTypes.function});
        } else if (isFunctionMacroCall(node)) {
            acceptor({node, property: "macro", type: SemanticTokenTypes.function});
        } else if (isFunctionLoop(node)) {
            acceptor({node, keyword: "for", type: SemanticTokenTypes.keyword});
            acceptor({node, keyword: "in", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "lower", type: SemanticTokenTypes.number});
            acceptor({node, keyword: ":", type: SemanticTokenTypes.operator});
            acceptor({node, property: "upper", type: SemanticTokenTypes.number});
        } else if (isFunctionReturn(node)) {
            acceptor({node, keyword: "return", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "var", type: SemanticTokenTypes.property});
        } else if (isFunctionAssignment(node)) {
            acceptor({node, keyword: "=", type: SemanticTokenTypes.operator});
        } else if (isIInstance(node)) {
            acceptor({node, keyword: "instance", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "name", type: SemanticTokenTypes.function});
        } else if (isInstanceLoop(node)) {
            acceptor({node, keyword: "for", type: SemanticTokenTypes.keyword});
            acceptor({node, property: "var", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "-", type: SemanticTokenTypes.operator});
            acceptor({node, property: "ref", type: SemanticTokenTypes.property});
            acceptor({node, keyword: "->", type: SemanticTokenTypes.operator});
        } else if (isBoolExpr(node)) {
            acceptor({node, property: "value", type: SemanticTokenTypes.variable})
        } else if (isStringExpr(node)) {
            acceptor({node, property: "value", type: SemanticTokenTypes.string})
        } else if (isNumberExpr(node)) {
            acceptor({node, property: "value", type: SemanticTokenTypes.number})
        } else if (isBinaryExpression(node)) {
            acceptor({node, property: "operator", type: SemanticTokenTypes.operator})
        }
    }

}