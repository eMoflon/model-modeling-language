import {SerializedModel} from "../serializer/mml-entity-templates.js";
import {SerializedInstances} from "../serializer/mml-instance-templates.js";
import {deserializeModel} from "./mml-entity-deserializer.js";
import {toString, URI} from "langium";
import {SerializedDocument} from "../../shared/MmlConnectorTypes.js";
import {MmlIdStorage} from "./mml-id-storage.js";

export function deserializeStringToMMLCode(serialized: string, idStorage: MmlIdStorage): string {
    const {typegraph}: { typegraph: SerializedModel, instancegraph: SerializedInstances } = JSON.parse(serialized)
    return toString(deserializeModel(typegraph, idStorage));
}

export type DeserializedCLIDoc = {
    modelName: string;
    modelCode: string
}

export function deserializeSerializedCLIDoc(cliDoc: string): DeserializedCLIDoc[] {
    const sDocs: SerializedDocument[] = JSON.parse(cliDoc);
    const idStorage: MmlIdStorage = new MmlIdStorage(sDocs);
    if (sDocs == undefined || sDocs.length != 1) {
        throw new Error("Unexpected number of serialized documents received!");
    }

    return sDocs.map(sDoc => {
        const uniformUri: string = URI.parse(sDoc.uri).path;
        const modelName: string = uniformUri.substring(uniformUri.lastIndexOf("/") + 1).replace(".ecore", "").replace(".mml", "");
        const modelCode: string = deserializeStringToMMLCode(sDoc.content, idStorage);
        return {modelName: modelName, modelCode: modelCode} as DeserializedCLIDoc;
    })
}
