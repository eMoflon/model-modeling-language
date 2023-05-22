import {AbstractSemanticTokenProvider, AstNode, SemanticTokenAcceptor} from "langium";
import {
    Attribute,
    EnumEntry,
    isAttribute,
    isBoolExpr,
    isClass,
    isCReference,
    isEnum,
    isEnumEntry,
    isImport,
    isInterface,
    isMultiplicity,
    isNumberExpr,
    isOppositeAnnotation,
    isPackage,
    isStringExpr
} from "./generated/ast";
import {SemanticTokenTypes} from "vscode-languageserver";

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
            if ((node as Attribute).defaultValue != undefined) {
                if (isStringExpr(node.defaultValue)) {
                    acceptor({node, property: "defaultValue", type: SemanticTokenTypes.string})
                } else if (isNumberExpr(node.defaultValue)) {
                    acceptor({node, property: "defaultValue", type: SemanticTokenTypes.number})
                } else if (isBoolExpr(node.defaultValue)) {
                    acceptor({node, property: "defaultValue", type: SemanticTokenTypes.variable})
                }
            }
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
                if (typeof node.mult == "string") {
                    acceptor({node, property: "mult", type: SemanticTokenTypes.string})
                } else {
                    acceptor({node, property: "mult", type: SemanticTokenTypes.number})
                }
            }
            if (node.upperMult != undefined) {
                if (typeof node.upperMult == "string") {
                    acceptor({node, property: "upperMult", type: SemanticTokenTypes.string})
                } else {
                    acceptor({node, property: "upperMult", type: SemanticTokenTypes.number})
                }
            }
        }
    }

}