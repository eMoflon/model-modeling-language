grammar GraphManipulationLanguage
import "./common"

entry GraphManipulationDocument:
    (statements+=GMStatement)*;

TargetNode:
    nodeId=NUM | tempNodeVar=[UntypedVariable:ID];

GMStatement:
    ReferencedModelStatement | SetAttributeStatement;

ReferencedModelStatement:
    'model' path=STRING ';';

SetAttributeStatement:
    'set' target=TargetNode ':' attr=[Attribute:QNAME] ('=' val=(ValueExpr | EnumValueExpr))? ';';