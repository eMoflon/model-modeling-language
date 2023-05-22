import {AbstractFormatter, AstNode, Formatting} from "langium";
import {isAttribute, isClass, isImport, isPackage} from "./generated/ast";
import {ModelModelingLanguageUtils} from "./model-modeling-language-utils";

export class ModelModelingLanguageFormatter extends AbstractFormatter {
    protected format(node: AstNode): void {
        if (isImport(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('import').append(Formatting.oneSpace());
            if (node.aliases.length > 0) {
                formatter.property('target').append(Formatting.oneSpace());
                formatter.keyword('using').append(Formatting.oneSpace());
                formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            }
            formatter.keyword(';').prepend(Formatting.noSpace());
            formatter.node(node).prepend(Formatting.noIndent());
        } else if (isPackage(node)) {
            const formatter = this.getNodeFormatter(node);
            const packageLevel = ModelModelingLanguageUtils.getIndentationLevel(node);
            if (packageLevel == 0) {
                formatter.node(node).prepend(Formatting.noIndent());
            } else {
                for (let i = 0; i < packageLevel; i++) {
                    formatter.node(node).prepend(Formatting.indent());
                }
            }
            formatter.property('name').surround(Formatting.oneSpace());
            formatter.keyword('{').append(Formatting.newLine());
            formatter.keyword('}').prepend(Formatting.newLine());
            formatter.node(node).prepend(Formatting.newLines(2));
        } else if (isClass(node)) {
            const formatter = this.getNodeFormatter(node);
            const classLevel = ModelModelingLanguageUtils.getIndentationLevel(node);
            for (let i = 0; i < classLevel; i++) {
                formatter.node(node).prepend(Formatting.indent());
            }
            formatter.property('name').surround(Formatting.oneSpace());
            if (node.abstract) {
                formatter.keyword('abstract').append(Formatting.oneSpace());
            }
            if (node.extendedClasses.length > 0 || node.implementedInterfaces.length > 0) {
                formatter.keyword(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            }
            formatter.keyword('{').append(Formatting.newLine());
            formatter.keyword('}').prepend(Formatting.newLine());
        } else if (isAttribute(node)) {
            const formatter = this.getNodeFormatter(node);
            const attributeLevel = ModelModelingLanguageUtils.getIndentationLevel(node);
            for (let i = 0; i < attributeLevel; i++) {
                formatter.node(node).prepend(Formatting.indent());
            }
            formatter.property('type').surround(Formatting.oneSpace());
            if (node.defaultValue != undefined) {
                formatter.keyword('=').surround(Formatting.oneSpace());
            }
            if (node.modifiers != undefined) {

                formatter.keyword('{').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
                formatter.keyword('}').prepend(Formatting.noSpace());
            }
            formatter.keyword(';').prepend(Formatting.noSpace());
        }
    }

}