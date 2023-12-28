import {SerializedModel} from "../serializer/mml-entity-templates.js";
import {SerializedInstances} from "../serializer/mml-instance-templates.js";
import {deserializeModel} from "./mml-entity-deserializer.js";
import {toString} from "langium";
import {SerializedDocument} from "../../shared/MmlConnectorTypes.js";
import {Uri} from "vscode";
import {MmlIdStorage} from "./mml-id-storage.js";

export function deserializeStringToMMLCode(serialized: string, idStorage: MmlIdStorage): string {
    const {typegraph}: { typegraph: SerializedModel, instancegraph: SerializedInstances } = JSON.parse(serialized)
    return toString(deserializeModel(typegraph, idStorage));
}

export function deserializeSerializedCLIDoc(cliDoc: string): { modelName: string, modelCode: string } {
    const sDocs: SerializedDocument[] = JSON.parse(cliDoc);
    const idStorage: MmlIdStorage = new MmlIdStorage(sDocs);
    if (sDocs == undefined || sDocs.length != 1) {
        throw new Error("Unexpected number of serialized documents received!");
    }
    const sDoc: SerializedDocument = sDocs.at(0)!;
    const uniformUri: string = Uri.parse(sDoc.uri).path;
    const modelName: string = uniformUri.substring(uniformUri.lastIndexOf("/") + 1).replace(".ecore", "").replace(".mml", "");
    const modelCode: string = deserializeStringToMMLCode(sDoc.content, idStorage);
    return {modelName: modelName, modelCode: modelCode};
}
