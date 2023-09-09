import {ArithExpr, Attribute, Class, Model} from "../src/language-server/generated/ast";
import {parseDocument, validationHelper, ValidationResult} from "langium/test";
import {AstNode, EmptyFileSystem} from "langium";
import {
    createModelModelingLanguageServices,
    ModelModelingLanguageServices
} from "../src/language-server/model-modeling-language-module";
import {serializeModel} from "../src/language-server/generator/mml-serializer";
import {MmlSerializerContext} from "../src/language-server/generator/mml-serializer-context";

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