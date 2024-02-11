grammar GraphConstraintLanguage
import "./common"

entry ConstraintDocument:
    (model=ReferencedModelStatement)?
    (patterns+=Pattern)*
    (constraints+=Constraint)*;

ReferencedModelStatement:
    'model' path=STRING ';';

Annotation:
    EnforceAnnotation |
    ForbidAnnotation |
    DisableDefaultNodeConstraintsAnnotation |
    NodeConstraintAnnotation |
    TitleAnnotation |
    DescriptionAnnotation;

CompactBindingStatement:
    otherVar=[TypedVariable:ID] '=' selfVar=[TypedVariable:ID];

fragment SupportPatternAnnotationBody:
    pattern=[Pattern:ID] (',' '[' binding+=CompactBindingStatement (',' binding+=CompactBindingStatement)* ']')?;

EnforceAnnotation:
    '@Enforce' '(' SupportPatternAnnotationBody ')';

ForbidAnnotation:
    '@Forbid' '(' SupportPatternAnnotationBody ')';

DisableDefaultNodeConstraintsAnnotation:
    disableConstraints?='@DisableDefaultNodeConstraints';

NodeConstraintAnnotation:
    '@NodeConstraint' '(' node1=[TypedVariable:ID] operator=('==' | '!=') node2=[TypedVariable:ID] ')';

TitleAnnotation:
    '@title' '(' value=STRING ')';

DescriptionAnnotation:
    '@description' '(' value=STRING ')';

Pattern:
    (annotations+=Annotation)*
    'pattern' name=ID '{' (objs += PatternObject | constraints+=PatternAttributeConstraint)* '}';

PatternObject:
    (local?='local')? var=TypedVariable '{' (connections+=PatternObjectReference)* '}';

PatternObjectReference:
    ref=[CReference:ID] ('->' | '-' alias=ID '->') patternObj=[TypedVariable:ID];

PatternAttributeConstraint:
    '#' expr=Expression;

Constraint:
    (annotations+=Annotation)*
    'constraint' name=ID '{' (patternDeclarations+=ConstraintPatternDeclaration | justifications += ConstraintJustification | assertions+=ConstraintAssertion | statements+=JustificationStatement)* '}';

ConstraintPatternDeclaration:
    'specification' pattern=[Pattern:ID] var=UntypedVariable ';';

ConstraintAssertion:
    'assert' expr=Expression ';';

ConstraintJustification:
    'justify' condition=Expression '{' (cases+=JustificationCase | caseRequirements+=JustificationRequirement | statements+=JustificationStatement)*  '}';

JustificationRequirement:
    'require' condition=Expression ';';

JustificationCase:
    'case' var=UntypedVariable '{' (statements+=JustificationStatement)* '}';

JustificationStatement:
    JustificationInfoStatement;

JustificationInfoStatement:
    'info' msg=STRING ';';