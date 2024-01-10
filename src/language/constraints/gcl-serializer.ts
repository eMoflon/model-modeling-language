import {ConstraintDocument} from "../generated/ast.js";
import {GraphConstraintLanguageServices} from "../graph-constraint-language-module.js";
import {GclReferenceStorage} from "./gcl-reference-storage.js";
import {ConstraintDocumentEntity} from "./gcl-entity-templates.js";
import {jsonReplacer} from "../serializer/utils.js";

export function serializeConstraintDocument(constraintDoc: ConstraintDocument, services: GraphConstraintLanguageServices): string {
    const referenceStorage = new GclReferenceStorage(services.workspace.AstNodeLocator);
    const serializedConstraintDoc = new ConstraintDocumentEntity(constraintDoc, referenceStorage);
    return JSON.stringify(serializedConstraintDoc, jsonReplacer);
}