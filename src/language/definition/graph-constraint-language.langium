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
    '#' (alias=ID ':')? expr=Expression;

Constraint:
    (annotations+=Annotation)*
    'constraint' name=ID '{' (patternDeclarations+=ConstraintPatternDeclaration | assertions+=ConstraintAssertion)* '}';

ConstraintPatternDeclaration:
    'specification' pattern=[Pattern:ID] var=UntypedVariable '{' (fixContainers+=FixContainer)* '}';

ConstraintAssertion:
    'assert' expr=Expression ';';

FixContainer:
    EnableFixContainer | DisableFixContainer;

EnableFixContainer:
    'enable' '{' (fixStatements+=FixStatement)* '}';

DisableFixContainer:
    'disable' '{' (fixStatements+=FixStatement)* '}';

FixStatement:
    FixInfoStatement | FixSetStatement | FixDeleteNodeStatement | FixDeleteEdgeStatement | FixCreateNodeStatement | FixCreateEdgeStatement;

FixInfoStatement:
    'info' msg=STRING ';';

FixSetStatement:
    'set' attr=[Attribute:QNAME] ('=' val=(ValueExpr | EnumValueExpr))? ';';

FixDeleteNodeStatement:
    'delete' 'node' node=[TypedVariable:ID] ';';

FixDeleteEdgeStatement:
    'delete' 'edge' edge=[PatternObjectReference:ID] ';';

CreateNodeAttributeAssignment:
    attr=[Attribute:ID] '=' val=(ValueExpr | EnumValueExpr);

FixCreateNodeStatement:
    'create' 'node' nodeVar=TypedVariable '(' (assignments+=CreateNodeAttributeAssignment (',' assignments+=CreateNodeAttributeAssignment)*)? ')' ';';

FixCreateEdgeStatement:
    'create' 'edge' fromNode=[TypedVariable:ID] '-'reference=[CReference:ID]'->' toNode=[TypedVariable:ID] ';';