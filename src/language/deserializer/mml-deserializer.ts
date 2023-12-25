import {SerializedModel} from "../serializer/mml-entity-templates.js";
import {SerializedInstances} from "../serializer/mml-instance-templates.js";
import {deserializeModel} from "./mml-entity-deserializer.js";
import {toString} from "langium";

export function deserializeStringToMMLCode(serialized: string): string {
    const {typegraph}: { typegraph: SerializedModel, instancegraph: SerializedInstances } = JSON.parse(serialized)
    return toString(deserializeModel(typegraph));
}