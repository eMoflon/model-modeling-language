import {EmptyFileSystem, interruptAndCheck, LangiumDocument, MaybePromise, URI} from "langium";
import {
    GMStatement,
    GraphManipulationDocument,
    isGMChainStatement,
    isReferencedModelStatement,
    TargetNode
} from "../../language/generated/ast.js";
import {v4} from "uuid";
import {GraphManipulationLanguageServices} from "../../language/graph-manipulation-language-module.js";
import {CancellationToken, CancellationTokenSource} from "vscode-languageserver";
import {ModelServerConnector} from "../model-server-connector.js";
import {createMmlAndGclServices} from "../../language/main-module.js";
import {PostEditRequest} from "../generated/de/nexus/modelserver/ModelServerEdits_pb.js";
import {EditChainRequest, EditRequest, Node} from "../generated/de/nexus/modelserver/ModelServerEditStatements_pb.js";
import {GMProtoMapper} from "./GMProtoMapper.js";


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

        try {
            if (isGMChainStatement(element)) {
                const req: EditChainRequest = GMProtoMapper.mapEditRequest(element) as EditChainRequest;
                const fullReq: PostEditRequest = new PostEditRequest(
                    {
                        request: {
                            case: "editChain",
                            value: req
                        }
                    }
                )
                return this._modelServerConnector.clients.editClient.requestEdit(fullReq).then(response => GMProtoMapper.processResponse(fullReq, response, context));
            } else {
                const req: EditRequest = GMProtoMapper.mapEditRequest(element) as EditRequest;
                const fullReq: PostEditRequest = new PostEditRequest(
                    {
                        request: {
                            case: "edit",
                            value: req
                        }
                    }
                )

                return this._modelServerConnector.clients.editClient.requestEdit(fullReq).then(response => GMProtoMapper.processResponse(fullReq, response, context));
            }
        } catch (ex) {
            if (typeof ex === "string") {
                return Promise.reject(ex.toUpperCase());
            } else if (ex instanceof Error) {
                return Promise.reject(ex.message);
            }
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

export interface RunnerContext {
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
