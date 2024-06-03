grammar ModelModelingLanguage
import "./common"

entry Model:
    (imports+=Import | packages+=Package | macros+=IMacro | functions+=IFunction | instances+=IInstance)*;

Import:
    'import' target=STRING ('using' aliases+=ImportAlias (',' aliases+=ImportAlias)*)? ';';

ImportAlias:
    (ref=[Package:ID] | ref=[Package:QNAME]) 'as' alias=ID;

fragment InstanceParameters:
    '(' (parameter+=TypedVariable (',' parameter+=TypedVariable)*)? ')';

fragment MacroParameters:
    '[' (parameter+=TypedVariable (',' parameter+=TypedVariable)*)? ']';

IMacro:
    'macro' name=ID MacroParameters '{' (instances+=MacroInstance)* '}';

MacroInstance:
    (nInst=TypedVariable | iVar=[TypedVariable:ID]) '{' (statements+=MacroStatement)* '}';

MacroStatement:
    MacroAttributeStatement | MacroAssignStatement;

MacroAttributeStatement:
    attr=[Attribute:ID] '=' value=Expression;

MacroAssignStatement:
    cref=[CReference:ID] '->' instance=[TypedVariable:ID];

IFunction:
    'function' name=ID InstanceParameters (returnsVar?='returns' typing=VariableType)? '{' (statements+=FunctionStatement)* (statements+=FunctionReturn)? '}';

FunctionStatement:
    FunctionCall | FunctionMacroCall | FunctionAssignment | FunctionLoop;

FunctionArgument:
    ref=[Variable:ID] | value=Expression;

FunctionCall:
    func=[IFunction:ID] '(' (args+=FunctionArgument (',' args+=FunctionArgument)*)? ')';

FunctionMacroCall:
    macro=[IMacro:ID] '[' (args+=FunctionArgument (',' args+=FunctionArgument)*)? ']';

FunctionAssignment:
    var=(TypedVariable | FunctionVariable) '=' call=(FunctionCall | FunctionMacroCall) ('.' select=[TypedVariable:ID])?;

ImplicitlyTypedValue:
    val=Expression;

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