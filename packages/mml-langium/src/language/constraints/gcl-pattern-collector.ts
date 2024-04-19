import {EdgeEntity, PatternEntity, PatternNodeEntity, SupportPatternInvocationEntity} from "./gcl-entity-templates.js";
import {ConstraintPatternDeclaration, isPattern, Pattern} from "../generated/ast.js";
import {GclReferenceStorage} from "./gcl-reference-storage.js";

export class GclPatternCollector {
    private _patternCollection: Map<string, PatternEntity> = new Map<string, PatternEntity>();
    private _internalPatternCollection: Map<string, InternalPatternContainer> = new Map<string, InternalPatternContainer>();
    private readonly _resolver: GclReferenceStorage;


    constructor(resolver: GclReferenceStorage) {
        this._resolver = resolver;
    }

    public push(pattern: PatternEntity | Pattern) {
        if (isPattern(pattern)) {
            const entity: PatternEntity = new PatternEntity(pattern, this._resolver);
            this._patternCollection.set(entity.patternId, entity);
        } else {
            this._patternCollection.set(pattern.patternId, pattern);
        }
    }

    public pushInternal(patternBlueprint: InternalPatternBlueprint, varDec: ConstraintPatternDeclaration, nodeMapping: Map<string, string>) {
        const decId: string = this.getDeclarationId(varDec);
        const container: InternalPatternContainer = new InternalPatternContainer(decId, varDec, patternBlueprint, nodeMapping);
        this._internalPatternCollection.set(decId, container);
    }

    public pushAll(pattern: PatternEntity[] | Pattern[]) {
        for (const patternElement of pattern) {
            this.push(patternElement);
        }
    }

    public patternEntityById(id: string) {
        return this._patternCollection.get(id)!;
    }

    public patternEntityByPattern(pattern: Pattern) {
        const patternId: string = this._resolver.getNodeReferenceId(pattern);
        return this.patternEntityById(patternId);
    }

    public internalPatternEntityByDeclarationId(id: string) {
        return this._internalPatternCollection.get(id)!;
    }

    public internalPatternEntityByDeclaration(pDec: ConstraintPatternDeclaration) {
        const declarationId: string = this._resolver.getNodeReferenceId(pDec);
        return this._internalPatternCollection.get(declarationId)!;
    }

    public hasInternalPatternByDeclarationId(id: string) {
        return this._internalPatternCollection.has(id);
    }

    public hasInternalPatternByDeclaration(pDec: ConstraintPatternDeclaration) {
        const declarationId: string = this._resolver.getNodeReferenceId(pDec);
        return this._internalPatternCollection.has(declarationId);
    }

    public getDeclarationId(varDec: ConstraintPatternDeclaration) {
        return this._resolver.getNodeReferenceId(varDec);
    }

    get internalPatternCollection(): InternalPatternContainer[] {
        return [...this._internalPatternCollection.values()]
    }


    get patternCollection(): PatternEntity[] {
        return [...this._patternCollection.values()];
    }
}

class InternalPatternContainer {
    private readonly _declarationId: string;
    private readonly _variableDeclaration: ConstraintPatternDeclaration;
    private readonly _patternBlueprint: InternalPatternBlueprint;
    private readonly _nodeMapping: Map<string, string>;


    constructor(declarationId: string, varDec: ConstraintPatternDeclaration, patternBlueprint: InternalPatternBlueprint, nodeMapping: Map<string, string>) {
        this._declarationId = declarationId;
        this._variableDeclaration = varDec;
        this._patternBlueprint = patternBlueprint;
        this._nodeMapping = nodeMapping;
    }


    get declarationId(): string {
        return this._declarationId;
    }


    get variableDeclaration(): ConstraintPatternDeclaration {
        return this._variableDeclaration;
    }


    get patternBlueprint(): InternalPatternBlueprint {
        return this._patternBlueprint;
    }

    get nodeMapping(): Map<string, string> {
        return this._nodeMapping;
    }
}

export class InternalPatternBlueprint {
    readonly name: string;
    readonly patternId: string;
    readonly nodes: PatternNodeEntity[] = [];
    readonly edges: EdgeEntity[] = [];


    constructor(name: string, patternId: string, nodes: PatternNodeEntity[], edges: EdgeEntity[]) {
        this.name = name;
        this.patternId = patternId;
        this.nodes = nodes;
        this.edges = edges;
    }

    public build(pac: SupportPatternInvocationEntity[], nac: SupportPatternInvocationEntity[]): PatternEntity {
        return {
            patternId: this.patternId,
            name: this.name,
            disableDefaultNodeConstraints: true,
            nodeConstraints: [],
            nodes: this.nodes,
            edges: this.edges,
            constraints: [],
            pac: pac,
            nac: nac,
            registerEdge(edge: EdgeEntity) {
            }
        }
    }
}