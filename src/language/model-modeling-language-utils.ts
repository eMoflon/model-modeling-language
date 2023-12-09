import {AstNode} from "langium";
import {
    AbstractElement,
    ArithExpr,
    Class,
    CReference,
    Enum,
    EnumEntry,
    EnumValueExpr,
    FunctionReturn,
    FunctionStatement,
    IFunction,
    ImplicitlyTypedValue,
    Interface,
    isBinaryExpression,
    isBoolExpr,
    isClass,
    isEnum,
    isEnumValueExpr,
    isFunctionAssignment,
    isFunctionLoop,
    isFunctionVariable,
    isFunctionVariableSelectorExpr,
    isInstanceLoop,
    isInterface,
    isNumberExpr,
    isPackage,
    isStringExpr,
    isTypedVariable,
    isUntypedVariable,
    isVariableValueExpr,
    TypedVariable,
    Variable,
    VariableValueExpr
} from "./generated/ast.js";

/**
 * A collection of various functions, which are used by different components.
 */
export class ModelModelingLanguageUtils {
    /**
     * Returns the fully qualified name for a CReference
     * package A {
     *     class B {
     *         reference A.B x;
     *     }
     * }
     *
     * => The FQN of the Reference x is: A.B::x
     *
     * @param node The reference
     * @param name The name of the reference
     */
    public static getFullyQualifiedRefName(node: CReference, name: string): string {
        let parent: AstNode | undefined = node.$container;
        if (isClass(parent)) {
            name = `${parent.name}::${name}`;
            parent = parent.$container;
        }
        while (isPackage(parent)) {
            // Iteratively prepend the name of the parent namespace
            // This allows us to work with nested namespaces
            name = `${parent.name}.${name}`;
            parent = parent.$container;
        }
        return name;
    }

    /**
     * Returns the fully qualified name for an EnumEntry
     * package A {
     *     enum B {
     *         X,
     *         Y
     *     }
     * }
     *
     * => The FQN of the EnumEntry X is: A.B::X
     *
     * @param node The EnumEntry
     * @param name The name of the EnumEntry
     */
    public static getFullyQualifiedEnumEntryName(node: EnumEntry, name: string): string {
        let parent: AstNode | undefined = node.$container;
        if (isEnum(parent)) {
            name = `${parent.name}::${name}`;
            parent = parent.$container;
        }
        while (isPackage(parent)) {
            // Iteratively prepend the name of the parent namespace
            // This allows us to work with nested namespaces
            name = `${parent.name}.${name}`;
            parent = parent.$container;
        }
        return name;
    }

    /**
     * Returns the qualified name for a Class
     * package A {
     *     class B {
     *     }
     * }
     *
     * => The FQN of the Class B is: A.B
     *
     * @param node The Class
     * @param name The name of the Class
     */
    public static getQualifiedClassName(node: AstNode, name: string): string {
        let parent: AstNode | undefined = node.$container;
        while (isPackage(parent)) {
            // Iteratively prepend the name of the parent namespace
            // This allows us to work with nested namespaces
            name = `${parent.name}.${name}`;
            parent = parent.$container;
        }
        return name;
    }

    public static doesValueExpTypeMatch(stringType: string, valExpr: ArithExpr): boolean {
        if (this.isStringArithExpr(valExpr) && stringType === "string") {
            return true;
        }
        if (this.isBoolArithExpr(valExpr) && stringType === "bool") {
            return true;
        }
        return this.isNumberArithExpr(valExpr) && (stringType === "double" || stringType === "int");
    }

