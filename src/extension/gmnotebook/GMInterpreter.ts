import {EmptyFileSystem, interruptAndCheck, LangiumDocument, MaybePromise, URI} from "langium";
import {
    GMStatement,
    GraphManipulationDocument,
    isCreateEdgeStatement,
    isCreateNodeStatement,
    isDeleteEdgeStatement,
    isDeleteNodeStatement,
    isReferencedModelStatement,
    isSetAttributeStatement,
    isValueExpr,
    TargetNode
} from "../../language/generated/ast.js";
import {v4} from "uuid";
import {GraphManipulationLanguageServices} from "../../language/graph-manipulation-language-module.js";
import {CancellationToken, CancellationTokenSource} from "vscode-languageserver";
import {ModelServerConnector} from "../model-server-connector.js";
import {createMmlAndGclServices} from "../../language/main-module.js";
import {PostEditRequest} from "../generated/de/nexus/modelserver/ModelServerEdits_pb.js";
import {
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
    EditSetAttributeRequest,
    EditSetAttributeResponse,
    EditState,
    Node
} from "../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";
import {ExprUtils} from "../../language/expr-utils.js";


export class GMInterpreter {
    private _services: GraphManipulationLanguageServices;
    private _modelServerConnector: ModelServerConnector;
    // after 5 seconds, the interpreter will be interrupted and call onTimeout
    private static readonly TIMEOUT_MS = 1000 * 5;


    constructor(modelServerConnector: ModelServerConnector) {
        this._services = createMmlAndGclServices(EmptyFileSystem).gmlServices;
        this._modelServerConnector = modelServerConnector;
    }

    async runInterpreter(program: string, context: InterpreterContext): Promise<void> {
        const buildResult = await this.buildDocument(program);
        try {
            const gmProgram = buildResult.document.parseResult.value as GraphManipulationDocument;
            await this.runProgram(gmProgram, context);
        } finally {
            await buildResult.dispose();
        }
    }

    async runProgram(program: GraphManipulationDocument, outerContext: InterpreterContext): Promise<void> {
        const cancellationTokenSource = new CancellationTokenSource();
        const cancellationToken = cancellationTokenSource.token;

        const timeout = setTimeout(async () => {
            cancellationTokenSource.cancel();
        }, GMInterpreter.TIMEOUT_MS);

        const context: RunnerContext = {
            cancellationToken,
            timeout,
            log: outerContext.log,
            onStart: outerContext.onStart,
        };

        let end = false;

        if (context.onStart) {
            context.onStart();
        }

        for (const statement of program.statements) {
            await interruptAndCheck(context.cancellationToken);

            if (isReferencedModelStatement(statement)) {
                continue;
            } else {
                await this.runStatement(statement, context, () => {
                    end = true
                });
            }
            if (end) {
                break;
            }
        }
    }

