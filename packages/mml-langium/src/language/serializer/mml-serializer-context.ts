import {
    Expression,
    isBinaryExpression,
    isBoolExpr,
    isEnumValueExpr,
    isNumberExpr,
    isStringExpr,
    isVariableValueExpr,
    QualifiedValueExpr,
    TypedVariable,
    Variable
} from "../generated/ast.js";
import {ExprUtils} from "../expr-utils.js";

/**
 * The MmlSerializerContext is used for variable storage and resolution.
 * At any given time, the used context should represent the variable states
 * of the current scope.
 *
 * Since any variable values are used inside a ArithExpr, the ArithExpr evaluation
 * is also included in this class. The evaluation is performed considering the current context.
 */
export class MmlSerializerContext {
    private variableMap: Map<Variable, any> = new Map<Variable, any>();
    private unbindedValue: any;


    constructor() {
    }

    public storeValue(variable: Variable, value: any) {
        this.variableMap.set(variable, value);
    }

    public storeUnbindedValue(value: any) {
        this.unbindedValue = value;
    }

    public unsetValue(variable: Variable) {
        this.variableMap.delete(variable);
    }

    public resolve(variable: Variable): any {
        return this.variableMap.get(variable);
    }

    public resolveUnbindedValue() {
        return this.unbindedValue;
    }

    public clone(): MmlSerializerContext {
        const newContext = new MmlSerializerContext();
        this.variableMap.forEach((value: any, key: Variable) => {
            newContext.storeValue(key, value);
        });
        return newContext;
    }

    public enhance(other: MmlSerializerContext): void {
        other.variableMap.forEach((value: any, key: Variable) => {
            if (!this.variableMap.has(key)) {
                this.storeValue(key, value);
            }
        });
    }

    public evaluateArithExpr(expr: Expression): boolean | number | string {
        if (isBoolExpr(expr)) {
            return expr.value;
        } else if (isStringExpr(expr)) {
            return expr.value;
        } else if (isNumberExpr(expr)) {
            return expr.value;
        } else if (isVariableValueExpr(expr) && expr.val.ref != undefined) {
            return this.resolve(expr.val.ref);
        } else if (ExprUtils.isFunctionVariableInvocationExpr(expr) && expr.val.ref != undefined) {
            const resolver: MmlSerializerContext | undefined = this.findFunctionVariableSelectorBase(expr);
            if (resolver != undefined) {
                return resolver.resolve(expr.val.ref as TypedVariable);
            }
        } else if (isEnumValueExpr(expr)) {
            const enumEntry = expr.val.ref;
            if (enumEntry != undefined) {
                if (enumEntry.value != undefined) {
                    return this.evaluateArithExpr(enumEntry.value);
                } else {
                    return enumEntry.name;
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
                    return left ** right;
                }
            } else if (expr.operator == "/") {
                if (typeof left == "number" && typeof right == "number") {
                    return left / right;
                }
            }
        }
        return "$$UNKNOWN$$"
    }

    private findFunctionVariableSelectorBase(fExpr: QualifiedValueExpr): MmlSerializerContext | undefined {
        if (!ExprUtils.isFunctionVariableInvocationExpr(fExpr)) {
            return undefined;
        }
        const baseName = fExpr.val.$refText.split(".")[0];
        for (let [key, value] of this.variableMap) {
            if (key.name == baseName && value instanceof MmlSerializerContext) {
                return value;
            }
        }
        return undefined;
    }
}
