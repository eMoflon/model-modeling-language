DataType returns string:
    'int' | 'string' | 'bool' | 'double' | 'float';

ValueExpr: NumberExpr | StringExpr | BoolExpr;
NumberExpr: value=(NUM | DOUBLE);
StringExpr: value=STRING;
BoolExpr: value?='true' | 'false';

MultiplicitySpec:
    num=NUM | n_0?='*' | n?='+';

Multiplicity:
    '[' mult=MultiplicitySpec ('..' upperMult=MultiplicitySpec)? ']';

Package:
    'package' name=ID '{' (subPackages+=Package | body+=AbstractElement)* '}';

AbstractElement:
    Class | Interface | Enum;

fragment ClassModifier:
    (abstract?='abstract')?;

fragment ClassBody:
    '{'
        (body+=Statement)*
    '}';

fragment ClassExtension:
    ('extends' (extendedClasses+=[Class:ID] | extendedClasses+=[Class:QNAME]) (',' (extendedClasses+=[Class:ID] | extendedClasses+=[Class:QNAME]))*)?;

fragment InterfaceExtension:
    ('extends' (extendedInterfaces+=[Interface:ID] | extendedInterfaces+=[Interface:QNAME]) (',' (extendedInterfaces+=[Interface:ID] | extendedInterfaces+=[Interface:QNAME]))*)?;

fragment ClassImplements:
    ('implements' (implementedInterfaces+=[Interface:ID] | implementedInterfaces+=[Interface:QNAME]) (',' (implementedInterfaces+=[Interface:ID] | implementedInterfaces+=[Interface:QNAME]))*)?;

Class:
    ClassModifier 'class' name=ID ClassExtension ClassImplements ClassBody;

Interface:
    ClassModifier 'interface' name=ID InterfaceExtension ClassBody;

Statement:
    Attribute | CReference;

AttributeModifiers:
    readonly?='readonly' &
    not_readonly?='!readonly' &
    volatile?='volatile' &
    not_volatile?='!volatile' &
    transient?='transient' &
    not_transient?='!transient' &
    unsettable?='unsettable' &
    not_unsettable?='!unsettable' &
    derived?='derived' &
    not_derived?='!derived' &
    unique?='unique' &
    not_unique?='!unique' &
    ordered?='ordered' &
    not_ordered?='!ordered' &
    id?='id' &
    not_id?='!id';

AttributeType:
    ptype=DataType | etype=[Enum:QNAME];

Attribute:
    'attribute' type=AttributeType name=ID ('=' defaultValue=ArithExpr)? ('{'modifiers=AttributeModifiers'}')?';';

ReferenceModifiers:
    readonly?='readonly' &
    not_readonly?='!readonly' &
    volatile?='volatile' &
    not_volatile?='!volatile' &
    transient?='transient' &
    not_transient?='!transient' &
    unsettable?='unsettable' &
    not_unsettable?='!unsettable' &
    derived?='derived' &
    not_derived?='!derived' &
    unique?='unique' &
    not_unique?='!unique' &
    ordered?='ordered' &
    not_ordered?='!ordered' &
    resolve?='resolve' &
    not_resolve?='!resolve' &
    containment?='containment' &
    not_containment?='!containment';

OppositeAnnotation:
    '@opposite' reference=[CReference:FQNAME];

CReference:
    (opposite=OppositeAnnotation)? 'reference' (type=[Class:QNAME] | type=[Class:ID]) (multiplicity=Multiplicity)? name=ID ('{' modifiers=ReferenceModifiers '}')?';';

Enum:
    'enum' name=ID '{' entries+=EnumEntry (',' entries+=EnumEntry)* '}';

EnumEntry:
    name=ID ('=' value=ValueExpr)?;

ArithExpr:
    Addition;

Addition infers ArithExpr:
    Multiplication ({infer BinaryExpression.left=current} operator=('+' | '-') right=Multiplication)*;

Multiplication infers ArithExpr:
    Exponentiation ({infer BinaryExpression.left=current} operator=('*' | '/') right=Exponentiation)*;

Exponentiation infers ArithExpr:
    Modulo ({infer BinaryExpression.left=current} operator='^' right=Modulo)*;

Modulo infers ArithExpr:
    PrimaryArithExpr ({infer BinaryExpression.left=current} operator='%' right=PrimaryArithExpr)*;

EnumValueExpr:
    val=[EnumEntry:FQNAME];

FunctionVariableSelectorExpr:
    val=[TypedVariable:QNAME];

VariableValueExpr:
    val=[Variable:ID];

PrimaryArithExpr infers ArithExpr:
    '(' ArithExpr ')' | ValueExpr | EnumValueExpr | VariableValueExpr | FunctionVariableSelectorExpr;

Variable:
    UntypedVariable | TypedVariable | FunctionVariable;

UntypedVariable:
    name=ID;

TypedVariable:
    typing=VariableType name=ID;

FunctionVariable:
    'tuple' name=ID;

VariableType:
    type=[AbstractElement:QNAME] | dtype=DataType;

hidden terminal WS: /\s+/;
terminal DOUBLE returns number: /-?\d+\.\d+/;
terminal NUM returns number: /-?\d+/;
terminal STRING returns string: /"[^"]*"/;
terminal FQNAME returns string: QNAME '::' ID;
terminal QNAME returns string: ID ('.' ID)+;
terminal ID returns string: /[a-zA-Z_][\w_]*/;


hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /[^:]\/\/[^\n\r]*/;