    async runStatement(element: GMStatement, context: RunnerContext, returnFn: ReturnFunction): Promise<void> {
        await interruptAndCheck(context.cancellationToken);

        if (isSetAttributeStatement(element)) {
            const targetNode: Node | undefined = GMInterpreter.getMappedNode(element.target);
            if (targetNode == undefined) {
                return Promise.reject("Unable to determine target node!");
            }

            const editSetAttrReq: EditSetAttributeRequest = new EditSetAttributeRequest();
            editSetAttrReq.node = targetNode;
            editSetAttrReq.attributeName = element.attr.name;
            if (ExprUtils.isEnumValueExpression(element.val) && element.val.val.ref != undefined) {
                editSetAttrReq.attributeValue = element.val.val.ref.name;
            } else if (isValueExpr(element.val)) {
                editSetAttrReq.attributeValue = `${element.val.value}`;
            } else {
                return Promise.reject(`Unable to assign attribute value: ${element.attr.name}`);
            }

            return this._modelServerConnector.clients.editClient.requestEdit(
                new PostEditRequest(
                    {
                        request: {
                            case: "edit",
                            value: new EditRequest(
                                {
                                    request: {
                                        case: "setAttributeRequest",
                                        value: editSetAttrReq
                                    }
                                }
                            )
                        }
                    }
                )
            ).then(response => {
                    if (response.response.case == "edit") {
                        if (response.response.value.response.case == "setAttributeResponse") {
                            const editResponse: EditSetAttributeResponse = response.response.value.response.value;
                            if (editResponse.state == EditState.SUCCESS) {
                                context.log("Cool, success!");
                            } else if (editResponse.state == EditState.FAILURE) {
                                context.log(`ERROR: ${editResponse.message}`)
                            } else {
                                context.log("UNKNOWN ERROR!");
                            }
                        }

                    }
                }
            )
        } else if (isCreateEdgeStatement(element)) {
            const fromNode: Node | undefined = GMInterpreter.getMappedNode(element.fromNode);
            if (fromNode == undefined) {
                return Promise.reject("Unable to determine target node!");
            }
            const toNode: Node | undefined = GMInterpreter.getMappedNode(element.toNode);
            if (toNode == undefined) {
                return Promise.reject("Unable to determine target node!");
            }

            const createEdgeReq: EditCreateEdgeRequest = new EditCreateEdgeRequest();
            createEdgeReq.startNode = fromNode;
            createEdgeReq.targetNode = toNode;
            createEdgeReq.referenceName = element.reference.name;

            return this._modelServerConnector.clients.editClient.requestEdit(
                new PostEditRequest(
                    {
                        request: {
                            case: "edit",
                            value: new EditRequest(
                                {
                                    request: {
                                        case: "createEdgeRequest",
                                        value: createEdgeReq
                                    }
                                }
                            )
                        }
                    }
                )
            ).then(response => {
                    if (response.response.case == "edit") {
                        if (response.response.value.response.case == "createEdgeResponse") {
                            const editResponse: EditCreateEdgeResponse = response.response.value.response.value;
                            if (editResponse.state == EditState.SUCCESS) {
                                context.log("Cool, success!");
                            } else if (editResponse.state == EditState.FAILURE) {
                                context.log(`ERROR: ${editResponse.message}`)
                            } else {
                                context.log("UNKNOWN ERROR!");
                            }
                        }

                    }
                }
            )
        } else if (isDeleteEdgeStatement(element)) {
            const fromNode: Node | undefined = GMInterpreter.getMappedNode(element.fromNode);
            if (fromNode == undefined) {
                return Promise.reject("Unable to determine start node!");
            }
            const toNode: Node | undefined = GMInterpreter.getMappedNode(element.toNode);
            if (toNode == undefined) {
                return Promise.reject("Unable to determine target node!");
            }

            const deleteEdgeReq: EditDeleteEdgeRequest = new EditDeleteEdgeRequest();
            deleteEdgeReq.startNode = fromNode;
            deleteEdgeReq.targetNode = toNode;
            deleteEdgeReq.referenceName = element.reference.name;

            return this._modelServerConnector.clients.editClient.requestEdit(
                new PostEditRequest(
                    {
                        request: {
                            case: "edit",
                            value: new EditRequest(
                                {
                                    request: {
                                        case: "deleteEdgeRequest",
                                        value: deleteEdgeReq
                                    }
                                }
                            )
                        }
                    }
                )
            ).then(response => {
                    if (response.response.case == "edit") {
                        if (response.response.value.response.case == "deleteEdgeResponse") {
                            const editResponse: EditDeleteEdgeResponse = response.response.value.response.value;
                            if (editResponse.state == EditState.SUCCESS) {
                                context.log("Cool, success!");
                            } else if (editResponse.state == EditState.FAILURE) {
                                context.log(`ERROR: ${editResponse.message}`)
                            } else {
                                context.log("UNKNOWN ERROR!");
                            }
                        }

                    }
                }
            )
        } else if (isDeleteNodeStatement(element)) {
            const targetNode: Node | undefined = GMInterpreter.getMappedNode(element.node);
            if (targetNode == undefined) {
                return Promise.reject("Unable to determine node!");
            }

            const deleteNodeReq: EditDeleteNodeRequest = new EditDeleteNodeRequest();
            deleteNodeReq.node = targetNode;

            return this._modelServerConnector.clients.editClient.requestEdit(
                new PostEditRequest(
                    {
                        request: {
                            case: "edit",
                            value: new EditRequest(
                                {
                                    request: {
                                        case: "deleteNodeRequest",
                                        value: deleteNodeReq
                                    }
                                }
                            )
                        }
                    }
                )
            ).then(response => {
                    if (response.response.case == "edit") {
                        if (response.response.value.response.case == "deleteNodeResponse") {
                            const editResponse: EditDeleteNodeResponse = response.response.value.response.value;
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
            )
        } else if (isCreateNodeStatement(element)) {
            const createNodeReq: EditCreateNodeRequest = new EditCreateNodeRequest();
            createNodeReq.tempId = element.nodeVar.name;
            createNodeReq.nodeType = element.nodeType;
            createNodeReq.assignments = element.assignments.map(x => {
                const attrAssignment: EditCreateNodeAttributeAssignment = new EditCreateNodeAttributeAssignment();
                attrAssignment.attributeName = x.attr.name;
                attrAssignment.attributeValue = `${x.val.value}`;
                return attrAssignment;
            }).map(x => x as EditCreateNodeAttributeAssignment);

            return this._modelServerConnector.clients.editClient.requestEdit(
                new PostEditRequest(
                    {
                        request: {
                            case: "edit",
                            value: new EditRequest(
                                {
                                    request: {
                                        case: "createNodeRequest",
                                        value: createNodeReq
                                    }
                                }
                            )
                        }
                    }
                )
            ).then(response => {
                    if (response.response.case == "edit") {
                        if (response.response.value.response.case == "createNodeResponse") {
                            const editResponse: EditCreateNodeResponse = response.response.value.response.value;
                            if (editResponse.state == EditState.SUCCESS) {
                                context.log("Cool, success!");
                                context.log(`Created new node with id: ${editResponse.createdNodeId}`);
                            } else if (editResponse.state == EditState.FAILURE) {
                                context.log(`ERROR: ${editResponse.message}`)
                            } else {
                                context.log("UNKNOWN ERROR!");
                            }
                        }

                    }
                }
            )
        }
    }

    private async buildDocument(code: string): Promise<BuildResult> {
        const uuid = v4();
        const uri = URI.parse(`memory:///${uuid}.gm`);
        const document = this._services.shared.workspace.LangiumDocumentFactory.fromString(code, uri);
        this._services.shared.workspace.LangiumDocuments.addDocument(document);
        await this._services.shared.workspace.DocumentBuilder.build([document]);
        return {
            document,
            dispose: async () => {
                await this._services.shared.workspace.DocumentBuilder.update([], [uri]);
            }
        }
    }

    static getMappedNode(target: TargetNode): Node | undefined {
        const targetNode = new Node();
        if (target.nodeId != undefined) {
            targetNode.nodeType.value = target.nodeId;
            targetNode.nodeType.case = "nodeId";
        } else if (target.tempNodeVar != undefined && target.tempNodeVar.ref != undefined) {
            targetNode.nodeType.value = target.tempNodeVar.ref.name;
            targetNode.nodeType.case = "tempId";
        } else {
            return undefined;
        }
        return targetNode;
    }
}

interface RunnerContext {
    cancellationToken: CancellationToken,
    timeout: NodeJS.Timeout,
    log: (value: unknown) => MaybePromise<void>,
    onStart?: () => void
}


export interface InterpreterContext {
    log: (value: unknown) => MaybePromise<void>,
    onStart?: () => void,
}

interface BuildResult {
    document: LangiumDocument
    dispose: () => Promise<void>
}

type ReturnFunction = (value: unknown) => void;
