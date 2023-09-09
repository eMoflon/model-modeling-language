grammar ModelModelingLanguage

entry Model:
    (imports+=Import | packages+=Package | macros+=IMacro | functions+=IFunction | instances+=IInstance)*;

DataType returns string:
    'int' | 'string' | 'bool' | 'double' | 'float';

ValueExpr: NumberExpr | StringExpr | BoolExpr;
NumberExpr: value=(NUM | DOUBLE);
StringExpr: value=STRING;
BoolExpr: value?='true' | 'false';

Import:
    'import' target=STRING ('using' aliases+=ImportAlias (',' aliases+=ImportAlias)*)? ';';

ImportAlias:
    (ref=[Package:ID] | ref=[Package:QNAME]) 'as' alias=ID;

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
    volatile?='volatile' &
    transient?='transient' &
    unsettable?='unsettable' &
    derived?='derived' &
    unique?='unique' &
    ordered?='ordered' &
    id?='id';

AttributeType:
    ptype=DataType | etype=[Enum:QNAME];

Attribute:
    'attribute' type=AttributeType name=ID ('=' defaultValue=ArithExpr)? ('{'modifiers=AttributeModifiers'}')?';';

ReferenceModifiers:
    readonly?='readonly' &
    volatile?='volatile' &
    transient?='transient' &
    unsettable?='unsettable' &
    derived?='derived' &
    unique?='unique' &
    ordered?='ordered' &
    resolve?='resolve';

OppositeAnnotation:
    '@opposite' reference=[CReference:FQNAME];

CReference:
    (opposite=OppositeAnnotation)? 'reference' (type=[Class:QNAME] | type=[Class:ID]) (multiplicity=Multiplicity)? name=ID ('{' modifiers=ReferenceModifiers '}')?';';

Enum:
    'enum' name=ID '{' entries+=EnumEntry (',' entries+=EnumEntry)* '}';

EnumEntry:
    name=ID ('=' value=ValueExpr)?;

fragment InstanceParameters:
    '(' (parameter+=TypedVariable (',' parameter+=TypedVariable)*)? ')';

fragment MacroParameters:
    '[' (parameter+=TypedVariable (',' parameter+=TypedVariable)*)? ']';

VariableType:
    type=[AbstractElement:QNAME] | dtype=DataType;

Variable:
    UntypedVariable | TypedVariable | FunctionVariable;
    
UntypedVariable:
    name=ID;

TypedVariable:
    typing=VariableType name=ID;

FunctionVariable:
    'tuple' name=ID;

IMacro:
    'macro' name=ID MacroParameters '{' (instances+=MacroInstance)* '}';

MacroInstance:
    (nInst=TypedVariable | iVar=[TypedVariable:ID]) '{' (statements+=MacroStatement)* '}';

MacroStatement:
    MacroAttributeStatement | MacroAssignStatement;

MacroAttributeStatement:
    attr=[Attribute:ID] '=' value=ArithExpr;

MacroAssignStatement:
    cref=[CReference:ID] '->' instance=[TypedVariable:ID];

IFunction:
    'function' name=ID InstanceParameters (returnsVar?='returns' typing=VariableType)? '{' (statements+=FunctionStatement)* (statements+=FunctionReturn)? '}';

FunctionStatement:
    FunctionCall | FunctionMacroCall | FunctionAssignment | FunctionLoop;

FunctionArgument:
    ref=[Variable:ID] | value=ArithExpr;

FunctionCall:
    func=[IFunction:ID] '(' (args+=FunctionArgument (',' args+=FunctionArgument)*)? ')';

FunctionMacroCall:
    macro=[IMacro:ID] '[' (args+=FunctionArgument (',' args+=FunctionArgument)*)? ']';

FunctionAssignment:
    var=(TypedVariable | FunctionVariable) '=' call=(FunctionCall | FunctionMacroCall) ('.' select=[TypedVariable:ID])?;

ImplicitlyTypedValue:
    val=ArithExpr;

FunctionReturn:
    'return' (var=[TypedVariable:ID]|val=ImplicitlyTypedValue);

FunctionLoop:
    'for' var=UntypedVariable 'in' lower=NUM ':' upper=NUM '{' (statements+=FunctionStatement)+ '}';

IInstance:
    'instance' name=ID '{' (statements+=(InstanceStatement | InstanceLoop))* '}';

InstanceStatement:
    FunctionCall | FunctionMacroCall | FunctionAssignment;

InstanceLoop:
    'for' var=[TypedVariable:ID] '-' ref=[CReference:ID] '->' ivar=UntypedVariable '{' (statements+=InstanceStatement)+ '}';

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


hidden terminal WS: /\s+/;
terminal DOUBLE returns number: /-?\d+\.\d+/;
terminal NUM returns number: /-?\d+/;
terminal STRING returns string: /"[^"]*"/;
terminal FQNAME returns string: QNAME '::' ID;
terminal QNAME returns string: ID ('.' ID)+;
terminal ID returns string: /[a-zA-Z_][\w_]*/;


hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /[^:]\/\/[^\n\r]*/;
