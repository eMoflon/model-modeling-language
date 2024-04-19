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
    isPatternExtensionAnnotation,
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
        } else if (isPatternExtensionAnnotation(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('(').prepend(Formatting.noSpace());
            formatter.property('basePattern').surround(Formatting.noSpace());
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
            if (node.fixTitle != undefined) {
                formatter.keyword('(').prepend(Formatting.noSpace());
                formatter.property('fixTitle').surround(Formatting.noSpace());
            }
            if (node.emptyFix) {
                formatter.keyword('empty').append(Formatting.oneSpace());
            }
        } else if (isDisableFixContainer(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            if (node.fixTitle != undefined) {
                formatter.keyword('(').prepend(Formatting.noSpace());
                formatter.property('fixTitle').surround(Formatting.noSpace());
            }
            if (node.emptyFix) {
                formatter.keyword('empty').append(Formatting.oneSpace());
            }
        } else if (isFixInfoStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('msg').prepend(Formatting.oneSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isFixSetStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('set').append(Formatting.oneSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
            if (node.val != undefined) {
                formatter.keyword('=').surround(Formatting.oneSpace());
            }
        } else if (isFixDeleteNodeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('delete').append(Formatting.oneSpace());
            formatter.keyword('node').append(Formatting.oneSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isFixDeleteEdgeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('delete').append(Formatting.oneSpace());
            formatter.keyword('edge').append(Formatting.oneSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isFixCreateEdgeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('create').append(Formatting.oneSpace());
            formatter.keyword('edge').append(Formatting.oneSpace());
            formatter.property('fromNode').append(Formatting.oneSpace());
            formatter.keyword('-').append(Formatting.noSpace());
            formatter.property('reference').append(Formatting.noSpace());
            formatter.keyword('->').append(Formatting.oneSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isFixCreateNodeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            const varFormatter = this.getNodeFormatter(node.nodeVar);
            formatter.keyword('create').append(Formatting.oneSpace());
            formatter.keyword('node').append(Formatting.oneSpace());
            varFormatter.property('typing').append(Formatting.oneSpace());
            varFormatter.property('name').append(Formatting.noSpace());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());

            formatter.keyword('(').append(Formatting.noSpace());

            if (node.assignments.length > 0) {
                formatter.keyword(')').prepend(Formatting.noSpace());
            }

            node.assignments.forEach(assignment => {
                const assignmentFormatter = this.getNodeFormatter(assignment);
                assignmentFormatter.keyword('=').surround(Formatting.oneSpace());
            })
        }
    }
}