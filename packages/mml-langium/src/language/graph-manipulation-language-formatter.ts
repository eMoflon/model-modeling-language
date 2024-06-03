import {AbstractFormatter, AstNode, Formatting} from "langium";
import {
    isCreateEdgeStatement,
    isCreateNodeStatement,
    isDeleteEdgeStatement,
    isDeleteNodeStatement,
    isDisplayStatement,
    isExportStatement,
    isGMChainStatement,
    isGraphManipulationDocument,
    isSetAttributeStatement
} from "./generated/ast.js";

/**
 * The Formatter deals with formatting GC code in the file. More precisely, correct
 * line breaks and spaces between individual tokens are checked and adjusted if necessary.
 */
export class GraphManipulationLanguageFormatter extends AbstractFormatter {
    protected format(node: AstNode): void {
        if (isGraphManipulationDocument(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.nodes(...node.statements).prepend(Formatting.noIndent());
        } else if (isGMChainStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
        } else if (isSetAttributeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('set').append(Formatting.oneSpace());
            formatter.property('target').append(Formatting.noSpace());
            formatter.keyword(':').append(Formatting.oneSpace());
            formatter.keyword('=').surround(Formatting.oneSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isCreateNodeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('create').append(Formatting.oneSpace());
            formatter.keyword('node').append(Formatting.oneSpace());
            formatter.property('nodeType').append(Formatting.oneSpace());
            formatter.property('nodeVar').append(Formatting.noSpace());
            formatter.keyword('(').append(Formatting.noSpace());
            if (node.assignments.length > 0) {
                formatter.keyword(')').prepend(Formatting.noSpace());
                formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            }
            for (const assignment of node.assignments) {
                const assignmentFormatter = this.getNodeFormatter(assignment);
                assignmentFormatter.keyword('=').surround(Formatting.oneSpace());
            }
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isCreateEdgeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('create').append(Formatting.oneSpace());
            formatter.keyword('edge').append(Formatting.oneSpace());
            formatter.property('fromNode').append(Formatting.oneSpace());
            formatter.property('toNode').prepend(Formatting.oneSpace());
            formatter.property('reference').surround(Formatting.noSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isDeleteNodeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('delete').append(Formatting.oneSpace());
            formatter.keyword('node').append(Formatting.oneSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isDeleteEdgeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('delete').append(Formatting.oneSpace());
            formatter.keyword('edge').append(Formatting.oneSpace());
            formatter.property('fromNode').append(Formatting.oneSpace());
            formatter.property('toNode').prepend(Formatting.oneSpace());
            formatter.property('reference').surround(Formatting.noSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isExportStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('export').append(Formatting.noSpace());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            formatter.keywords('=').surround(Formatting.noSpace());
            formatter.keyword('(').append(Formatting.noSpace());
            formatter.keyword(')').prepend(Formatting.noSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isDisplayStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('display').append(Formatting.noSpace())
            formatter.keyword('(').append(Formatting.noSpace());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            formatter.keyword(')').prepend(Formatting.noSpace());
            formatter.keyword(';').prepend(Formatting.noSpace());
        }
    }
}