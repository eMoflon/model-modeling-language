import {
    AbstractElement,
    Class,
    Enum,
    EnumValueExpr,
    ImplicitlyTypedValue,
    Interface,
    isBinaryExpression,
    isBoolExpr,
    isEnumValueExpr,
    isFunctionLoop,
    isFunctionVariable,
    isFunctionVariableSelectorExpr,
    isInstanceLoop,
    isNegatedExpression,
    isNumberExpr,
    isStringExpr,
    isTypedVariable,
    isUntypedVariable,
    isVariableValueExpr,
    Expression,
    Variable
} from "./generated/ast.js";

export class ExprUtils {
    public static evaluateExpressionType(expr: Expression): ExprType {
        if (isBinaryExpression(expr)) {
            let lType = this.evaluateExpressionType(expr.left);
            let rType = this.evaluateExpressionType(expr.right);

            if (expr.operator == '&&' || expr.operator == '||') {
                if (lType == ExprType.BOOLEAN && rType == ExprType.BOOLEAN) {
                    return ExprType.BOOLEAN;
                }
                return ExprType.ERROR;
            }
            if (expr.operator == '==' || expr.operator == '!=') {
                return ExprType.BOOLEAN;
            }
            if (expr.operator == '<' || expr.operator == '<=' || expr.operator == '>' || expr.operator == '>=') {
                return ExprType.BOOLEAN;
            }

            if (lType == rType) {
                if (lType == ExprType.INTEGER && expr.operator == '/') {
                    return ExprType.NUMBER;
                }
                return lType;
            }
            if (this.isNumberExpressionType(lType) && this.isNumberExpressionType(rType)) {
                return ExprType.NUMBER;
            }
            if (expr.operator == '*' || expr.operator == '+') {
                if (lType == ExprType.STRING || rType == ExprType.STRING) {
                    if (this.isNumberExpressionType(lType) || this.isNumberExpressionType(rType)) {
                        return ExprType.STRING;
                    } else if (lType == ExprType.BOOLEAN || rType == ExprType.BOOLEAN) {
                        return ExprType.STRING;
                    }
                }
                return ExprType.ERROR;
            }
            return ExprType.UNDEFINED;
        }
        if (isNegatedExpression(expr)) {
            return this.evaluateExpressionType(expr.right);
        }
        if (isVariableValueExpr(expr) || isFunctionVariableSelectorExpr(expr)) {
            if (expr.val.ref != undefined) {
                const varTyping = this.getVariableTyping(expr.val.ref);
                if (varTyping.isValidPrimitive) {
                    return varTyping.typeAsPrimitive;
                }
                return ExprType.ERROR;
            }
        }
        if (isEnumValueExpr(expr)) {
            return this.getEnumValueExprType(expr);
        }
        return ExprType.fromSimpleExpression(expr);
    }

    public static isNumberExpressionType(exprType: ExprType): boolean {
        return exprType == ExprType.INTEGER || exprType == ExprType.DOUBLE || exprType == ExprType.FLOAT || exprType == ExprType.NUMBER;
    }

    /**
     * Determine the type of enum value. Since EnumEntries are not explicitly typed,
     * we must determine the type of the provided default value first.
     * Returns $$ENUMVALUE$$ in case of EnumEntry without default value
     * @param eve
     */
    public static getEnumValueExprType(eve: EnumValueExpr): ExprType {
        if (eve.val.ref != undefined && eve.val.ref.value != undefined) {
            const valExpr = eve.val.ref.value;
            if (isNumberExpr(valExpr)) {
                if (Number.isInteger(valExpr.value)) {
                    return ExprType.INTEGER;
                }
                return ExprType.DOUBLE;
            } else if (isBoolExpr(valExpr)) {
                return ExprType.BOOLEAN;
            }
            return ExprType.STRING;
        }
        return ExprType.ERROR;
    }

