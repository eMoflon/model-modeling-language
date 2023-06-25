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

Multiplicity:
    ('[' (mult=NUM | mult=MULTIPLICITYSYMBOL) ('..' (upperMult=NUM | upperMult=MULTIPLICITYSYMBOL))? ']')?;

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

Attribute:
    'attribute' type=DataType name=ID ('=' defaultValue=ValueExpr)? ('{'modifiers=AttributeModifiers'}')?';';

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
    (opposite=OppositeAnnotation)? 'reference' (type=[Class:QNAME] | type=[Class:ID]) multiplicity=Multiplicity name=ID ('{' modifiers=ReferenceModifiers '}')?';';

Enum:
    'enum' name=ID '{' entries+=EnumEntry (',' entries+=EnumEntry)* '}';

EnumEntry:
    name=ID ('=' value=ValueExpr)?;

fragment InstanceParameters:
    '(' (parameter+=InstanceVariable (',' parameter+=InstanceVariable)*)? ')';

fragment MacroParameters:
    '[' (parameter+=InstanceVariable (',' parameter+=InstanceVariable)*)? ']';

fragment InstanceType:
    ((type=[Class:QNAME] | type=[Class:ID]) | dtype=DataType);

InstanceVariable:
    InstanceType name=ID;

IMacro:
    'macro' name=ID MacroParameters '{' (instances+=MacroInstance)* '}';

MacroInstance:
    (nInst=InstanceVariable | iVar=[InstanceVariable:ID]) '{' (statements+=MacroStatement)* '}';

MacroStatement:
    MacroAttributeStatement | MacroAssignStatement;

MacroAttributeStatement:
    attr=[Attribute:ID] '=' value=ValueExpr;

MacroAssignStatement:
    cref=[CReference:ID] '->' instance=[InstanceVariable:ID];

IFunction:
    'function' name=ID InstanceParameters ('returns' InstanceType)? '{' (statements+=FunctionStatement)+ (statements+=FunctionReturn)? '}';

FunctionStatement:
    FunctionCall | FunctionMacroCall | FunctionAssignment | FunctionLoop;

FunctionCall:
    func=[IFunction:ID] '(' (args+=[InstanceVariable:ID] (',' args+=[InstanceVariable:ID])*)? ')';

FunctionMacroCall:
    macro=[IMacro:ID] '[' (args+=[InstanceVariable:ID] (',' args+=[InstanceVariable:ID])*)? ']';

FunctionAssignment:
    InstanceVariable '=' (FunctionCall | FunctionMacroCall);

FunctionReturn:
    'return' var=[InstanceVariable:ID];

FunctionLoop:
    'for' var=InstanceVariable 'in' lower=NUM ':' upper=NUM '{' (statements+=FunctionStatement)+ '}';

IInstance:
    'instance' name=ID '{' (statements+=(InstanceStatement | InstanceLoop))* '}';

InstanceStatement:
    FunctionCall | FunctionMacroCall | FunctionAssignment;

InstanceLoop:
    'for' var=[InstanceVariable:ID] '-' ref=[CReference:ID] '->' ivar=InstanceVariable '{' (statements+=InstanceStatement)+ '}';

hidden terminal WS: /\s+/;
terminal MULTIPLICITYSYMBOL: /[\*?+]/;
terminal DOUBLE returns number: NUM '.' NUM;
terminal NUM returns number: /[0-9]+/;
terminal STRING returns string: /"[^"]*"/;
terminal FQNAME returns string: QNAME '::' ID;
terminal QNAME returns string: ID ('.' ID)+;
terminal ID returns string: /[a-zA-Z_][\w_]*/;


hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /[^:]\/\/[^\n\r]*/;
