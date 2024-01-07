grammar GraphConstraintLanguage
import "./common"

entry ConstraintDocument:
    (patterns+=Pattern)*;

Annotation:
    EnforceAnnotation | ForbidAnnotation;

CompactBindingStatement:
    selfVar=[TypedVariable:ID] '=' otherVar=[TypedVariable:ID];

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
    var=TypedVariable '{' (connections+=PatternObjectReference)* '}';

PatternObjectReference:
    ref=[CReference:ID] ('->' | '-' alias=ID '->') patternObj=[TypedVariable:ID];

PatternAttributeConstraint:
    '#' tmp?='true';