    /**
     * Determine the unified enum type.
     * Since enums are not explicitly typed, we must determine the types of all provided default values.
     * If there is no unified type, return ERROR
     * @param node Enum to be typed
     */
    public static getEnumType(node: Enum): ExprType {
        const types = [...new Set(node.entries.map(entry => this.getEnumValueExprType({val: {ref: entry}} as EnumValueExpr)))];
        if (types.length == 1) {
            return types.at(0) ?? ExprType.ERROR;
        } else if (types.filter(x => !this.isNumberExpressionType(x)).length > 0) {
            return ExprType.NUMBER;
        }
        return ExprType.ERROR;
    }

    /**
     * Determine the typing of a variable
     * The Typing is in a uniform format for all variable subtypes.
     *
     * =>  {dtype:<Value>, type:<Value>}
     *
     * In case of a primitive typed value, the dtype attribute is set and type is undefined.
     * In case of a Class-like typed value, the type attribute is set and dtype is undefined.
     * @param v
     */
    public static getVariableTyping(v: Variable): VariableTyping {
        if (isTypedVariable(v)) {
            const refAbstractElement: AbstractElement | undefined = v.typing.type?.ref;
            if (refAbstractElement != undefined) {
                return new VariableTyping(false, refAbstractElement);
            }
            return new VariableTyping(true, ExprType.fromMMLType(v.typing.dtype));
        } else if (isFunctionVariable(v)) {
            return new VariableTyping(true, ExprType.TUPLE);
        } else if (isUntypedVariable(v)) {
            if (isFunctionLoop(v.$container)) {
                return new VariableTyping(true, ExprType.INTEGER);
            } else if (isInstanceLoop(v.$container)) {
                if (v.$container.ref.ref != undefined && v.$container.ref.ref.type.ref != undefined) {
                    return new VariableTyping(false, v.$container.ref.ref.type.ref);
                }
            }
        }
        return new VariableTyping(false, undefined);
    }

    /**
     * Determine the typ of a ImplicitlyTypedValue based on its value.
     * Those are most present in the Function- and the Instance for-Loop
     * @param itv ImplicitlyTypedValue to be typed
     */
    public static getImplicitlyTypedValue(itv: ImplicitlyTypedValue): ExprType {
        const ExpressionType = this.evaluateExpressionType(itv.val);
        if (this.isIntExpression(itv.val)) {
            return ExprType.INTEGER;
        }
        return ExpressionType;
    }

    /*    /!**
         * Resolve the final type of evaluated variable value
         * Specify evaluated type based on the variable type, defaults to StringExpr
         *
         * @param expr VariableValueExpr to be typed
         * @private
         *!/
        private static resolveVariableValueType(expr: VariableValueExpr): ExpressionType {
            if (isVariableValueExpr(expr) && expr.val.ref != undefined) {
                const typing = ExpressionUtils.getVariableTyping(expr.val.ref);
                if (typing.dtype != undefined) {
                    return typing.dtype;
                }
            }
            return ExpressionType.STRING;
        }*/

    /**
     * Check if Expression resolves to an integer value
     * To do so, interpret the expression, check for number expr and check for remainder
     * @param arith Expression to be checked
     */
    public static isIntExpression(arith: Expression): boolean {
        if (arith.$type === "BinaryExpression") {
            return this.isIntExpression(arith.left) && this.isIntExpression(arith.right);
        } else if (isVariableValueExpr(arith)) {
            if (arith.val.ref != undefined) {
                const varTyping = this.getVariableTyping(arith.val.ref);
                if (varTyping.isValidPrimitive && varTyping.type == ExprType.INTEGER) {
                    return true;
                }
            }
            return false;
        }
        return isNumberExpr(arith) && arith.value % 1 === 0;
    }

    /**
     * Check if Expression resolves to a boolean value
     * @param expr Expression to be checked
     */
    public static isBoolExpression(expr: Expression): boolean {
        return isBoolExpr(expr) || this.evaluateExpressionType(expr) == ExprType.BOOLEAN;
    }

    /**
     * Check if Expression resolves to a number value
     * This can be any kind of number, use isIntExpression() to check for integers
     * @param expr Expression to be checked
     */
    public static isNumberExpression(expr: Expression): boolean {
        return isNumberExpr(expr) || this.isNumberExpressionType(this.evaluateExpressionType(expr));
    }