    /**
     * Evaluate a ArithExpr and reduce its type to StringExpr, BoolExpr or NumberExpr
     * @param arith ArithExpr to be typed
     */
    public static getArithExprType(arith: ArithExpr): "StringExpr" | "BoolExpr" | "NumberExpr" {
        if (arith.$type === "BinaryExpression") {
            let lType = arith.left.$type;
            let rType = arith.right.$type;
            if (isBinaryExpression(arith.left)) {
                lType = this.getArithExprType(arith.left);
            } else if (isVariableValueExpr(arith.left)) {
                lType = this.resolveVariableValueType(arith.left);
            }
            if (isBinaryExpression(arith.right)) {
                rType = this.getArithExprType(arith.right);
            } else if (isVariableValueExpr(arith.right)) {
                rType = this.resolveVariableValueType(arith.right);
            }
            if (lType == rType && lType != "BoolExpr" && lType != "EnumValueExpr" && lType != "VariableValueExpr" && lType != "FunctionVariableSelectorExpr" && lType != "BinaryExpression") {
                return lType;
            }
            return "StringExpr";
        }
        if (isVariableValueExpr(arith) || isFunctionVariableSelectorExpr(arith)) {
            if (arith.val.ref != undefined) {
                const varTyping = this.getVariableTyping(arith.val.ref);
                if (varTyping.dtype != undefined && (varTyping.dtype == "double" || varTyping.dtype == "float" || varTyping.dtype == "int")) {
                    return "NumberExpr";
                }
            }
            return "StringExpr";
        }
        if (isEnumValueExpr(arith)) {
            const eveType = this.getEnumValueExprType(arith);
            if (eveType == "double" || eveType == "int") {
                return "NumberExpr";
            } else if (eveType == "bool") {
                return "BoolExpr";
            } else {
                return "StringExpr";
            }
        }
        return arith.$type;
    }

    /**
     * Resolve the final type of evaluated variable value
     * Specify evaluated type based on the variable type, defaults to StringExpr
     *
     * @param expr VariableValueExpr to be typed
     * @private
     */
    private static resolveVariableValueType(expr: VariableValueExpr): "StringExpr" | "BoolExpr" | "NumberExpr" {
        if (isVariableValueExpr(expr) && expr.val.ref != undefined) {
            const typing = this.getVariableTyping(expr.val.ref);
            if (typing.dtype != undefined) {
                if (typing.dtype == "int" || typing.dtype == "double" || typing.dtype == "float") {
                    return "NumberExpr";
                } else if (typing.dtype == "string") {
                    return "StringExpr";
                } else if (typing.dtype == "bool") {
                    return "BoolExpr";
                }
            }
        }
        return "StringExpr";
    }

    /**
     * Check if ArithExpr resolves to an integer value
     * To do so, intertrep the expression, check for number expr and check for remainder
     * @param arith ArithExpr to be checked
     */
    public static isIntArithExpr(arith: ArithExpr): boolean {
        if (arith.$type === "BinaryExpression") {
            return this.isIntArithExpr(arith.left) && this.isIntArithExpr(arith.right);
        } else if (isVariableValueExpr(arith)) {
            if (arith.val.ref != undefined) {
                const varTyping = this.getVariableTyping(arith.val.ref);
                if (varTyping.dtype != undefined && varTyping.dtype == "int") {
                    return true;
                }
            }
            return false;
        }
        return isNumberExpr(arith) && arith.value % 1 === 0;
    }

    /**
     * Check if ArithExpr resolves to a boolean value
     * @param expr ArithExpr to be checked
     */
    public static isBoolArithExpr(expr: ArithExpr): boolean {
        return isBoolExpr(expr) || this.getArithExprType(expr) == "BoolExpr";
    }

    /**
     * Check if ArithExpr resolves to a number value
     * This can be any kind of number, use isIntArithExpr() to check for integers
     * @param expr ArithExpr to be checked
     */
    public static isNumberArithExpr(expr: ArithExpr): boolean {
        return isNumberExpr(expr) || this.getArithExprType(expr) == "NumberExpr";
    }

    /**
     * Check if ArithExpr resolves to a string value
     * @param expr ArithExpr to be checked
     */
    public static isStringArithExpr(expr: ArithExpr): boolean {
        return isStringExpr(expr) || this.getArithExprType(expr) == "StringExpr";
    }

