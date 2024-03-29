grammar GraphManipulationLanguage
import "./common"

entry GraphManipulationDocument:
    (statements+=GMStatement)*;

TargetNode:
    nodeId=NUM | tempNodeVar=[UntypedVariable:ID];

GMStatement:
    SetAttributeStatement | CreateEdgeStatement | DeleteEdgeStatement | CreateNodeStatement | DeleteNodeStatement | GMChainStatement | ExportStatement;

GMChainStatement:
    'chain' '{' (chain+=GMStatement)* '}';

SetAttributeStatement:
    'set' target=TargetNode ':' attr=UntypedVariable '=' val=(ValueExpr | EnumValueExpr) ';';

CreateNodeStatementAttrAssignment:
    attr=UntypedVariable '=' val=ValueExpr;

CreateNodeStatement:
    'create' 'node' nodeType=QNAME nodeVar=UntypedVariable '(' (assignments+=CreateNodeStatementAttrAssignment (',' assignments+=CreateNodeStatementAttrAssignment)*)? ')' ';';

DeleteNodeStatement:
    'delete' 'node' node=TargetNode ';';

CreateEdgeStatement:
    'create' 'edge' fromNode=TargetNode '-'reference=UntypedVariable'->' toNode=TargetNode ';';

DeleteEdgeStatement:
    'delete' 'edge' fromNode=TargetNode '-'reference=UntypedVariable'->' toNode=TargetNode ';';

ExportStatement:
    'export' '(' keepIds=BoolExpr (',' 'dir' '=' exportPath=STRING)? (',' 'name' '=' exportName=STRING)? ')' ';';