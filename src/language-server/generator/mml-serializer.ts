import {Model} from "../generated/ast";
import {MmlReferenceStorage} from "./mml-reference-storage";
import {SerializedModel} from "./mml-entity-templates";
import {ModelModelingLanguageServices} from "../model-modeling-language-module";


export function serializeModel(model: Model, services: ModelModelingLanguageServices): string {
    const referenceStorage = new MmlReferenceStorage(services);
    const serializedModel = new SerializedModel(model, referenceStorage);
    return JSON.stringify(serializedModel);
}