    /**
     * Check if Expression resolves to a string value
     * @param expr Expression to be checked
     */
    public static isStringExpression(expr: Expression): boolean {
        return isStringExpr(expr) || this.evaluateExpressionType(expr) == ExprType.STRING;
    }

    /**
     * Check if Expression resolves to an enum value
     * @param expr Expression to be checked
     */
    public static isEnumValueExpression(expr: Expression): boolean {
        return isEnumValueExpr(expr);
    }

    /**
     * Check if Expression resolves to a function variable selector value
     * @param expr Expression to be checked
     */
    public static isFunctionVariableSelectorExpression(expr: Expression): boolean {
        return isFunctionVariableSelectorExpr(expr);
    }
}

export enum ExprType {
    INTEGER,
    DOUBLE,
    FLOAT,
    NUMBER,
    STRING,
    BOOLEAN,
    UNDEFINED,
    ERROR,
    TUPLE
}

export namespace ExprType {
    export function fromMMLType(mmlType: ('int' | 'string' | 'bool' | 'double' | 'float' | undefined)): ExprType {
        if (mmlType == undefined) {
            return ExprType.UNDEFINED;
        } else if (mmlType == "bool") {
            return ExprType.BOOLEAN;
        } else if (mmlType == "string") {
            return ExprType.STRING;
        } else if (mmlType == "int") {
            return ExprType.INTEGER;
        } else if (mmlType == "double") {
            return ExprType.DOUBLE;
        } else if (mmlType == "float") {
            return ExprType.FLOAT;
        }
        return ExprType.ERROR;
    }

    export function toMMLType(type: ExprType): ('int' | 'string' | 'bool' | 'double' | 'float' | undefined) {
        if (type == ExprType.STRING) {
            return "string";
        } else if (type == ExprType.INTEGER) {
            return "int";
        } else if (type == ExprType.DOUBLE) {
            return "double";
        } else if (type == ExprType.FLOAT) {
            return "float";
        } else if (type == ExprType.BOOLEAN) {
            return "bool";
        }
        return undefined;
    }

    export function equals(left: ExprType, right: ExprType): boolean {
        if (left == right) {
            return true;
        }
        return ExprUtils.isNumberExpressionType(left) && right == ExprType.NUMBER;
    }

    export function fromSimpleExpression(Expression: Expression): ExprType {
        if (isStringExpr(Expression)) {
            return ExprType.STRING;
        } else if (isBoolExpr(Expression)) {
            return ExprType.BOOLEAN;
        } else if (isNumberExpr(Expression)) {
            if (Number.isInteger(Expression.value)) {
                return ExprType.INTEGER;
            }
            return ExprType.DOUBLE;
        }
        return ExprType.ERROR;
    }
}

export class VariableTyping {
    private readonly _isPrimitive: boolean;
    private readonly _type: (ExprType | Class | Enum | Interface | undefined);

    constructor(isPrimitive: boolean, type: ExprType | Class | Enum | Interface | undefined) {
        this._isPrimitive = isPrimitive;
        this._type = type;
    }

    get isValidPrimitive(): boolean {
        return this._isPrimitive && this._type != undefined && this._type != ExprType.ERROR && this._type != ExprType.UNDEFINED;
    }

    get isValidReference(): boolean {
        return !this._isPrimitive && this._type != undefined;
    }

    get isInvalid(): boolean {
        return this._type == undefined || (this._isPrimitive && (this._type == ExprType.ERROR || this._type == ExprType.UNDEFINED))
    }

    get typeAsPrimitive(): ExprType {
        return this._isPrimitive ? this._type as ExprType : ExprType.UNDEFINED;
    }

    get typeAsAbstractElement(): Class | Enum | Interface | undefined {
        return this._isPrimitive ? undefined : this._type as (Class | Enum | Interface | undefined);
    }

    get type(): ExprType | Class | Enum | Interface | undefined {
        return this._type;
    }

    public equals(other: VariableTyping): boolean {
        return this._isPrimitive == other._isPrimitive && this._type == other._type;
    }
}