import {convertString, CstNode, DefaultValueConverter, GrammarAST, ValueType} from 'langium';

export class GraphConstraintLanguageValueConverter extends DefaultValueConverter {

    protected override runConverter(rule: GrammarAST.AbstractRule, input: string, cstNode: CstNode): ValueType {
        if (rule.name.startsWith('TEMPLATE_LITERAL')) {
            // 'convertString' simply removes the first and last character of the input
            return convertString(input);
        } else {
            return super.runConverter(rule, input, cstNode);
        }
    }
}