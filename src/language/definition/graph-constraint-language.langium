grammar GraphConstraintLanguage
import "./common"

entry ConstraintDocument:
    (model=ReferencedModelStatement)?
    (patterns+=Pattern)*;

ReferencedModelStatement:
    'model' path=STRING ';';

Annotation:
    EnforceAnnotation | ForbidAnnotation;

CompactBindingStatement:
    otherVar=[TypedVariable:ID] '=' selfVar=[TypedVariable:ID];

fragment SupportPatternAnnotationBody:
    pattern=[Pattern:ID] (',' '[' binding+=CompactBindingStatement (',' binding+=CompactBindingStatement)* ']')?;

EnforceAnnotation:
    '@Enforce' '(' SupportPatternAnnotationBody ')';

ForbidAnnotation:
    '@Forbid' '(' SupportPatternAnnotationBody ')';

Pattern:
    (annotations+=Annotation)*
    'pattern' name=ID '{' (objs += PatternObject | constraints+=PatternAttributeConstraint)* '}';

PatternObject:
    (local?='local')? var=TypedVariable '{' (connections+=PatternObjectReference)* '}';

PatternObjectReference:
    ref=[CReference:ID] ('->' | '-' alias=ID '->') patternObj=[TypedVariable:ID];

PatternAttributeConstraint:
    '#' expr=Expression;