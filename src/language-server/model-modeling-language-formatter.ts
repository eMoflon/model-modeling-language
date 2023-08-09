import {AbstractFormatter, AstNode, Formatting} from "langium";
import {
    isAttribute,
    isBinaryExpression,
    isClass,
    isCReference,
    isEnum,
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
    isModel,
    isPackage,
    isTypedVariable
} from "./generated/ast";

export class ModelModelingLanguageFormatter extends AbstractFormatter {
    protected format(node: AstNode): void {
        if (isModel(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.nodes(...node.imports).prepend(Formatting.noIndent());
            formatter.nodes(...node.packages).prepend(Formatting.noIndent());
            formatter.nodes(...node.macros).prepend(Formatting.noIndent());
            formatter.nodes(...node.functions).prepend(Formatting.noIndent());
        } else if (isImport(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('import').append(Formatting.oneSpace());
            if (node.aliases.length > 0) {
                formatter.property('target').prepend(Formatting.oneSpace());
                formatter.keyword('using').surround(Formatting.oneSpace());
                formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
                node.aliases.forEach(ia => {
                    const iaFormatter = this.getNodeFormatter(ia);
                    iaFormatter.keyword('as').surround(Formatting.oneSpace());
                })
            }
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isPackage(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesClose.prepend(Formatting.newLine())
            formatter.property('name').surround(Formatting.oneSpace());
        } else if (isClass(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesClose.prepend(Formatting.newLine());
            if (node.abstract) {
                formatter.keyword('abstract').append(Formatting.oneSpace());
            }
            if (node.extendedClasses.length > 0 || node.implementedInterfaces.length > 0) {
                formatter.property('name').prepend(Formatting.oneSpace());
                bracesOpen.prepend(Formatting.oneSpace());
            } else {
                formatter.property('name').surround(Formatting.oneSpace());
            }
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            if (node.extendedClasses.length > 0) {
                formatter.keyword('extends').surround(Formatting.oneSpace());
            }
            if (node.implementedInterfaces.length > 0) {
                formatter.keyword('implements').surround(Formatting.oneSpace());
            }
        } else if (isInterface(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesClose.prepend(Formatting.newLine());
            if (node.abstract) {
                formatter.keyword('abstract').append(Formatting.oneSpace());
            }
            if (node.extendedInterfaces.length > 0) {
                formatter.property('name').prepend(Formatting.oneSpace());
                bracesOpen.prepend(Formatting.oneSpace());
            } else {
                formatter.property('name').surround(Formatting.oneSpace());
            }
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
            if (node.extendedInterfaces.length > 0) {
                formatter.keyword('extends').surround(Formatting.oneSpace());
            }
        } else if (isEnum(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('name').surround(Formatting.oneSpace());
            formatter.keyword('}').prepend(Formatting.newLine());
            formatter.keywords(',').prepend(Formatting.noSpace());
            node.entries.forEach(entry => {
                formatter.node(entry).prepend(Formatting.indent());
                const entryFormatter = this.getNodeFormatter(entry);
                if (entry.value != undefined) {
                    entryFormatter.keyword('=').surround(Formatting.oneSpace());
                }
            });
        } else if (isAttribute(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('type').surround(Formatting.oneSpace());
            if (node.defaultValue != undefined) {
                formatter.keyword('=').surround(Formatting.oneSpace());
            }
            if (node.modifiers != undefined) {
                formatter.keyword('{').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
                formatter.keyword('}').prepend(Formatting.noSpace());
            }
            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isCReference(node)) {
            const formatter = this.getNodeFormatter(node);
            if (node.opposite != undefined) {
                const oppoFormatter = this.getNodeFormatter(node.opposite);
                oppoFormatter.property('reference').prepend(Formatting.oneSpace());
                oppoFormatter.property('reference').append(Formatting.newLine());
            }

            formatter.property('type').prepend(Formatting.oneSpace()).append(Formatting.noSpace());

            if (node.multiplicity != undefined) {
                const multiFormatter = this.getNodeFormatter(node.multiplicity);
                multiFormatter.keyword('[').append(Formatting.noSpace());
                multiFormatter.keyword(']').prepend(Formatting.noSpace());
                if (node.multiplicity.upperMult != undefined) {
                    multiFormatter.keyword('..').surround(Formatting.noSpace());
                }
            }

            formatter.property('name').prepend(Formatting.oneSpace());

            if (node.modifiers != undefined) {
                formatter.keyword('{').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
                formatter.keyword('}').prepend(Formatting.noSpace());
            }

            formatter.keyword(';').prepend(Formatting.noSpace());
        } else if (isIMacro(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesClose.prepend(Formatting.newLine());

            formatter.property('name').prepend(Formatting.oneSpace()).append(Formatting.noSpace());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
        } else if (isTypedVariable(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('name').prepend(Formatting.oneSpace());
        } else if (isMacroInstance(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
        } else if (isMacroAttributeStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('=').surround(Formatting.oneSpace());
        } else if (isMacroAssignStatement(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('->').surround(Formatting.oneSpace());
        } else if (isIFunction(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            formatter.property('name').surround(Formatting.oneSpace());
            if (node.typing != undefined) {
                formatter.keyword('returns').surround(Formatting.oneSpace());
            }
        } else if (isFunctionCall(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('func').append(Formatting.noSpace());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.noSpace());
        } else if (isFunctionMacroCall(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('macro').append(Formatting.noSpace());
            formatter.keywords(',').prepend(Formatting.noSpace()).append(Formatting.noSpace());
        } else if (isFunctionAssignment(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('=').surround(Formatting.oneSpace());
        } else if (isFunctionLoop(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            formatter.keyword('for').append(Formatting.oneSpace());
            formatter.keyword('in').surround(Formatting.oneSpace());
            formatter.keyword(':').surround(Formatting.noSpace());
        } else if (isFunctionReturn(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.keyword('return').append(Formatting.oneSpace());
        } else if (isIInstance(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesOpen.prepend(Formatting.oneSpace());
            bracesClose.prepend(Formatting.newLine());
            formatter.property('name').prepend(Formatting.oneSpace());
        } else if (isInstanceLoop(node)) {
            const formatter = this.getNodeFormatter(node);
            const bracesOpen = formatter.keyword('{');
            const bracesClose = formatter.keyword('}');
            formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
            bracesClose.prepend(Formatting.newLine());
            formatter.property('var').surround(Formatting.oneSpace());
            formatter.property('ref').surround(Formatting.noSpace());
            formatter.property('ivar').surround(Formatting.oneSpace());
        } else if (isBinaryExpression(node)) {
            const formatter = this.getNodeFormatter(node);
            formatter.property('operator').surround(Formatting.oneSpace());
        }
    }

}