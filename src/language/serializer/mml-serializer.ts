import {Model} from "../generated/ast.js";
import {MmlReferenceStorage} from "./mml-reference-storage.js";
import {SerializedModel} from "./mml-entity-templates.js";
import {ModelModelingLanguageServices} from "../model-modeling-language-module.js";
import {SerializedInstances} from "./mml-instance-templates.js";
import {MmlInstanceRegistry} from "./mml-instance-registry.js";
import {jsonReplacer} from "./utils.js";

/**
 * Function to interpret and serialize a given Mml model
 * @param model Model to serialize
 * @param services Langium services
 */
export function serializeModel(model: Model, services: ModelModelingLanguageServices): string {
    const referenceStorage = new MmlReferenceStorage(services.workspace.AstNodeLocator);
    const instanceRegistry = new MmlInstanceRegistry();
    const serializedModel = new SerializedModel(model, referenceStorage);
    const serializedInstances = new SerializedInstances(model, referenceStorage, instanceRegistry);
    return JSON.stringify({typegraph: serializedModel, instancegraph: serializedInstances}, jsonReplacer);
}