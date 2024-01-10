import {AstNode, AstNodeLocator, getDocument, Reference} from "langium";

/**
 * The MmlReferenceStorage stores and resolves ids of ast nodes
 */
export class GclReferenceStorage {
    private referenceMap: Map<string, AstNode> = new Map<string, AstNode>;
    private nodeMap: Map<AstNode, string> = new Map<AstNode, string>;
    private readonly _astLocator;

    constructor(locator: AstNodeLocator) {
        this._astLocator = locator;
    }

    public resolve(ref: Reference): string {
        const node = ref.ref;
        if (node != undefined && ref.$nodeDescription != undefined) {
            const lookup = this.nodeMap.get(node);
            if (lookup != undefined) {
                return lookup;
            }
            const referenceId = this.getNodeReferenceId(node);
            this.referenceMap.set(referenceId, node);
            this.nodeMap.set(node, referenceId);
            return referenceId;
        } else {
            console.error("Undefined node!");
            return "$$ERROR$$";
        }
    }

    public resolveNode(node: AstNode): string {
        const lookup = this.nodeMap.get(node);
        if (lookup != undefined) {
            return lookup;
        }
        const referenceId = this.getNodeReferenceId(node);
        this.referenceMap.set(referenceId, node);
        this.nodeMap.set(node, referenceId);
        return referenceId;
    }

    public getNodeReferenceId(node: AstNode): string {
        const doc = getDocument(node);
        const path = this._astLocator.getAstNodePath(node);
        return doc.uri.path + node.$type + path;
    }
}