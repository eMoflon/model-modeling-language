import {AstNode, AstNodeLocator, getDocument, Reference} from "langium";

export class MmlReferenceStorage {
    private referenceMap: Map<string, AstNode> = new Map<string, AstNode>;
    private nodeMap: Map<AstNode, string> = new Map<AstNode, string>;
    private _astLocator;

    constructor(locator: AstNodeLocator) {
        this._astLocator = locator;
    }

    private storeReference(ref: Reference<AstNode>): string {
        const node = ref.ref;
        if (node != undefined) {
            const referenceId = this.getNodeReferenceId(node);
            this.referenceMap.set(referenceId, node);
            this.nodeMap.set(node, referenceId);
            return referenceId;
        } else {
            console.error("Undefined node!")
            return "$$ERROR$$";
        }
    }

    public getNodeReferenceId(node: AstNode): string {
        const doc = getDocument(node);
        const path = this._astLocator.getAstNodePath(node);
        return doc.uri.path + node.$type + path;
    }

    public resolveReference(ref: Reference<AstNode>): string {
        const node = ref.ref;
        if (node != undefined && ref.$nodeDescription != undefined) {
            const lookup = this.nodeMap.get(node);
            if (lookup != undefined) {
                return lookup;
            }
            return this.storeReference(ref);
        } else {
            console.error("Undefined node!")
            return "$$ERROR$$";
        }
    }

    public updateReferenceStorage(refStorage: MmlReferenceStorage): void {
        if (this.referenceMap.size != refStorage.referenceMap.size) {
            refStorage.referenceMap.forEach((value: AstNode, key: string) => {
                if (!this.referenceMap.has(key)) {
                    this.referenceMap.set(key, value);
                }
            })
        }

        if (this.nodeMap.size != refStorage.nodeMap.size) {
            refStorage.nodeMap.forEach((value: string, key: AstNode) => {
                if (!this.nodeMap.has(key)) {
                    this.nodeMap.set(key, value);
                }
            })
        }
    }

    get astLocator() {
        return this._astLocator;
    }
}