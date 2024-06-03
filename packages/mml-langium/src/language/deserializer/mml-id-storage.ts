import {SerializedDocument} from "../../shared/MmlConnectorTypes.js";
import {PackageEntity, SerializedModel} from "../serializer/mml-entity-templates.js";
import {SerializedInstances} from "../serializer/mml-instance-templates.js";

export class MmlIdStorage {
    private knownIds: Map<string, string> = new Map<string, string>();


    constructor(sDocs: SerializedDocument[]) {
        sDocs.forEach(sDoc => {
            const {typegraph}: {
                typegraph: SerializedModel,
                instancegraph: SerializedInstances
            } = JSON.parse(sDoc.content);
            typegraph.packages.forEach(pckg => {
                this.initializePackage(pckg, "");
            })
        })
    }

    private initializePackage(pckg: PackageEntity, prefix: string) {
        this.storeElementId(pckg.referenceId, prefix + pckg.name);
        pckg.subPackages.forEach(sPckg => {
            this.initializePackage(sPckg, prefix + pckg.name + ".");
        })
        pckg.enums.forEach(enm => {
            this.storeElementId(enm.referenceId, prefix + pckg.name + "." + enm.name);
            enm.entries.forEach(enmEntry => {
                this.storeElementId(enmEntry.referenceId, prefix + pckg.name + "." + enm.name + "::" + enmEntry.name);
            })
        })
        pckg.abstractClasses.forEach(ac => {
            this.storeElementId(ac.referenceId, prefix + pckg.name + "." + ac.name);
            ac.references.forEach(ref => {
                this.storeElementId(ref.referenceId, prefix + pckg.name + "." + ac.name + "::" + ref.name);
            })
        })
    }

    public storeElementId(id: string, elementName: string): void {
        if (!this.knownIds.has(id)) {
            this.knownIds.set(id, elementName);
        }
    }

    public resolveId(id: string): string {
        return this.knownIds.get(id) ?? "$$UNKNOWN$$";
    }
}