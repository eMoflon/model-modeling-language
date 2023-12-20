import {ArithExpr, Attribute, Class, Model} from "../src/language/generated/ast.js";
import {parseDocument, validationHelper, ValidationResult} from "langium/test";
import {AstNode, EmptyFileSystem, LangiumDocument} from "langium";
import {serializeModel} from "../src/language/serializer/mml-serializer.js";
import {MmlSerializerContext} from "../src/language/serializer/mml-serializer-context.js";
import {
    createModelModelingLanguageServices,
    ModelModelingLanguageServices
} from "../src/language/model-modeling-language-module.js";
import {Assertion, expect} from "vitest";
import {Diagnostic} from "vscode-languageserver";

function getServices(): ModelModelingLanguageServices {
    return createModelModelingLanguageServices(EmptyFileSystem).MmlServices;
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

export async function getArithExprEval(expr: string): Promise<boolean | number | string | undefined> {
    const exprWithContext =
        `package ExprEval {
        class ExprContainer {
            attribute int x = ${expr}
        }
        
        enum TestEnum {
            EnumA
        }
        enum TestIntEnum {
            EnumA = 42
        }
        enum TestStringEnum {
            EnumA = "Test?"
        }
    }`

    const model: Model = await getModel(exprWithContext)
    const exprContainer: Class | undefined = model.packages.at(0)?.body.at(0) as Class
    if (exprContainer == undefined) {
        return undefined
    }
    const exprNode: ArithExpr | undefined = (exprContainer.body.at(0) as Attribute).defaultValue
    if (exprNode == undefined) {
        return undefined
    }
    return new MmlSerializerContext().evaluateArithExpr(exprNode)
}

export function createPath(node: AstNode): string {
    const services = getServices();
    return services.workspace.AstNodeLocator.getAstNodePath(node);
}

export function findNode(node: AstNode, path: string): AstNode | undefined {
    const services = getServices();
    return services.workspace.AstNodeLocator.getAstNode(node, path);
}

export async function getSerialization(code: string): Promise<string> {
    const model: Model = await getModel(code);
    return serializeModel(model, getServices());
}

export function expectErrorCode(validationResult: ValidationResult<AstNode>, idx: number): Assertion {
    const diagnostic: Diagnostic | undefined = validationResult.diagnostics.at(idx);
    if (diagnostic == undefined) {
        throw new RangeError("Diagnostic index out of range!");
    }
    return expect(diagnostic.code);
}

export function expectParserErrorLength(model: Model): Assertion {
    const document: LangiumDocument | undefined = model.$document;
    if (document == undefined) {
        throw new Error("Model with undefined document!");
    }
    const parserErrorLength = document.parseResult.parserErrors.length;
    return expect(parserErrorLength);
}