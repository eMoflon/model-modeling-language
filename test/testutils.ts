import {Model} from "../src/language-server/generated/ast";
import {parseDocument, validationHelper, ValidationResult} from "langium/test";
import {AstNode, EmptyFileSystem} from "langium";
import {
    createModelModelingLanguageServices,
    ModelModelingLanguageServices
} from "../src/language-server/model-modeling-language-module";

function getServices(): ModelModelingLanguageServices {
    return createModelModelingLanguageServices(EmptyFileSystem).mmlServices;
}

export async function getModel(code: string): Promise<Model> {
    const services = getServices();
    const doc = await parseDocument(services, code);
    return doc.parseResult.value as Model;
}

export async function getValidation(code: string): Promise<ValidationResult> {
    const services = getServices();
    const validator = validationHelper(services);
    const val = await validator(code);
    val.diagnostics.forEach(value => console.error(value.code));
    return val;
}

export function createPath(node: AstNode): string {
    const services = getServices();
    return services.workspace.AstNodeLocator.getAstNodePath(node);
}

export function findNode(node: AstNode, path: string): AstNode | undefined {
    const services = getServices();
    return services.workspace.AstNodeLocator.getAstNode(node, path);
}