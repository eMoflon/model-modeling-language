import {ConstraintDocument} from "../generated/ast.js";
import {GraphConstraintLanguageServices} from "../graph-constraint-language-module.js";
import {GclReferenceStorage} from "./gcl-reference-storage.js";
import {ConstraintDocumentEntity} from "./gcl-entity-templates.js";
import {jsonReplacer} from "../serializer/utils.js";

export function serializeConstraintDocument(constraintDoc: ConstraintDocument, packageName: string, services: GraphConstraintLanguageServices): string {
    const referenceStorage: GclReferenceStorage = new GclReferenceStorage(services.workspace.AstNodeLocator);
    const serializedConstraintDoc = new ConstraintDocumentEntity(constraintDoc, packageName, referenceStorage);
    return JSON.stringify(serializedConstraintDoc, jsonReplacer);
}