import {
    ArithExpr,
    isBinaryExpression,
    isBoolExpr,
    isEnumValueExpr,
    isNumberExpr,
    isStringExpr,
    isVariableValueExpr
} from "../generated/ast";
import {ModelModelingLanguageUtils} from "../model-modeling-language-utils";

export class MmlSerializerContext {
    private variableMap: Map<string, any> = new Map<string, any>();


    constructor() {
    }

    public storeValue(name: string, value: any) {
        this.variableMap.set(name, value);
    }

    public evaluateArithExpr(expr: ArithExpr): boolean | number | string {
        if (isBoolExpr(expr)) {
            return expr.value;
        } else if (isStringExpr(expr)) {
            return expr.value;
        } else if (isNumberExpr(expr)) {
            return expr.value;
        } else if (isVariableValueExpr(expr)) {
            return "VAR";
        } else if (isEnumValueExpr(expr)) {
            const enumEntry = expr.val.ref;
            if (enumEntry != undefined) {
                if (enumEntry.value != undefined) {
                    return this.evaluateArithExpr(enumEntry.value);
                } else {
                    return ModelModelingLanguageUtils.getFullyQualifiedEnumEntryName(enumEntry, enumEntry.name);
                }
            }
        } else if (isBinaryExpression(expr)) {
            const left = this.evaluateArithExpr(expr.left);
            const right = this.evaluateArithExpr(expr.right);
            if (expr.operator == "+") {
                if (typeof left == "number" && typeof right == "number") {
                    return left + right;
                } else if (typeof left == "string" && typeof right == "number") {
                    return left + right;
                } else if (typeof left == "number" && typeof right == "string") {
                    return left + right;
                } else if (typeof left == "string" && typeof right == "string") {
                    return left + right;
                }
            } else if (expr.operator == "*") {
                if (typeof left == "number" && typeof right == "number") {
                    return left * right;
                } else if (typeof left == "string" && typeof right == "number") {
                    return left.repeat(right);
                } else if (typeof left == "number" && typeof right == "string") {
                    return right.repeat(left);
                }
            } else if (expr.operator == "-") {
                if (typeof left == "number" && typeof right == "number") {
                    return left - right;
                }
            } else if (expr.operator == "%") {
                if (typeof left == "number" && typeof right == "number") {
                    return left % right;
                }
            } else if (expr.operator == "^") {
                if (typeof left == "number" && typeof right == "number") {
                    return left ^ right;
                }
            } else if (expr.operator == "/") {
                if (typeof left == "number" && typeof right == "number") {
                    return left / right;
                }
            }
        }
        return "$$UNKNOWN$$"
    }
}
