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
import {PostEditRequest, PostEditResponse} from "../generated/de/nexus/modelserver/ModelServerEdits_pb.js";
import {ExportModelRequest, ExportModelResponse} from "../generated/de/nexus/modelserver/ModelServerManagement_pb.js";

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

    public static processExportResponse(request: ExportModelRequest, response: ExportModelResponse, context: RunnerContext) {
        if (response.success) {
            if (request.exportWithIds) {
                context.log(`[SUCCESS] Exported model with ids to: ${response.exportedPath}`);
            } else {
                context.log(`[SUCCESS] Exported model without ids to: ${response.exportedPath}`);
            }
        } else {
            if (response.message.length == 0) {
                context.log(`[FAILED] An unknown error has occurred while trying to save the model.`);
            } else {
                context.log(`[FAILED] ${response.message}`);
            }
        }
    }

    public static processResponse(request: PostEditRequest, response: PostEditResponse, context: RunnerContext) {
        if (request.request.case == "edit" && response.response.case == "edit") {
            GMProtoMapper._processResponse(request.request.value, response.response.value, context);
        } else if (request.request.case == "editChain" && response.response.case == "editChain") {
            const editRequests: EditRequest[] = request.request.value.edits;
            const editResponses: EditResponse[] = response.response.value.edits;
            if (editRequests.length != editResponses.length) {
                throw new Error("EditChain request and response length does not match!");
            }

            for (let i = 0; i < editRequests.length; i++) {
                const editReq: EditRequest = editRequests.at(i) as EditRequest;
                const editRes: EditResponse = editResponses.at(i) as EditResponse;

                GMProtoMapper._processResponse(editReq, editRes, context);
            }
        } else {
            throw new Error("Invalid combination of PostEditRequest and PostEditResponse type!");
        }
    }

    private static _processResponse(request: EditRequest, response: EditResponse, context: RunnerContext) {
        if (request.request.case == "setAttributeRequest" && response.response.case == "setAttributeResponse") {
            const editRequest: EditSetAttributeRequest = request.request.value;
            const editResponse: EditSetAttributeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log(`[SUCCESS] Updated Node ${editRequest.node?.nodeType.value}["${editRequest.attributeName}"] -> ${editRequest.attributeValue}`);
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        } else if (request.request.case == "createEdgeRequest" && response.response.case == "createEdgeResponse") {
            const editRequest: EditCreateEdgeRequest = request.request.value;
            const editResponse: EditCreateEdgeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log(`[SUCCESS] Created ${editRequest.startNode?.nodeType.value} -${editRequest.referenceName}-> ${editRequest.targetNode?.nodeType.value}`);
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        } else if (request.request.case == "createNodeRequest" && response.response.case == "createNodeResponse") {
            const editRequest: EditCreateNodeRequest = request.request.value;
            const editResponse: EditCreateNodeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log(`[SUCCESS] Created new ${editRequest.nodeType}(${editRequest.assignments.map(x => `${x.attributeName} = ${x.attributeValue}`).join(", ")}) -> NEW ID: ${editResponse.createdNodeId}`);
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        } else if (request.request.case == "deleteEdgeRequest" && response.response.case == "deleteEdgeResponse") {
            const editRequest: EditDeleteEdgeRequest = request.request.value;
            const editResponse: EditDeleteEdgeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log(`[SUCCESS] Deleted ${editRequest.startNode?.nodeType.value} -${editRequest.referenceName}-> ${editRequest.targetNode?.nodeType.value}`);
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        } else if (request.request.case == "deleteNodeRequest" && response.response.case == "deleteNodeResponse") {
            const editRequest: EditDeleteNodeRequest = request.request.value;
            const editResponse: EditDeleteNodeResponse = response.response.value;
            if (editResponse.state == EditState.SUCCESS) {
                context.log(`[SUCCESS] Deleted Node (${editRequest.node?.nodeType.value})`);
                for (const removedEdge of editResponse.removedEdges) {
                    context.log(`[ImplicitlyRemovedEdge] (${removedEdge.fromNode?.nodeType.value ?? "UNKNOWN"})-${removedEdge.reference}->(${removedEdge.toNode?.nodeType.value ?? "UNKNOWN"})`);
                }
            } else if (editResponse.state == EditState.FAILURE) {
                context.log(`[FAILED] ${editResponse.message}`);
            } else {
                throw new Error("UNKNOWN ERROR!");
            }
        }
    }
}