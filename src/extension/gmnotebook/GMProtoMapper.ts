import {
    CreateEdgeStatement,
    CreateNodeStatement,
    DeleteEdgeStatement,
    DeleteNodeStatement,
    GMStatement,
    isCreateEdgeStatement,
    isCreateNodeStatement,
    isDeleteEdgeStatement,
    isDeleteNodeStatement,
    isGMChainStatement,
    isSetAttributeStatement,
    isValueExpr,
    SetAttributeStatement
} from "../../language/generated/ast.js";
import {
    EditChainRequest,
    EditCreateEdgeRequest,
    EditCreateEdgeResponse,
    EditCreateNodeAttributeAssignment,
    EditCreateNodeRequest,
    EditCreateNodeResponse,
    EditDeleteEdgeRequest,
    EditDeleteEdgeResponse,
    EditDeleteNodeRequest,
    EditDeleteNodeResponse,
    EditRequest,
    EditResponse,
    EditSetAttributeRequest,
    EditSetAttributeResponse,
    EditState,
    Node
} from "../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";
import {ExprUtils} from "../../language/expr-utils.js";
import {GMInterpreter, RunnerContext} from "./GMInterpreter.js";
import {PostEditResponse} from "../generated/de/nexus/modelserver/ModelServerEdits_pb.js";

export class GMProtoMapper {

    public static mapEditRequest(element: GMStatement): EditRequest | EditChainRequest {
        if (isSetAttributeStatement(element)) {
            return GMProtoMapper.mapSetAttributeRequest(element);
        } else if (isCreateEdgeStatement(element)) {
            return GMProtoMapper.mapCreateEdgeRequest(element);
        } else if (isDeleteEdgeStatement(element)) {
            return GMProtoMapper.mapDeleteEdgeRequest(element);
        } else if (isDeleteNodeStatement(element)) {
            return GMProtoMapper.mapDeleteNodeRequest(element);
        } else if (isCreateNodeStatement(element)) {
            return GMProtoMapper.mapCreateNodeRequest(element);
        } else if (isGMChainStatement(element)) {
            const req: EditChainRequest = new EditChainRequest();
            req.edits = element.chain.map(x => GMProtoMapper.mapEditRequest(x) as EditRequest)
            return req;
        } else {
            throw new Error(`GMProtoMapper currently does not support the element: ${JSON.stringify(element)}`);
        }
    }

    public static mapSetAttributeRequest(stmt: SetAttributeStatement): EditRequest {
        const targetNode: Node | undefined = GMInterpreter.getMappedNode(stmt.target);
        if (targetNode == undefined) {
            throw new Error("Unable to determine target node!");
        }

        const editSetAttrReq: EditSetAttributeRequest = new EditSetAttributeRequest();
        editSetAttrReq.node = targetNode;
        editSetAttrReq.attributeName = stmt.attr.name;
        if (ExprUtils.isEnumValueExpression(stmt.val) && stmt.val.val.ref != undefined) {
            editSetAttrReq.attributeValue = stmt.val.val.ref.name;
        } else if (isValueExpr(stmt.val)) {
            editSetAttrReq.attributeValue = `${stmt.val.value}`;
        } else {
            throw new Error(`Unable to assign attribute value: ${stmt.attr.name}`);
        }

        return new EditRequest(
            {
                request: {
                    case: "setAttributeRequest",
                    value: editSetAttrReq
                }
            }
        )
    }

    public static mapCreateNodeRequest(stmt: CreateNodeStatement): EditRequest {
        const createNodeReq: EditCreateNodeRequest = new EditCreateNodeRequest();
        createNodeReq.tempId = stmt.nodeVar.name;
        createNodeReq.nodeType = stmt.nodeType;
        createNodeReq.assignments = stmt.assignments.map(x => {
            const attrAssignment: EditCreateNodeAttributeAssignment = new EditCreateNodeAttributeAssignment();
            attrAssignment.attributeName = x.attr.name;
            attrAssignment.attributeValue = `${x.val.value}`;
            return attrAssignment;
        }).map(x => x as EditCreateNodeAttributeAssignment);

        return new EditRequest(
            {
                request: {
                    case: "createNodeRequest",
                    value: createNodeReq
                }
            }
        );
    }