    /**
     * Check if ArithExpr resolves to an enum value
     * @param expr ArithExpr to be checked
     */
    public static isEnumValueArithExpr(expr: ArithExpr): boolean {
        return isEnumValueExpr(expr);
    }

    /**
     * Check if ArithExpr resolves to a function variable selector value
     * @param expr ArithExpr to be checked
     */
    public static isFunctionVariableSelectorArithExpr(expr: ArithExpr): boolean {
        return isFunctionVariableSelectorExpr(expr);
    }

    /**
     * Determine the type of InstanceVariable, in case of primitive type, return that.
     * Otherwise, return qualified class name.
     * @param instVar TypedVariable to be typed
     */
    public static getInstanceVariableType(instVar: TypedVariable): string {
        if (instVar.typing.type == undefined && instVar.typing.dtype != undefined) {
            return instVar.typing.dtype;
        }
        if (instVar.typing.type != undefined && instVar.typing.dtype == undefined && instVar.typing.type.ref != undefined) {
            return this.getQualifiedClassName(instVar.typing.type.ref, instVar.typing.type.ref.name);
        }
        return "$$UNKNOWN$$";
    }

    /**
     * Determine the type of enum value. Since EnumEntries are not explicitly typed,
     * we must determine the type of the provided default value first.
     * Returns $$ENUMVALUE$$ in case of EnumEntry without default value
     * @param eve
     */
    public static getEnumValueExprType(eve: EnumValueExpr): "int" | "double" | "bool" | "string" | "$$ENUMVAL$$" {
        if (eve.val.ref != undefined && eve.val.ref.value != undefined) {
            const valExpr = eve.val.ref.value;
            if (isNumberExpr(valExpr)) {
                if (Number.isInteger(valExpr.value)) {
                    return "int";
                }
                return "double";
            } else if (isBoolExpr(valExpr)) {
                return "bool";
            }
            return "string";
        }
        return "$$ENUMVAL$$";
    }

    /**
     * Determine the typ of a ImplicitlyTypedValue based on its value.
     * Those are most present in the Function- and the Instance for-Loop
     * @param itv ImplicitlyTypedValue to be typed
     */
    public static getImplicitlyTypedValue(itv: ImplicitlyTypedValue): "int" | "double" | "bool" | "string" {
        const arithExprType = this.getArithExprType(itv.val);
        if (this.isIntArithExpr(itv.val)) {
            return "int";
        }
        if (arithExprType == "NumberExpr") {
            return "double";
        } else if (arithExprType == "BoolExpr") {
            return "bool";
        } else if (arithExprType == "StringExpr") {
            return "string";
        }
        return "string";
    }

    /**
     * Determine the type of a function return statement. In case of a constant value,
     * treat as implicitly typed value and retrieve its type. In case of variable,
     * query the variable type.
     * @param fr FunctionReturn to type
     */
    public static getFunctionReturnStatementType(fr: FunctionReturn): string {
        if (fr.val != undefined && fr.var == undefined) {
            if (this.isEnumValueArithExpr(fr.val.val)) {
                return this.getEnumValueExprEnumName((fr.val.val as EnumValueExpr)) ?? "unknown";
            } else {
                return this.getImplicitlyTypedValue(fr.val);
            }
        } else if (fr.val == undefined && fr.var != undefined && fr.var.ref != undefined) {
            if (fr.var.ref.typing.dtype != undefined && fr.var.ref.typing.type == undefined) {
                return fr.var.ref.typing.dtype;
            } else if (fr.var.ref.typing.dtype == undefined && fr.var.ref.typing.type != undefined && fr.var.ref.typing.type.ref != undefined) {
                return this.getQualifiedClassName(fr.var.ref.typing.type.ref, fr.var.ref.typing.type.ref.name);
            }
        }
        return "unknown";
    }

