import {AstNode} from "langium";
import {
    ArithExpr,
    FunctionReturn,
    IFunction,
    ImplicitlyTypedValue,
    InstanceVariable,
    isBoolExpr,
    isClass,
    isNumberExpr,
    isPackage,
    isStringExpr
} from "./generated/ast";
import {InvalidArgumentError} from "commander";

export class ModelModelingLanguageUtils {
    public static getQualifiedRefName(node: AstNode, name: string): string {
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
            if (lType == "BinaryExpression") {
                lType = this.getArithExprType(arith.left);
            }
            if (rType == "BinaryExpression") {
                rType = this.getArithExprType(arith.right);
            }
            if (lType == rType && lType != "BoolExpr") {
                return lType;
            }
            return "StringExpr";
        }
        return arith.$type;
    }

    public static isIntArithExpr(arith: ArithExpr): boolean {
        if (arith.$type === "BinaryExpression") {
            return this.isIntArithExpr(arith.left) && this.isIntArithExpr(arith.right);
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

    public static getInstanceVariableType(instVar: InstanceVariable): string {
        if (instVar.type == undefined && instVar.dtype != undefined) {
            return instVar.dtype;
        }
        if (instVar.type != undefined && instVar.dtype == undefined && instVar.type.ref != undefined) {
            return this.getQualifiedClassName(instVar.type.ref, instVar.type.ref.name);
        }
        return "unknown";
    }

    public static getImplicitlyTypedValue(itv: ImplicitlyTypedValue): "int" | "double" | "bool" | "string" {
        if (this.isIntArithExpr(itv.val)) {
            return "int";
        } else if (this.isNumberArithExpr(itv.val)) {
            return "double";
        } else if (this.isBoolArithExpr(itv.val)) {
            return "bool";
        } else if (this.isStringArithExpr(itv.val)) {
            return "string";
        }
        return "string";
    }

    public static getFunctionReturnStatementType(fr: FunctionReturn): string {
        if (fr.val != undefined && fr.var == undefined) {
            return this.getImplicitlyTypedValue(fr.val);
        } else if (fr.val == undefined && fr.var != undefined && fr.var.ref != undefined) {
            if (fr.var.ref.dtype != undefined && fr.var.ref.type == undefined) {
                return fr.var.ref.dtype;
            } else if (fr.var.ref.dtype == undefined && fr.var.ref.type != undefined && fr.var.ref.type.ref != undefined) {
                return this.getQualifiedClassName(fr.var.ref.type.ref, fr.var.ref.type.ref.name);
            }
        }
        throw new InvalidArgumentError("Invalid return statement configuration");
    }

    public static getFunctionSignatureReturnType(func: IFunction): string {
        if (func.dtype != undefined && func.type == undefined) {
            return func.dtype;
        } else if (func.dtype == undefined && func.type != undefined && func.type.ref != undefined) {
            return this.getQualifiedClassName(func.type.ref, func.type.ref.name);
        }
        return "";
    }
}