    public static mapDeleteNodeRequest(stmt: DeleteNodeStatement): EditRequest {
        const targetNode: Node | undefined = GMInterpreter.getMappedNode(stmt.node);
        if (targetNode == undefined) {
            throw new Error("Unable to determine node!");
        }

        const deleteNodeReq: EditDeleteNodeRequest = new EditDeleteNodeRequest();
        deleteNodeReq.node = targetNode;

        return new EditRequest(
            {
                request: {
                    case: "deleteNodeRequest",
                    value: deleteNodeReq
                }
            }
        );
    }

    public static mapCreateEdgeRequest(stmt: CreateEdgeStatement): EditRequest {
        const fromNode: Node | undefined = GMInterpreter.getMappedNode(stmt.fromNode);
        if (fromNode == undefined) {
            throw new Error("Unable to determine target node!");
        }
        const toNode: Node | undefined = GMInterpreter.getMappedNode(stmt.toNode);
        if (toNode == undefined) {
            throw new Error("Unable to determine target node!");
        }

        const createEdgeReq: EditCreateEdgeRequest = new EditCreateEdgeRequest();
        createEdgeReq.startNode = fromNode;
        createEdgeReq.targetNode = toNode;
        createEdgeReq.referenceName = stmt.reference.name;

        return new EditRequest(
            {
                request: {
                    case: "createEdgeRequest",
                    value: createEdgeReq
                }
            }
        );
    }

    public static mapDeleteEdgeRequest(stmt: DeleteEdgeStatement): EditRequest {
        const fromNode: Node | undefined = GMInterpreter.getMappedNode(stmt.fromNode);
        if (fromNode == undefined) {
            throw new Error("Unable to determine start node!");
        }
        const toNode: Node | undefined = GMInterpreter.getMappedNode(stmt.toNode);
        if (toNode == undefined) {
            throw new Error("Unable to determine target node!");
        }

        const deleteEdgeReq: EditDeleteEdgeRequest = new EditDeleteEdgeRequest();
        deleteEdgeReq.startNode = fromNode;
        deleteEdgeReq.targetNode = toNode;
        deleteEdgeReq.referenceName = stmt.reference.name;

        return new EditRequest(
            {
                request: {
                    case: "deleteEdgeRequest",
                    value: deleteEdgeReq
                }
            }
        );
    }

    public static processResponse(response: PostEditResponse, context: RunnerContext) {
        if (response.response.case == "edit") {
            GMProtoMapper._processResponse(response.response.value, context);
        } else if (response.response.case == "editChain") {
            response.response.value.edits.forEach(edit => GMProtoMapper._processResponse(edit, context))
        }
    }

    private static _processResponse(response: EditResponse, context: RunnerContext) {
        if (response.response.case == "setAttributeResponse") {
            const editResponse: EditSetAttributeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log("Cool, success!");
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`ERROR: ${editResponse.message}`)
            } else {
                context.log("UNKNOWN ERROR!");
            }
        } else if (response.response.case == "createEdgeResponse") {
            const editResponse: EditCreateEdgeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log("Cool, success!");
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`ERROR: ${editResponse.message}`)
            } else {
                context.log("UNKNOWN ERROR!");
            }
        } else if (response.response.case == "createNodeResponse") {
            const editResponse: EditCreateNodeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log("Cool, success!");
                context.log(`Created new node with id: ${editResponse.createdNodeId}`);
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`ERROR: ${editResponse.message}`)
            } else {
                context.log("UNKNOWN ERROR!");
            }
        } else if (response.response.case == "deleteEdgeResponse") {
            const editResponse: EditDeleteEdgeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log("Cool, success!");
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`ERROR: ${editResponse.message}`)
            } else {
                context.log("UNKNOWN ERROR!");
            }
        } else if (response.response.case == "deleteNodeResponse") {
            const editResponse: EditDeleteNodeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log("Cool, success!");
                for (const removedEdge of editResponse.removedEdges) {
                    context.log(`[ImplicitlyRemovedEdge] (${removedEdge.fromNode?.nodeType.value ?? "UNKNOWN"})-${removedEdge.reference}->(${removedEdge.toNode?.nodeType.value ?? "UNKNOWN"})`);
                }
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`ERROR: ${editResponse.message}`)
            } else {
                context.log("UNKNOWN ERROR!");
            }
        }
    }
}