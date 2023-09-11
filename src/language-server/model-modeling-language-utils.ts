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
} from "./generated/ast";

export class ModelModelingLanguageUtils {
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
        if (isStringExpr(valExpr) && stringType === "string") {
            return true;
        }
        if (isBoolExpr(valExpr) && stringType === "bool") {
            return true;
        }
        return isNumberExpr(valExpr) && (stringType === "double" || stringType === "int");

    }

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

    public static isBoolArithExpr(expr: ArithExpr): boolean {
        return isBoolExpr(expr) || this.getArithExprType(expr) == "BoolExpr";
    }

    public static isNumberArithExpr(expr: ArithExpr): boolean {
        return isNumberExpr(expr) || this.getArithExprType(expr) == "NumberExpr";
    }

    public static isStringArithExpr(expr: ArithExpr): boolean {
        return isStringExpr(expr) || this.getArithExprType(expr) == "StringExpr";
    }

    public static isEnumValueArithExpr(expr: ArithExpr): boolean {
        return isEnumValueExpr(expr);
    }

    public static isFunctionVariableSelectorArithExpr(expr: ArithExpr): boolean {
        return isFunctionVariableSelectorExpr(expr);
    }

    public static getInstanceVariableType(instVar: TypedVariable): string {
        if (instVar.typing.type == undefined && instVar.typing.dtype != undefined) {
            return instVar.typing.dtype;
        }
        if (instVar.typing.type != undefined && instVar.typing.dtype == undefined && instVar.typing.type.ref != undefined) {
            return this.getQualifiedClassName(instVar.typing.type.ref, instVar.typing.type.ref.name);
        }
        return "unknown";
    }

    public static getEnumValueExprType(eve: EnumValueExpr): "int" | "double" | "bool" | "string" | "enumval" {
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
        return "enumval";
    }

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

    public static getFunctionSignatureReturnType(func: IFunction): string {
        if (func.typing != undefined && func.typing.dtype != undefined && func.typing.type == undefined) {
            return func.typing.dtype;
        } else if (func.typing != undefined && func.typing.dtype == undefined && func.typing.type != undefined && func.typing.type.ref != undefined) {
            return this.getQualifiedClassName(func.typing.type.ref, func.typing.type.ref.name);
        }
        return "";
    }

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

    public static getEnumValueExprEnumName(node: EnumValueExpr): string | undefined {
        const target = node.val.$refText;
        const splitted = target.split("::");
        if (splitted.length != 2) {
            return undefined;
        }
        return splitted.at(0);
    }

    public static getEnumType(node: Enum): "int" | "double" | "bool" | "string" | "enumval" {
        const types = [...new Set(node.entries.map(entry => this.getEnumValueExprType({val: {ref: entry}} as EnumValueExpr)))];
        if (types.length == 1) {
            return types.at(0) ?? "enumval";
        } else if (types.length == 2 && (types.includes("int") && types.includes("double"))) {
            return "double";
        }
        return "enumval";
    }

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