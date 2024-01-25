import {AbstractFormatter, AstNode, Formatting} from "langium";
import {
    isConstraintDocument,
    isEnforceAnnotation,
    isForbidAnnotation,
    isPattern,
    isPatternAttributeConstraint,
    isPatternObject,
    isPatternObjectReference
} from "./generated/ast.js";

/**
 * The Formatter deals with formatting GC code in the file. More precisely, correct
 * line breaks and spaces between individual tokens are checked and adjusted if necessary.
 */
export class GraphConstraintLanguageFormatter extends AbstractFormatter {
    protected format(node: AstNode): void {
        if (isConstraintDocument(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.nodes(...node.patterns).prepend(Formatting.noIndent());
        } else if (isEnforceAnnotation(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('(').prepend(Formatting.noSpace());
            formatter.property('pattern').surround(Formatting.noSpace());
            if (node.binding.length > 0) {
                formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
                formatter.keywords('=').surround(Formatting.noSpace());
            }
            formatter.keyword(')').append(Formatting.newLine());
        } else if (isForbidAnnotation(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('(').prepend(Formatting.noSpace());
            formatter.property('pattern').surround(Formatting.noSpace());
            if (node.binding.length > 0) {
                formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
                formatter.keywords('=').surround(Formatting.noSpace());
            }
            formatter.keyword(')').append(Formatting.newLine());
        } else if (isPattern(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            formatter.property('name').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
        } else if (isPatternObject(node)) {
            const formatter = this.getNodeFormatter(node);
            const varFormatter = this.getNodeFormatter(node.var);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            if (node.local) {
                formatter.keyword('local').append(Formatting.oneSpace());
            }
            varFormatter.property('name').prepend(Formatting.oneSpace());
        } else if (isPatternObjectReference(node)) {
            const formatter = this.getNodeFormatter(node);
            if (node.alias != undefined) {
                formatter.keyword('-').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
                formatter.keyword('->').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            } else {
                formatter.keyword('->').surround(Formatting.oneSpace());
            }
        } else if (isPatternAttributeConstraint(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('#').append(Formatting.noSpace());
        }
    }
}