    /**
     * Determine the function return type based on the function signature.
     * @param func Function whose return value is to be determined
     */
    public static getFunctionSignatureReturnType(func: IFunction): string {
        if (func.typing != undefined && func.typing.dtype != undefined && func.typing.type == undefined) {
            return func.typing.dtype;
        } else if (func.typing != undefined && func.typing.dtype == undefined && func.typing.type != undefined && func.typing.type.ref != undefined) {
            return this.getQualifiedClassName(func.typing.type.ref, func.typing.type.ref.name);
        }
        return "";
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
    public static getVariableTyping(v: Variable): {
        dtype: "bool" | "double" | "float" | "int" | "string" | "tuple" | undefined;
        type: Class | Enum | Interface | undefined
    } {
        if (isTypedVariable(v)) {
            return {dtype: v.typing.dtype, type: v.typing.type?.ref};
        } else if (isFunctionVariable(v)) {
            return {dtype: "tuple", type: undefined};
        } else if (isUntypedVariable(v)) {
            if (isFunctionLoop(v.$container)) {
                return {dtype: "int", type: undefined};
            } else if (isInstanceLoop(v.$container)) {
                if (v.$container.ref.ref != undefined && v.$container.ref.ref.type.ref != undefined) {
                    return {dtype: undefined, type: v.$container.ref.ref.type.ref};
                }
            }
        }
        return {dtype: undefined, type: undefined};
    }

    /**
     * Determine the underlying enum name of an EnumValueExpr
     * @param node EnumValueExpr whose Enumname should be determined
     */
    public static getEnumValueExprEnumName(node: EnumValueExpr): string | undefined {
        const target = node.val.$refText;
        const splitted = target.split("::");
        if (splitted.length != 2) {
            return undefined;
        }
        return splitted.at(0);
    }

    /**
     * Determine the unified enum type.
     * Since enums are not explicitly typed, we must determine the types of all provided default values.
     * If there is no unified type, return $$ENUMVAL$$
     * @param node Enum to be typed
     */
    public static getEnumType(node: Enum): "int" | "double" | "bool" | "string" | "$$ENUMVAL$$" {
        const types = [...new Set(node.entries.map(entry => this.getEnumValueExprType({val: {ref: entry}} as EnumValueExpr)))];
        if (types.length == 1) {
            return types.at(0) ?? "$$ENUMVAL$$";
        } else if (types.length == 2 && (types.includes("int") && types.includes("double"))) {
            return "double";
        }
        return "$$ENUMVAL$$";
    }

    /**
     * Collect all contained variables. We use this function to collect variables in loops
     * recursively.
     * @param fs Starting point of the Variable search
     */
    public static getFunctionStatementDeepVariableNames(fs: FunctionStatement): Variable[] {
        if (isFunctionAssignment(fs)) {
            return [fs.var];
        } else if (isFunctionLoop(fs)) {
            const fVars: Variable[] = [];
            fVars.push(fs.var);
            fs.statements.forEach(stmt => {
                fVars.push(...this.getFunctionStatementDeepVariableNames(stmt));
            });
            return fVars;
        } else {
            return [];
        }
    }

    /**
     * Determine all interited abstract elements, that means all classes and interfaces
     * that are somehow implemented or extended from the given ArbstractElement
     * @param ae Starting element
     */
    public static getAllInheritedAbstractElements(ae: AbstractElement): AbstractElement[] {
        const abstElements: AbstractElement[] = [];
        if (isEnum(ae)) {
            abstElements.push(ae)
        } else if (isClass(ae)) {
            abstElements.push(ae)
            ae.extendedClasses.forEach(ref => {
                if (ref.ref != undefined) {
                    abstElements.push(...this.getAllInheritedAbstractElements(ref.ref))
                }
            })
            ae.implementedInterfaces.forEach(ref => {
                if (ref.ref != undefined) {
                    abstElements.push(...this.getAllInheritedAbstractElements(ref.ref))
                }
            })
        } else if (isInterface(ae)) {
            abstElements.push(ae)
            ae.extendedInterfaces.forEach(ref => {
                if (ref.ref != undefined) {
                    abstElements.push(...this.getAllInheritedAbstractElements(ref.ref))
                }
            })
        }
        return abstElements
    }
}