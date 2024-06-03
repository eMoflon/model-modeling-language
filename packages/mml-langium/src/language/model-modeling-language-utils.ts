import {AstNode, URI, UriUtils} from "langium";
import {
    AbstractElement,
    CReference,
    EnumEntry,
    EnumValueExpr,
    FunctionReturn,
    FunctionStatement,
    IFunction,
    isClass,
    isEnum,
    isFunctionAssignment,
    isFunctionLoop,
    isInterface,
    isPackage,
    TypedVariable,
    Variable
} from "./generated/ast.js";
import {ExprType, ExprUtils} from "./expr-utils.js";

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
     * Determine the type of a function return statement. In case of a constant value,
     * treat as implicitly typed value and retrieve its type. In case of variable,
     * query the variable type.
     * @param fr FunctionReturn to type
     */
    public static getFunctionReturnStatementType(fr: FunctionReturn): string {
        if (fr.val != undefined && fr.var == undefined) {
            if (ExprUtils.isEnumValueExpression(fr.val.val)) {
                return this.getEnumValueExprEnumName((fr.val.val as EnumValueExpr)) ?? "unknown";
            } else {
                return ExprType.toMMLType(ExprUtils.getImplicitlyTypedValue(fr.val)) ?? "unknown";
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

    public static resolveRelativeModelImport(path: string, currentUri: URI): URI | undefined {
        if (path === undefined || path.length === 0) {
            return undefined;
        }
        const dirUri = UriUtils.dirname(currentUri);
        let grammarPath = path;
        if (!grammarPath.endsWith('.mml')) {
            grammarPath += '.mml';
        }
        return UriUtils.resolvePath(dirUri, grammarPath);
    }
}