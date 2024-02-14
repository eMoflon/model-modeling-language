import {AbstractFormatter, AstNode, Formatting} from "langium";
import {
    isBinaryExpression,
    isConstraint,
    isConstraintAssertion,
    isConstraintDocument,
    isConstraintPatternDeclaration,
    isDescriptionAnnotation,
    isDisableDefaultNodeConstraintsAnnotation,
    isDisableFixContainer,
    isEnableFixContainer,
    isEnforceAnnotation,
    isFixInfoStatement,
    isForbidAnnotation,
    isNodeConstraintAnnotation,
    isPattern,
    isPatternAttributeConstraint,
    isPatternObject,
    isPatternObjectReference,
    isTitleAnnotation,
    isUnaryExpression
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
        } else if (isNodeConstraintAnnotation(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('(').prepend(Formatting.noSpace());
            formatter.property('node1').prepend(Formatting.noSpace());
            formatter.property('operator').surround(Formatting.oneSpace());
            formatter.property('node2').append(Formatting.noSpace());
            formatter.keyword(')').append(Formatting.newLine());
        } else if (isDisableDefaultNodeConstraintsAnnotation(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('(').prepend(Formatting.noSpace()).append(Formatting.noSpace());
            formatter.keyword(')').append(Formatting.newLine());
        } else if (isTitleAnnotation(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('(').prepend(Formatting.noSpace()).append(Formatting.noSpace());
            formatter.keyword(')').append(Formatting.newLine());
        } else if (isDescriptionAnnotation(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('(').prepend(Formatting.noSpace()).append(Formatting.noSpace());
            formatter.keyword(')').append(Formatting.newLine());
        } else if (isPattern(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            formatter.property('name').prepend(Formatting.oneSpace());
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
            if (node.alias != undefined) {
                formatter.keyword(':').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            }
        } else if (isBinaryExpression(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('operator').surround(Formatting.oneSpace());
        } else if (isUnaryExpression(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('!').append(Formatting.noSpace());
        } else if (isConstraint(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            formatter.property('name').prepend(Formatting.oneSpace());
        } else if (isConstraintPatternDeclaration(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            formatter.property('pattern').surround(Formatting.oneSpace());
            formatter.property('var').append(Formatting.noSpace());
        } else if (isConstraintAssertion(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('expr').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
        } else if (isEnableFixContainer(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
        } else if (isDisableFixContainer(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
        } else if (isFixInfoStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('msg').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
        }
    }
}