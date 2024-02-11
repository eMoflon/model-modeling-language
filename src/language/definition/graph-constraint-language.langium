grammar GraphConstraintLanguage
import "./common"

entry ConstraintDocument:
    (model=ReferencedModelStatement)?
    (patterns+=Pattern)*;

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